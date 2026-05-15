# app/routers/audio.py
from __future__ import annotations

import logging
import time
from pathlib import Path

from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.orm import Session
from fastapi.responses import FileResponse

from app.core.config import settings
from app.core.exceptions import CaseNotFound, AudioNotFound
from app.db.database import get_db
from app.db.models import Case
from app.services.whisper_stt import transcribe_audio_file

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/cases", tags=["audio"])

AUDIO_DIR = Path(settings.AUDIO_DIR)


@router.post("/{case_id}/audio")
async def upload_audio(
    case_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise CaseNotFound(case_id)

    case_dir = AUDIO_DIR / str(case_id)
    case_dir.mkdir(parents=True, exist_ok=True)

    suffix = Path(file.filename).suffix or ".dat"
    safe_name = Path(file.filename).stem
    filename = f"{int(time.time())}_{safe_name}{suffix}"
    save_path = case_dir / filename

    data = await file.read()
    save_path.write_bytes(data)

    case.audio_path = str(save_path).replace("\\", "/")
    case.status = "has_audio"
    db.commit()
    db.refresh(case)

    logger.info("Audio uploaded for case %d: %s (%d bytes)", case_id, filename, len(data))

    return {
        "ok": True,
        "case_id": case_id,
        "audio_path": case.audio_path,
        "bytes": len(data),
        "content_type": file.content_type,
        "filename": file.filename,
    }


@router.get("/{case_id}/audio/latest")
def get_latest_audio(case_id: int, db: Session = Depends(get_db)):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case or not case.audio_path:
        raise AudioNotFound(case_id)

    p = Path(case.audio_path)
    if not p.exists():
        raise AudioNotFound(case_id)

    return FileResponse(str(p))


@router.post("/{case_id}/transcribe")
def transcribe_case(case_id: int, db: Session = Depends(get_db)):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise CaseNotFound(case_id)

    if not case.audio_path:
        raise AudioNotFound(case_id)

    audio_path = Path(case.audio_path)
    if not audio_path.exists():
        raise AudioNotFound(case_id)

    case.status = "transcribing"
    db.commit()

    logger.info("Transcribing case %d: %s", case_id, audio_path)

    try:
        # Anti-hallucination prompt for medical transcription
        prompt_text = "This is a medical conversation. Do not hallucinate! If there is no audio or it is unclear, leave it blank. Never guess words or generate unrelated subtitles."
        text_out = transcribe_audio_file(str(audio_path), prompt=prompt_text)
    except Exception as e:
        case.status = "transcribe_failed"
        db.commit()
        logger.error("Whisper failed for case %d: %s", case_id, e)
        return {"ok": False, "error": f"Whisper failed: {type(e).__name__}: {str(e)}"}

    case.transcript_raw = text_out
    case.status = "transcribed"
    db.commit()
    db.refresh(case)

    logger.info("Transcription complete for case %d (%d chars)", case_id, len(text_out))

    return {
        "id": case.id,
        "status": case.status,
        "transcript_raw": case.transcript_raw,
    }
