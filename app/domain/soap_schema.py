# app/domain/soap_schema.py
from __future__ import annotations

from typing import Annotated, List, Literal

from pydantic import BaseModel, BeforeValidator, Field


# ---------------------------------------------------------------------------
# Coercion helpers – the LLM sometimes returns "Needs review" or other free
# text for fields that should be a strict Literal set. Instead of crashing
# with a ValidationError we silently fall back to "unknown".
# ---------------------------------------------------------------------------

def _coerce_yes_no_unknown(v: object) -> str:
    if isinstance(v, str) and v.strip().lower() in ("yes", "no", "unknown"):
        return v.strip().lower()
    return "unknown"


def _coerce_pain_pattern(v: object) -> str:
    if isinstance(v, str) and v.strip().lower() in ("intermittent", "continuous", "unknown"):
        return v.strip().lower()
    return "unknown"


YesNoUnknown = Annotated[
    Literal["yes", "no", "unknown"],
    BeforeValidator(_coerce_yes_no_unknown),
]

PainPattern = Annotated[
    Literal["intermittent", "continuous", "unknown"],
    BeforeValidator(_coerce_pain_pattern),
]


# ---------------------------------------------------------------------------
# Schema models
# ---------------------------------------------------------------------------

class TOCC(BaseModel):
    travel_history: str = "Needs review"
    occupation: str = "Needs review"
    contact_history: str = "Needs review"
    cluster: YesNoUnknown = "unknown"


class RiskFactor(BaseModel):
    status: YesNoUnknown = "unknown"
    details: str = "Needs review"


class RiskFactors(BaseModel):
    alcohol: RiskFactor = RiskFactor()
    betel_nut: RiskFactor = RiskFactor()
    cigarettes: RiskFactor = RiskFactor()


class Subjective(BaseModel):
    cc: str = "Needs review"
    pi: str = "Needs review"
    pmh: str = "Needs review"
    pdh: str = "Needs review"
    current_medication: str = "Needs review"
    drug_allergy_history: str = "Needs review"
    birth_history: str = "Needs review"
    vaccination_history: str = "Needs review"
    tocc: TOCC = TOCC()
    risk_factors: RiskFactors = RiskFactors()
    family_history: str = "Needs review"


class Objective(BaseModel):
    pain_score: str = "Needs review"
    pain_pattern: PainPattern = "unknown"
    pain_location: str = "Needs review"
    extraoral_findings: str = "Needs review"
    intraoral_findings: str = "Needs review"
    present_dentition: str = "Needs review"


class Assessment(BaseModel):
    location: str = "Needs review"
    diagnosis: str = "Needs review"


class Plan(BaseModel):
    treatment_plan: List[str] = Field(default_factory=lambda: ["Needs review"])


class SoapSchema(BaseModel):
    subjective: Subjective = Subjective()
    objective: Objective = Objective()
    assessment: Assessment = Assessment()
    plan: Plan = Plan()
