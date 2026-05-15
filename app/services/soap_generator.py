from pathlib import Path
from openai import OpenAI

from app.core.config import settings
client = OpenAI(api_key=settings.OPENAI_API_KEY)

PROMPT_PATH = Path(__file__).parent / "soap_prompt.txt"


def _strip_markdown_fences(text: str) -> str:
    """Remove ```json ... ``` wrapping if present."""
    t = text.strip()
    if t.startswith("```"):
        lines = t.split("\n")
        # Remove first line (```json) and last line (```)
        lines = [l for l in lines if not l.strip().startswith("```")]
        t = "\n".join(lines)
    return t.strip()


def generate_soap(transcript_clean: str) -> str:
    """
    Returns: SOAP JSON (string)
    """
    prompt_template = PROMPT_PATH.read_text(encoding="utf-8")
    prompt = prompt_template.replace("<<<TRANSCRIPT_CLEAN>>>", transcript_clean)

    response = client.responses.create(
        model="gpt-4.1-mini",
        input=prompt,
    )

    return _strip_markdown_fences(response.output_text)



