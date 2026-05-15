from openai import OpenAI

from app.core.config import settings
client = OpenAI(api_key=settings.OPENAI_API_KEY)

def transcribe_audio_file(file_path: str, prompt: str = "") -> str:
    """
    Input: local audio file path
    Output: transcript text
    """
    with open(file_path, "rb") as audio_file:
        text = client.audio.transcriptions.create(
            file=audio_file,
            model="whisper-1",
            prompt=prompt,
            response_format="text",
            temperature=0.0,
            language="zh",
        )
    return text.strip()

