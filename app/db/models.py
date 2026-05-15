from __future__ import annotations

from datetime import datetime

from sqlalchemy import Column, Integer, String, DateTime, Text, Float, Boolean, ForeignKey
from sqlalchemy.orm import declarative_base
from sqlalchemy.sql import func

Base = declarative_base()


class Case(Base):
    __tablename__ = "cases"

    id = Column(Integer, primary_key=True, index=True)

    # 狀態（你原本用 new/has_audio/transcribed 都可以照用）
    status = Column(String, default="new", nullable=False)

    # 音檔路徑（✅ 錄音上傳會寫入這裡）
    audio_path = Column(String, nullable=True)

    # 逐字稿
    transcript_raw = Column(Text, nullable=True)
    transcript_clean = Column(Text, nullable=True)

    # SOAP 狀態（如果你 DB 有這欄就留，沒有也不會影響目前 upload/audio）
    soap_status = Column(String, nullable=True)

    # Live streaming
    live_mode = Column(Boolean, default=False, nullable=False)
    recording_state = Column(String, default="idle", nullable=False)  # idle | recording | done

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class SoapVersion(Base):
    __tablename__ = "soap_versions"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id"), nullable=False, index=True)

    schema_json = Column(Text, nullable=False)
    rendered_text = Column(Text, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class TranscriptSegment(Base):
    __tablename__ = "transcript_segments"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id"), nullable=False, index=True)

    chunk_index = Column(Integer, nullable=False)           # sequential order
    start_sec = Column(Float, nullable=True)                # start time in audio
    end_sec = Column(Float, nullable=True)                  # end time in audio
    speaker_raw = Column(String, nullable=True)             # e.g. "0", "1"
    speaker_role = Column(String, nullable=True)            # e.g. "doctor", "patient"
    text = Column(Text, nullable=False)
    is_final = Column(Boolean, default=True, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class SpeakerMapping(Base):
    __tablename__ = "speaker_mappings"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id"), nullable=False, index=True)
    speaker_raw = Column(String, nullable=False)            # e.g. "0"
    role = Column(String, nullable=False)                   # e.g. "doctor"

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
