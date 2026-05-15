# app/core/exceptions.py
from __future__ import annotations
from fastapi import Request
from fastapi.responses import JSONResponse


class GammaError(Exception):
    """Base exception for all Gamma errors."""
    def __init__(self, status_code: int, detail: str):
        self.status_code = status_code
        self.detail = detail


class CaseNotFound(GammaError):
    def __init__(self, case_id: int):
        super().__init__(404, f"Case {case_id} not found")


class AudioNotFound(GammaError):
    def __init__(self, case_id: int):
        super().__init__(404, f"Audio for case {case_id} not found")


class TranscriptEmpty(GammaError):
    def __init__(self):
        super().__init__(400, "Transcript is empty or not usable")


async def gamma_exception_handler(request: Request, exc: GammaError):
    return JSONResponse(
        status_code=exc.status_code,
        content={"ok": False, "detail": exc.detail},
    )
