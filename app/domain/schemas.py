from pydantic import BaseModel

class TranscriptCleanUpdate(BaseModel):
    transcript_clean: str
    