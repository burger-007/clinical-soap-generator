# app/routers/cases.py
"""Case CRUD + transcript patch."""
from __future__ import annotations

import logging
from datetime import datetime

from fastapi import APIRouter, Depends
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.exceptions import CaseNotFound
from app.db.database import get_db
from app.db.models import Case

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/cases", tags=["cases"])


# ----------------------------
# Case CRUD
# ----------------------------
@router.post("")
def create_case(db: Session = Depends(get_db)):
    c = Case(status="new")
    db.add(c)
    db.commit()
    db.refresh(c)
    logger.info("Created case %d", c.id)
    return {"id": c.id, "status": c.status}


@router.get("/{case_id}")
def get_case(case_id: int, db: Session = Depends(get_db)):
    c = db.get(Case, case_id)
    if not c:
        raise CaseNotFound(case_id)
    return {
        "id": c.id,
        "status": c.status,
        "audio_path": getattr(c, "audio_path", None),
        "transcript_raw": c.transcript_raw,
        "transcript_clean": c.transcript_clean,
    }


# ----------------------------
# Transcript clean PATCH
# ----------------------------
class CaseUpdate(BaseModel):
    transcript_clean: str | None = None


@router.patch("/{case_id}")
def update_case(case_id: int, payload: CaseUpdate, db: Session = Depends(get_db)):
    c = db.query(Case).filter(Case.id == case_id).first()
    if not c:
        raise CaseNotFound(case_id)

    if payload.transcript_clean is not None:
        c.transcript_clean = payload.transcript_clean
        c.status = "cleaned"

    c.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(c)
    return {
        "id": c.id,
        "status": c.status,
        "transcript_clean": c.transcript_clean,
        "updated_at": str(c.updated_at),
    }


# ----------------------------
# Transcript editor UI
# ----------------------------
@router.get("/{case_id}/ui", response_class=HTMLResponse)
def ui_case(case_id: int, db: Session = Depends(get_db)):
    c = db.get(Case, case_id)
    if not c:
        raise CaseNotFound(case_id)

    transcript = c.transcript_raw or "(no transcript yet)"

    return f"""
    <html>
    <body style="font-family:sans-serif;padding:16px;">
        <h2>Case #{c.id}</h2>
        <div>Status: <b>{c.status}</b></div>
        <h3>transcript_raw</h3>
        <pre style="white-space:pre-wrap;background:#f5f5f5;padding:12px;border-radius:8px;">{transcript}</pre>
        <h3>transcript_clean（可編輯）</h3>
        <textarea id="ta"
          style="width:100%;height:40vh;font-size:14px;padding:12px;border-radius:8px;border:1px solid #ddd;"
          placeholder="在這裡修正逐字稿…">{c.transcript_clean or ""}</textarea>
        <div style="margin-top:12px;">
            <button onclick="save()" style="padding:8px 14px;">Save</button>
            <span id="msg" style="margin-left:10px;color:#666;"></span>
        </div>
        <script>
            const caseId = {c.id};
            async function save() {{
                const ta = document.getElementById("ta");
                const msg = document.getElementById("msg");
                if (msg) msg.textContent = "Saving...";
                const res = await fetch(`/cases/${{caseId}}`, {{
                    method: "PATCH",
                    headers: {{ "Content-Type": "application/json" }},
                    body: JSON.stringify({{ transcript_clean: ta.value }})
                }});
                if (res.ok) {{
                    if (msg) msg.textContent = "Saved ✅";
                }} else {{
                    const t = await res.text();
                    if (msg) msg.textContent = "Save failed: " + t;
                }}
            }}
        </script>
    </body>
    </html>
    """
