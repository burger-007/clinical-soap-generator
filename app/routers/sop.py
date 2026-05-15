# app/routers/sop.py
from __future__ import annotations

import logging

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.exceptions import CaseNotFound
from app.db.database import get_db
from app.db.models import Case
from app.services.sop_checker import check_sop_coverage

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/cases", tags=["sop"])


@router.post("/{case_id}/sop_check")
def sop_check(case_id: int, db: Session = Depends(get_db)):
    """Analyze transcript against Dental Clinical SOP."""
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise CaseNotFound(case_id)

    source_text = case.transcript_clean or case.transcript_raw or ""

    try:
        result = check_sop_coverage(source_text)
        return {"ok": True, **result}
    except Exception as e:
        logger.error("SOP check failed for case %d: %s", case_id, e)
        return {
            "ok": False,
            "error": f"{type(e).__name__}: {str(e)}",
            "detected_modules": [],
            "items": {},
            "red_flags_detected": [],
            "next_questions": [],
        }
