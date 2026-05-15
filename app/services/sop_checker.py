# app/services/sop_checker.py
"""
SOP coverage checker — uses GPT-4.1 to analyze transcript against SOP items.
"""
from __future__ import annotations

import json
from pathlib import Path

from openai import OpenAI

from app.domain.sop import (
    get_sop_items_flat,
    get_red_flags,
    get_l1_module_keys,
    RED_FLAG_LABELS,
)

from app.core.config import settings
client = OpenAI(api_key=settings.OPENAI_API_KEY)

PROMPT_PATH = Path(__file__).parent / "sop_check_prompt.txt"


def _build_sop_items_text() -> str:
    """Build a compact text listing of all SOP items for the prompt."""
    lines = []
    current_level = -1
    for item in get_sop_items_flat():
        if item["level"] != current_level:
            current_level = item["level"]
            lines.append(f"\n## Level {current_level}")
        lines.append(f"- {item['id']}: {item['label_zh']} ({item['label_en']})")
    return "\n".join(lines)


def _build_red_flags_text() -> str:
    """Build compact red flags listing for the prompt."""
    lines = []
    for mod_key in get_l1_module_keys():
        flags = get_red_flags(mod_key)
        if flags:
            labels = [f"{f} ({RED_FLAG_LABELS.get(f, f)})" for f in flags]
            lines.append(f"- {mod_key}: {', '.join(labels)}")
    return "\n".join(lines)


def check_sop_coverage(transcript: str) -> dict:
    """
    Call GPT-4.1 to analyze transcript against the SOP.

    Returns dict with keys:
      - detected_modules: list[str]
      - items: dict[str, {"status": str, "evidence": str}]
      - red_flags_detected: list[str]
      - next_questions: list[str]
    """
    if not transcript or not transcript.strip():
        # Return all-missing for empty transcript
        all_items = get_sop_items_flat()
        return {
            "detected_modules": [],
            "items": {item["id"]: {"status": "missing", "evidence": ""} for item in all_items},
            "red_flags_detected": [],
            "next_questions": ["Please start the interview by describing the patient's basic information and chief complaint."],
        }

    prompt_template = PROMPT_PATH.read_text(encoding="utf-8")
    prompt = (
        prompt_template
        .replace("<<<SOP_ITEMS>>>", _build_sop_items_text())
        .replace("<<<RED_FLAGS>>>", _build_red_flags_text())
        .replace("<<<TRANSCRIPT>>>", transcript)
    )

    response = client.responses.create(
        model="gpt-4.1-mini",
        input=prompt,
    )

    raw = response.output_text.strip()

    # Strip markdown code fences if present
    if raw.startswith("```"):
        lines = raw.split("\n")
        # Remove first and last lines (```json and ```)
        lines = [l for l in lines if not l.strip().startswith("```")]
        raw = "\n".join(lines)

    try:
        result = json.loads(raw)
    except json.JSONDecodeError:
        # Fallback: return minimal structure
        return {
            "detected_modules": [],
            "items": {},
            "red_flags_detected": [],
            "next_questions": ["LLM returned an abnormal format, please try again."],
            "_raw": raw,
        }

    # Ensure expected keys exist
    result.setdefault("detected_modules", [])
    result.setdefault("items", {})
    result.setdefault("red_flags_detected", [])
    result.setdefault("next_questions", [])

    return result
