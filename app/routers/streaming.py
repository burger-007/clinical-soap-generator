# app/routers/streaming.py
"""
WebSocket endpoint for live streaming transcription.

Pipeline:
  Mic (16kHz mono PCM)
  → NoiseReduction (RNNoise)
  → VAD (Silero, threshold=0.6)
  → SpeechBuffer (2–4s segments, 0.3s overlap)
  → Google Cloud Speech-to-Text (Streaming, model=latest_long, punctuation=true)
  → ConfidenceFilter (confidence ≥ 0.75)
  → FinalTranscript
"""
from __future__ import annotations

import asyncio
import logging

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.db.database import SessionLocal
from app.db.models import Case, TranscriptSegment
from app.services.google_stt import SpeechPipeline, SAMPLE_RATE, SAMPLE_WIDTH, CHANNELS

logger = logging.getLogger(__name__)

router = APIRouter(tags=["streaming"])

# Audio bookkeeping
CHUNK_DURATION_SEC = 4  # used only for elapsed-time accounting per segment


@router.websocket("/ws/stream/{case_id}")
async def stream_transcription(websocket: WebSocket, case_id: int):
    """
    WebSocket: browser audio → full STT pipeline → transcript back to browser.

    Browser sends: binary audio frames (PCM Linear16, 16kHz, mono)
    Browser receives: JSON {"type": "transcript", "text": "...", "is_final": true}
    Browser sends text "STOP" to end the session.
    """
    await websocket.accept()
    logger.info("WS stream connected for case %d", case_id)

    db = SessionLocal()

    try:
        # ── Validate case ────────────────────────────────────────────
        case = db.query(Case).filter(Case.id == case_id).first()
        if not case:
            await websocket.send_json({"type": "error", "message": f"Case {case_id} not found"})
            await websocket.close()
            db.close()
            return

        case.live_mode = True
        case.recording_state = "recording"
        db.commit()

        await websocket.send_json({"type": "status", "message": "connected"})

        # ── Initialise pipeline ──────────────────────────────────────
        pipeline = SpeechPipeline(language_code="zh-TW")

        chunk_counter = 0
        all_segments: list[dict] = []
        elapsed_sec = 0.0

        try:
            while True:
                msg = await websocket.receive()

                if msg.get("type") == "websocket.disconnect":
                    break

                if "text" in msg:
                    text_data = msg["text"]
                    if text_data == "STOP":
                        logger.info("STOP received for case %d", case_id)
                        break
                    
                    # Handle frontend JSON actions (like role toggling) gracefully
                    try:
                        import json
                        cmd = json.loads(text_data)
                        if cmd.get("action") == "set_speaker_role":
                            # Echo back so frontend updates its UI (even if we don't store it here yet)
                            await websocket.send_json({
                                "type": "role_updated",
                                "speaker": cmd["speaker"],
                                "role": cmd["role"]
                            })
                    except Exception:
                        pass


                elif "bytes" in msg:
                    raw_pcm = msg["bytes"]

                    # ── Run pipeline (blocking work in executor) ─────
                    loop = asyncio.get_event_loop()
                    transcripts = await loop.run_in_executor(
                        None, pipeline.process_audio, raw_pcm
                    )

                    for is_final, text in transcripts:
                        if not text:
                            continue

                        if not is_final:
                            # Send interim result
                            await websocket.send_json({
                                "type": "transcript",
                                "text": text,
                                "speaker": "0",
                                "role": "doctor",
                                "is_final": False,
                                "start": round(elapsed_sec, 2),
                                "end": round(elapsed_sec + 0.1, 2),
                            })
                        else:
                            chunk_counter += 1
                            start_sec = elapsed_sec
                            seg_duration = len(raw_pcm) / (SAMPLE_RATE * SAMPLE_WIDTH * CHANNELS)
                            elapsed_sec += seg_duration
                            end_sec = elapsed_sec

                            # Send final result to browser
                            await websocket.send_json({
                                "type": "transcript",
                                "text": text,
                                "speaker": "0",
                                "role": "doctor",
                                "is_final": True,
                                "start": round(start_sec, 2),
                                "end": round(end_sec, 2),
                            })

                            # Persist to DB
                            seg = TranscriptSegment(
                                case_id=case_id,
                                chunk_index=chunk_counter,
                                start_sec=start_sec,
                                end_sec=end_sec,
                                speaker_raw="0",
                                speaker_role="doctor",
                                text=text,
                                is_final=True,
                            )
                            db.add(seg)
                            db.commit()

                            all_segments.append({"text": text, "role": "doctor"})

        except WebSocketDisconnect:
            logger.info("Browser WS disconnected for case %d", case_id)

        # ── Flush remaining audio ────────────────────────────────────
        loop = asyncio.get_event_loop()
        remaining_text = await loop.run_in_executor(None, pipeline.flush)
        if remaining_text:
            chunk_counter += 1
            start_sec = elapsed_sec
            end_sec = elapsed_sec + 0.5  # approximate
            await websocket.send_json({
                "type": "transcript",
                "text": remaining_text,
                "speaker": "0",
                "role": "doctor",
                "is_final": True,
                "start": round(start_sec, 2),
                "end": round(end_sec, 2),
            })
            seg = TranscriptSegment(
                case_id=case_id,
                chunk_index=chunk_counter,
                start_sec=start_sec,
                end_sec=end_sec,
                speaker_raw="0",
                speaker_role="doctor",
                text=remaining_text,
                is_final=True,
            )
            db.add(seg)
            db.commit()
            all_segments.append({"text": remaining_text, "role": "doctor"})

        # ── Build full transcript and save ───────────────────────────
        full_lines = [seg["text"] for seg in all_segments]
        full_transcript = "\n".join(full_lines)
        case.transcript_raw = full_transcript
        case.recording_state = "done"
        db.commit()

        await websocket.send_json({
            "type": "done",
            "transcript": full_transcript,
            "segment_count": len(all_segments),
        })
        logger.info("Stream done for case %d: %d segments", case_id, len(all_segments))

    except Exception as e:
        logger.error("Stream error for case %d: %s", case_id, e)
        try:
            await websocket.send_json({"type": "error", "message": str(e)})
        except Exception:
            pass
    finally:
        case = db.query(Case).filter(Case.id == case_id).first()
        if case:
            case.recording_state = "done"
            db.commit()
        db.close()
        try:
            await websocket.close()
        except Exception:
            pass
