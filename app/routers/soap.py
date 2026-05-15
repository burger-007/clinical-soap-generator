# app/routers/soap.py
from __future__ import annotations

import json
import logging

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import PlainTextResponse
from sqlalchemy.orm import Session

from app.core.exceptions import CaseNotFound
from app.core.status import SoapStatus
from app.db.database import get_db
from app.db.models import Case, SoapVersion
from app.services.soap_pipeline import generate_and_save_soap

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/cases", tags=["soap"])


# ----------------------------
# 逐字稿品質檢查
# ----------------------------
def _is_transcript_usable(text: str) -> tuple[bool, str]:
    t = (text or "").strip()
    if not t:
        return False, "empty"
    if len(t) < 8:
        return False, "too_short"
    zh_count = sum(1 for c in t if "\u4e00" <= c <= "\u9fff")
    if zh_count / max(len(t), 1) < 0.05:
        return False, "low_chinese_ratio"
    if "啊啊啊" in t or "哈哈哈" in t:
        return False, "nonsense_repetition"
    return True, "ok"


@router.post("/{case_id}/soap_versions")
def create_soap_version(case_id: int, db: Session = Depends(get_db)):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise CaseNotFound(case_id)

    source_text = case.transcript_clean or case.transcript_raw
    if not source_text:
        case.soap_status = SoapStatus.NEEDS_REVIEW
        db.commit()
        return {"ok": False, "status": SoapStatus.NEEDS_REVIEW, "reason": "no_transcript", "version_id": None}

    usable, reason = _is_transcript_usable(source_text)
    if not usable:
        case.soap_status = SoapStatus.NEEDS_REVIEW
        db.commit()
        return {"ok": False, "status": SoapStatus.NEEDS_REVIEW, "reason": reason, "version_id": None}

    case.soap_status = SoapStatus.RUNNING
    db.commit()
    db.refresh(case)

    logger.info("Generating SOAP for case %d", case_id)

    try:
        version = generate_and_save_soap(db=db, case_id=case.id, transcript_text=source_text)
        case.soap_status = SoapStatus.SUCCESS
        db.commit()
        db.refresh(case)

        return {
            "ok": True,
            "status": SoapStatus.SUCCESS,
            "version_id": version.id,
            "rendered_text": version.rendered_text,
            "soap_json": json.loads(version.schema_json) if version.schema_json else None,
            "created_at": version.created_at,
        }
    except Exception as e:
        case.soap_status = SoapStatus.FAILED
        db.commit()
        logger.error("SOAP generation failed for case %d: %s", case_id, e)
        return {"ok": False, "status": SoapStatus.FAILED, "error": f"{type(e).__name__}: {str(e)}", "version_id": None}


@router.get("/{case_id}/soap_versions")
def list_soap_versions(case_id: int, db: Session = Depends(get_db)):
    versions = (
        db.query(SoapVersion)
        .filter(SoapVersion.case_id == case_id)
        .order_by(SoapVersion.created_at.desc())
        .all()
    )
    return [{"version_id": v.id, "created_at": v.created_at} for v in versions]


@router.get("/soap_versions/{version_id}")
def get_soap_version(version_id: int, db: Session = Depends(get_db)):
    v = db.query(SoapVersion).filter(SoapVersion.id == version_id).first()
    if not v:
        raise HTTPException(status_code=404, detail="SoapVersion not found")
    return {
        "version_id": v.id,
        "case_id": v.case_id,
        "created_at": v.created_at,
        "schema_json": v.schema_json,
        "rendered_text": v.rendered_text,
    }


@router.get("/soap_versions/{version_id}/rendered_text", response_class=PlainTextResponse)
def get_soap_version_rendered_text(version_id: int, db: Session = Depends(get_db)):
    v = db.query(SoapVersion).filter(SoapVersion.id == version_id).first()
    if not v:
        raise HTTPException(status_code=404, detail="SoapVersion not found")
    return v.rendered_text or ""
