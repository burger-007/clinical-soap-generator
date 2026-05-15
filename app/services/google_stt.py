# app/services/google_stt.py
"""
Speech-to-text pipeline:
  Mic (16kHz mono PCM)
  → NoiseReduction (RNNoise / pyrnnoise)
  → VAD (Silero, threshold=0.6)
  → SpeechBuffer (2–4s segments, 0.3s overlap)
  → Google Cloud Speech-to-Text (Streaming, model=latest_long, punctuation=true)
  → ConfidenceFilter (confidence ≥ 0.75)
  → FinalTranscript
"""
from __future__ import annotations

import asyncio
import collections
import logging
import struct
from typing import AsyncGenerator, Optional

import numpy as np
import torch

from google.cloud import speech_v1 as speech

logger = logging.getLogger(__name__)

# ── Audio constants ───────────────────────────────────────────────────
SAMPLE_RATE = 16000
CHANNELS = 1
SAMPLE_WIDTH = 2  # 16-bit PCM = 2 bytes per sample
FRAME_DURATION_MS = 10  # Silero works best with 10-30 ms frames
FRAME_SIZE = SAMPLE_RATE * FRAME_DURATION_MS // 1000  # 160 samples per frame
FRAME_BYTES = FRAME_SIZE * SAMPLE_WIDTH  # 320 bytes per frame

# ── Pipeline tunables ─────────────────────────────────────────────────
VAD_THRESHOLD = 0.6
SPEECH_BUFFER_MIN_SEC = 2.0
SPEECH_BUFFER_MAX_SEC = 4.0
OVERLAP_SEC = 0.3
CONFIDENCE_THRESHOLD = 0.75

SPEECH_BUFFER_MIN_BYTES = int(SAMPLE_RATE * SAMPLE_WIDTH * SPEECH_BUFFER_MIN_SEC)
SPEECH_BUFFER_MAX_BYTES = int(SAMPLE_RATE * SAMPLE_WIDTH * SPEECH_BUFFER_MAX_SEC)
OVERLAP_BYTES = int(SAMPLE_RATE * SAMPLE_WIDTH * OVERLAP_SEC)


# =====================================================================
# 1. Noise Reduction — RNNoise via pyrnnoise
# =====================================================================
class NoiseReducer:
    """Wraps pyrnnoise for real-time 16kHz mono noise suppression."""

    def __init__(self):
        try:
            from pyrnnoise import RNNoise
            self._denoiser = RNNoise()
            self._available = True
            logger.info("RNNoise noise-reduction loaded.")
        except Exception as e:
            self._denoiser = None
            self._available = False
            logger.warning("RNNoise unavailable (%s) — skipping noise reduction.", e)

    def process(self, pcm_bytes: bytes) -> bytes:
        """Denoise a chunk of 16-bit LE PCM.  Returns cleaned PCM bytes."""
        if not self._available:
            return pcm_bytes

        # pyrnnoise expects float32 frames of 480 samples (48 kHz)
        # but we are at 16 kHz, so we process in FRAME_SIZE=160-sample frames
        # Convert to float32 normalised [-1, 1]
        samples = np.frombuffer(pcm_bytes, dtype=np.int16).astype(np.float32)

        # Process in 480-sample frames (pyrnnoise requirement)
        rnn_frame = 480
        out_samples = np.zeros_like(samples)
        idx = 0
        while idx + rnn_frame <= len(samples):
            frame = samples[idx : idx + rnn_frame]
            filtered = self._denoiser.process_frame(frame)
            out_samples[idx : idx + rnn_frame] = np.array(filtered, dtype=np.float32)
            idx += rnn_frame

        # Handle remaining samples (pass through)
        if idx < len(samples):
            out_samples[idx:] = samples[idx:]

        return out_samples.astype(np.int16).tobytes()


# =====================================================================
# 2. VAD — Silero VAD
# =====================================================================
class SileroVAD:
    """Voice Activity Detection using Silero VAD (torch hub)."""

    def __init__(self, threshold: float = VAD_THRESHOLD):
        self.threshold = threshold
        self._model = None
        self._loaded = False

    def _ensure_loaded(self):
        if self._loaded:
            return
        try:
            model, utils = torch.hub.load(
                repo_or_dir="snakers4/silero-vad",
                model="silero_vad",
                force_reload=False,
                onnx=False,
            )
            self._model = model
            self._get_speech_timestamps = utils[0]
            self._loaded = True
            logger.info("Silero VAD loaded (threshold=%.2f).", self.threshold)
        except Exception as e:
            logger.error("Failed to load Silero VAD: %s", e)
            self._loaded = False

    def is_speech(self, pcm_bytes: bytes) -> bool:
        """Return True if the frame contains speech above threshold."""
        self._ensure_loaded()
        if not self._loaded:
            return True  # Fail-open: assume speech if VAD unavailable

        samples = np.frombuffer(pcm_bytes, dtype=np.int16).astype(np.float32) / 32768.0
        tensor = torch.from_numpy(samples)
        confidence = self._model(tensor, SAMPLE_RATE).item()
        return confidence >= self.threshold

    def reset(self):
        """Reset internal state between utterances."""
        if self._loaded and hasattr(self._model, "reset_states"):
            self._model.reset_states()


# =====================================================================
# 3. Speech Buffer — accumulate speech into 2-4 s segments with overlap
# =====================================================================
class SpeechBuffer:
    """
    Accumulates PCM frames flagged as speech.
    Yields segments of 2–4 seconds with 0.3 s overlap.
    """

    def __init__(self):
        self._buf = bytearray()
        self._overlap = bytearray()

    def add_frame(self, pcm_frame: bytes) -> Optional[bytes]:
        """
        Append a speech frame.  Returns a segment (bytes) when the buffer
        reaches SPEECH_BUFFER_MAX_SEC, or None otherwise.
        """
        self._buf.extend(pcm_frame)
        if len(self._buf) >= SPEECH_BUFFER_MAX_BYTES:
            return self._flush()
        return None

    def flush_if_enough(self) -> Optional[bytes]:
        """Flush if >= SPEECH_BUFFER_MIN_SEC accumulated (e.g. after VAD goes silent)."""
        if len(self._buf) >= SPEECH_BUFFER_MIN_BYTES:
            return self._flush()
        return None

    def force_flush(self) -> Optional[bytes]:
        """Flush whatever is left (end of stream)."""
        if len(self._buf) > 0:
            return self._flush()
        return None

    def _flush(self) -> bytes:
        # Prepend overlap from previous segment
        segment = bytes(self._overlap) + bytes(self._buf)
        # Keep tail as overlap for next segment
        self._overlap = bytearray(self._buf[-OVERLAP_BYTES:]) if len(self._buf) > OVERLAP_BYTES else bytearray(self._buf)
        self._buf.clear()
        return segment

    def reset(self):
        self._buf.clear()
        self._overlap.clear()


# =====================================================================
# 4. Google Cloud Speech-to-Text Streaming
# =====================================================================
class GoogleSTTClient:
    """
    Sends PCM segments to Google Cloud Speech-to-Text
    using streaming_recognize with model=latest_long.
    """

    def __init__(self, language_code: str = "zh-TW"):
        self._client = speech.SpeechClient()
        self._config = speech.RecognitionConfig(
            encoding=speech.RecognitionConfig.AudioEncoding.LINEAR16,
            sample_rate_hertz=SAMPLE_RATE,
            language_code=language_code,
            model="latest_long",
            enable_automatic_punctuation=True,
        )
        self._streaming_config = speech.StreamingRecognitionConfig(
            config=self._config,
            interim_results=True,
        )
        logger.info("Google STT client initialised (lang=%s, model=latest_long).", language_code)

    def transcribe_segment(self, pcm_segment: bytes) -> list[dict]:
        """
        Transcribe a single PCM segment synchronously.
        Returns a list of result dicts:
          [{"transcript": str, "confidence": float, "is_final": bool}, ...]
        """
        # Build a streaming request from the single segment
        requests = [
            speech.StreamingRecognizeRequest(
                streaming_config=self._streaming_config
            ),
            speech.StreamingRecognizeRequest(audio_content=pcm_segment),
        ]

        results = []
        try:
            responses = self._client.streaming_recognize(
                config=self._streaming_config,
                requests=iter(requests),
            )
            for response in responses:
                for result in response.results:
                    if not result.alternatives:
                        continue
                    alt = result.alternatives[0]
                    results.append({
                        "transcript": alt.transcript,
                        "confidence": alt.confidence if result.is_final else 0.0,
                        "is_final": result.is_final,
                    })
        except Exception as e:
            logger.error("Google STT streaming error: %s", e)

        return results


# =====================================================================
# 5. Confidence Filter
# =====================================================================
def confidence_filter(
    results: list[dict],
    threshold: float = CONFIDENCE_THRESHOLD,
) -> str:
    """
    Keep only final results with confidence >= threshold.
    Concatenate their transcripts and return the combined string.
    """
    texts = []
    for r in results:
        if r["is_final"] and r["confidence"] >= threshold:
            t = r["transcript"].strip()
            if t:
                texts.append(t)
    return "".join(texts)


# =====================================================================
# Convenience: full pipeline runner for one PCM chunk
# =====================================================================
class SpeechPipeline:
    """
    Orchestrates: NoiseReduction → VAD → SpeechBuffer → Google STT → ConfidenceFilter.
    Designed to be called frame-by-frame from the WebSocket handler.
    """

    def __init__(self, language_code: str = "zh-TW"):
        self.noise_reducer = NoiseReducer()
        self.vad = SileroVAD(threshold=VAD_THRESHOLD)
        self.speech_buffer = SpeechBuffer()
        self.stt_client = GoogleSTTClient(language_code=language_code)
        self._silence_frames = 0
        # Number of consecutive silence frames before we consider speech ended
        # 30 frames × 30 ms ≈ 0.9 s of silence triggers segment flush
        self._silence_flush_count = 30

    def process_audio(self, pcm_chunk: bytes) -> list[tuple[bool, str]]:
        """
        Feed raw PCM bytes (any length) through the pipeline.
        Returns a list of (is_final: bool, text: str) tuples.
        When buffering speech, returns an interim (False, "（辨識中…）").
        When a segment completes, returns the final (True, transcript).
        """
        transcripts: list[tuple[bool, str]] = []

        # Denoise the entire chunk
        clean = self.noise_reducer.process(pcm_chunk)

        # Split into VAD-sized frames (512 samples = 32 ms at 16 kHz works well for Silero)
        vad_frame_samples = 512
        vad_frame_bytes = vad_frame_samples * SAMPLE_WIDTH
        offset = 0

        while offset + vad_frame_bytes <= len(clean):
            frame = clean[offset : offset + vad_frame_bytes]
            offset += vad_frame_bytes

            if self.vad.is_speech(frame):
                self._silence_frames = 0
                segment = self.speech_buffer.add_frame(frame)
                if segment:
                    text = self._transcribe_segment(segment)
                    if text:
                        transcripts.append((True, text))
                else:
                    # We are buffering active speech, emit an interim signal
                    # To avoid spamming on every frame, we could just emit one,
                    # but the websocket router will handle it.
                    if len(transcripts) == 0 or transcripts[-1][0] == True:
                         transcripts.append((False, "（辨識中…）"))

            else:
                self._silence_frames += 1
                if self._silence_frames >= self._silence_flush_count:
                    segment = self.speech_buffer.flush_if_enough()
                    if segment:
                        text = self._transcribe_segment(segment)
                        if text:
                            transcripts.append((True, text))
                    self.vad.reset()

        return transcripts

    def flush(self) -> Optional[str]:
        """Force-flush any remaining audio at end of stream."""
        segment = self.speech_buffer.force_flush()
        if segment:
            return self._transcribe_segment(segment)
        return None

    def _transcribe_segment(self, pcm_segment: bytes) -> str:
        """Run Google STT + confidence filter on one segment."""
        results = self.stt_client.transcribe_segment(pcm_segment)
        return confidence_filter(results, CONFIDENCE_THRESHOLD)

    def reset(self):
        self.vad.reset()
        self.speech_buffer.reset()
        self._silence_frames = 0
