# app/routers/health.py
import logging

from fastapi import APIRouter
from fastapi.responses import FileResponse

logger = logging.getLogger(__name__)

router = APIRouter(tags=["health"])


@router.get("/")
def home():
    return FileResponse("app/static/index.html")


@router.get("/health")
def health():
    return {"status": "ok"}
