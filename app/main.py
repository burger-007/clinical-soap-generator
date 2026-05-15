# app/main.py
"""Gamma — App assembly. All routes defined in routers/."""
from __future__ import annotations

import logging

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.core.logging import setup_logging
from app.core.middleware import setup_middleware
from app.core.exceptions import GammaError, gamma_exception_handler
from app.db.database import engine
from app.db.models import Base

from app.routers import health, cases, audio, soap, sop, demo, streaming

logger = logging.getLogger(__name__)


def _run_migrations():
    """Add missing columns to existing tables (simple schema migration)."""
    from sqlalchemy import text
    migrations = [
        "ALTER TABLE cases ADD COLUMN live_mode BOOLEAN DEFAULT 0",
        "ALTER TABLE cases ADD COLUMN recording_state VARCHAR DEFAULT 'idle'",
    ]
    with engine.connect() as conn:
        for sql in migrations:
            try:
                conn.execute(text(sql))
                conn.commit()
                logger.info("Migration OK: %s", sql[:60])
            except Exception:
                pass  # Column already exists


def create_app() -> FastAPI:
    setup_logging(settings.DEBUG)

    Base.metadata.create_all(bind=engine)
    _run_migrations()

    app = FastAPI(title=settings.APP_TITLE)
    setup_middleware(app)
    app.add_exception_handler(GammaError, gamma_exception_handler)
    from pathlib import Path
    static_path = Path(__file__).parent / "static"
    # print(f"DEBUG: Mounting static files from {static_path.resolve()}")
    app.mount("/static", StaticFiles(directory=str(static_path)), name="static")

    app.include_router(health.router)
    app.include_router(cases.router)
    app.include_router(audio.router)
    app.include_router(soap.router)
    app.include_router(sop.router)
    app.include_router(demo.router)
    app.include_router(streaming.router)

    logger.info("Gamma started — DB: %s", settings.DATABASE_URL)
    return app


app = create_app()
