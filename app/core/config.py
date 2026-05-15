# app/core/config.py
from pathlib import Path
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # App
    APP_TITLE: str = "Gamma AI Clinical Assistant"
    DEBUG: bool = False

    # Database
    DATABASE_URL: str = "sqlite:///./gamma.db"

    # OpenAI
    OPENAI_API_KEY: str = ""
    WHISPER_MODEL: str = "whisper-1"
    SOAP_LLM_MODEL: str = "gpt-4.1"

    # Deepgram (Phase 4)
    DEEPGRAM_API_KEY: str = ""

    # NeMo
    NEMO_ASR_MODEL: str = "stt_zh_conformer_transducer_large"

    # Google Cloud STT
    GOOGLE_APPLICATION_CREDENTIALS: str = ""

    # Audio
    AUDIO_DIR: str = "data/audio"

    # Streaming
    CHUNK_DURATION_SEC: int = 5

    class Config:
        env_file = str(Path(__file__).resolve().parent.parent / ".env")
        env_file_encoding = "utf-8"


settings = Settings()
