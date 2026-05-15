# app/routers/demo.py
from __future__ import annotations

import logging
import shutil
from pathlib import Path

from fastapi import APIRouter, Depends, Body, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.db.database import get_db

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/demo", tags=["demo"])


@router.post("/reset")
def demo_reset(payload: dict = Body(...), db: Session = Depends(get_db)):
    if payload.get("confirm") != "RESET":
        raise HTTPException(status_code=400, detail="Invalid confirmation")

    logger.warning("DEMO RESET triggered — clearing all data")

    db.execute(text("DELETE FROM transcript_segments;"))
    db.execute(text("DELETE FROM speaker_mappings;"))
    db.execute(text("DELETE FROM soap_versions;"))
    db.execute(text("DELETE FROM cases;"))

    try:
        db.execute(text("DELETE FROM sqlite_sequence WHERE name='cases';"))
        db.execute(text("DELETE FROM sqlite_sequence WHERE name='soap_versions';"))
        db.execute(text("DELETE FROM sqlite_sequence WHERE name='transcript_segments';"))
        db.execute(text("DELETE FROM sqlite_sequence WHERE name='speaker_mappings';"))
    except Exception:
        pass

    db.commit()

    audio_root = Path("data/audio")
    if audio_root.exists():
        shutil.rmtree(audio_root)
    audio_root.mkdir(parents=True, exist_ok=True)

    logger.info("Demo reset completed.")
    return {"ok": True, "message": "Demo reset completed. Database and audio cleared."}
