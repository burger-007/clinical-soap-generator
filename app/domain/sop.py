# app/domain/sop.py
"""
Dental Clinical SOP — structured data module.
Used by both backend (LLM analysis) and frontend (keyword scanning).
"""

DENTAL_CLINICAL_SOP = {
    "meta": {
        "name": "Dental & Oral Medicine Clinical Encounter SOP",
        "scope": "initial consultation / oral medicine",
        "purpose": "ensure completeness of clinical history taking",
        "note": "for supervision and prompting only, not for diagnosis",
    },

    # =========================================================
    # LEVEL 0 — General first visit skeleton (all cases)
    # =========================================================
    "level_0_general": {
        "patient_identification": {
            "required": True,
            "items": ["age", "sex", "visit_type"],
        },
        "chief_complaint": {
            "required": True,
            "description": "patient's own words describing the main problem",
        },
        "present_illness_history": {
            "required": True,
            "core_elements": [
                "onset", "duration", "progression", "site", "associated_symptoms",
            ],
        },
    },

    # =========================================================
    # LEVEL 1 — Chief complaint oriented modules
    # =========================================================
    "level_1_chief_complaint_modules": {
        "pain": {
            "label_zh": "Pain (Toothache / Orofacial Pain)",
            "description": "toothache or orofacial pain",
            "required_history": [
                {"id": "onset",                    "type": "temporal",   "label_zh": "Onset"},
                {"id": "duration",                 "type": "temporal",   "label_zh": "Duration"},
                {"id": "quality",                  "type": "symptom",    "label_zh": "Pain Quality"},
                {"id": "severity",                 "type": "symptom",    "label_zh": "Severity"},
                {"id": "location",                 "type": "anatomical", "label_zh": "Pain Location"},
                {"id": "radiation",                "type": "pattern",    "label_zh": "Radiation"},
                {"id": "triggering_factors",       "type": "pattern",    "label_zh": "Triggering Factors"},
                {"id": "relieving_factors",        "type": "pattern",    "label_zh": "Relieving Factors"},
                {"id": "spontaneous_or_stimulated","type": "pattern",    "label_zh": "Spontaneous / Stimulated"},
            ],
            "red_flags": ["night_pain", "neurological_symptoms", "rapid_worsening"],
        },
        "oral_mucosal_lesion": {
            "label_zh": "Oral Ulcer / Mucosal Lesion",
            "description": "ulceration or mucosal abnormality",
            "required_history": [
                {"id": "duration",               "type": "temporal",   "label_zh": "Duration"},
                {"id": "recurrence",             "type": "pattern",    "label_zh": "Recurrence"},
                {"id": "number_of_lesions",      "type": "morphology", "label_zh": "Number of Lesions"},
                {"id": "site",                   "type": "anatomical", "label_zh": "Lesion Site"},
                {"id": "pain",                   "type": "symptom",    "label_zh": "Pain Level"},
                {"id": "healing_pattern",        "type": "pattern",    "label_zh": "Healing Pattern"},
                {"id": "systemic_symptoms",      "type": "systemic",   "label_zh": "Systemic Symptoms"},
                {"id": "drug_history",           "type": "risk",       "label_zh": "Drug History"},
                {"id": "immunocompromised_status","type": "risk",       "label_zh": "Immune Status"},
            ],
            "red_flags": ["non_healing_over_2_weeks", "induration", "unexplained_bleeding"],
        },
        "swelling": {
            "label_zh": "Swelling / Mass",
            "description": "oral or facial swelling or mass",
            "required_history": [
                {"id": "onset",          "type": "temporal",   "label_zh": "Onset"},
                {"id": "growth_rate",    "type": "pattern",    "label_zh": "Growth Rate"},
                {"id": "pain",           "type": "symptom",    "label_zh": "Pain Level"},
                {"id": "consistency",    "type": "morphology", "label_zh": "Consistency"},
                {"id": "fluctuation",    "type": "morphology", "label_zh": "Fluctuation"},
                {"id": "infection_signs","type": "systemic",   "label_zh": "Signs of Infection"},
                {"id": "trauma_history", "type": "risk",       "label_zh": "Trauma History"},
            ],
            "red_flags": ["rapid_progression", "airway_symptoms", "systemic_fever"],
        },
        "xerostomia": {
            "label_zh": "Xerostomia / Salivary Issue",
            "description": "subjective dry mouth or salivary dysfunction",
            "required_history": [
                {"id": "onset",                       "type": "temporal", "label_zh": "Onset"},
                {"id": "severity",                    "type": "symptom",  "label_zh": "Severity"},
                {"id": "day_night_variation",          "type": "pattern",  "label_zh": "Day/Night Variation"},
                {"id": "medication_history",           "type": "risk",     "label_zh": "Medication History"},
                {"id": "autoimmune_disease_history",   "type": "risk",     "label_zh": "Autoimmune Disease Hx"},
                {"id": "dry_eyes",                    "type": "systemic", "label_zh": "Dry Eyes"},
                {"id": "salivary_gland_swelling",      "type": "red_flag", "label_zh": "Salivary Gland Swelling"},
            ],
            "red_flags": ["bilateral_gland_enlargement", "systemic_autoimmune_features"],
        },
        "potentially_malignant_disorder": {
            "label_zh": "Leukoplakia / Erythroplakia / Precancerous Lesion",
            "description": "leukoplakia, erythroplakia, suspicious mucosal lesions",
            "required_history": [
                {"id": "duration",         "type": "temporal",  "label_zh": "Duration"},
                {"id": "change_over_time", "type": "red_flag",  "label_zh": "Change Over Time"},
                {"id": "pain",             "type": "symptom",   "label_zh": "Pain Level"},
                {"id": "smoking_history",  "type": "risk",      "label_zh": "Smoking History"},
                {"id": "alcohol_use",      "type": "risk",      "label_zh": "Alcohol Use"},
                {"id": "local_irritation", "type": "risk",      "label_zh": "Local Irritation"},
                {"id": "previous_biopsy",  "type": "red_flag",  "label_zh": "Previous Biopsy"},
            ],
            "red_flags": ["induration", "ulceration", "rapid_change"],
        },
    },

    # =========================================================
    # LEVEL 2 — Common mandatory modules (most frequently missed)
    # =========================================================
    "level_2_common_mandatory": {
        "medical_history": {
            "required": True,
            "items": ["cardiovascular_disease", "diabetes", "immunological_disease"],
        },
        "medication_and_allergy": {
            "required": True,
            "items": ["anticoagulant_use", "bisphosphonate_use", "drug_allergy"],
        },
    },

    # =========================================================
    # LEVEL 3 — Oral examination
    # =========================================================
    "level_3_oral_examination": {
        "inspection": ["exact_site", "approximate_size", "surface_character"],
        "palpation": ["consistency", "tenderness", "fixation"],
        "related_teeth_status": ["mobility", "caries", "periapical_symptoms"],
    },

    # =========================================================
    # LEVEL 4 — Initial assessment
    # =========================================================
    "level_4_initial_assessment": {
        "problem_list": True,
        "risk_stratification": [
            "needs_urgent_referral", "needs_imaging",
            "needs_biopsy", "follow_up_required",
        ],
    },
}


# ---------------------------------------------------------
# Helper: flatten SOP → list of checkable items
# ---------------------------------------------------------
SOP_FLAT_ITEMS: list[dict] = []

def _build_flat():
    """Build once at import time."""
    items = SOP_FLAT_ITEMS

    # L0
    for item_id in ["age", "sex", "visit_type"]:
        items.append({"id": item_id, "level": 0, "module": "patient_identification",
                       "label_en": item_id.replace("_", " ").title(),
                       "label_zh": {"age": "Age", "sex": "Sex", "visit_type": "Visit Type"}[item_id]})

    items.append({"id": "chief_complaint", "level": 0, "module": "chief_complaint",
                   "label_en": "Chief Complaint", "label_zh": "Chief Complaint"})

    for item_id in ["onset", "duration", "progression", "site", "associated_symptoms"]:
        items.append({"id": f"pi_{item_id}", "level": 0, "module": "present_illness_history",
                       "label_en": item_id.replace("_", " ").title(),
                       "label_zh": {"onset": "Onset", "duration": "Duration", "progression": "Progression",
                                    "site": "Site", "associated_symptoms": "Associated Symptoms"}[item_id]})

    # L1 — per module
    l1 = DENTAL_CLINICAL_SOP["level_1_chief_complaint_modules"]
    for mod_key, mod in l1.items():
        for h in mod["required_history"]:
            items.append({
                "id": f"l1_{mod_key}_{h['id']}",
                "level": 1,
                "module": mod_key,
                "label_en": h["id"].replace("_", " ").title(),
                "label_zh": h.get("label_zh", h["id"]),
                "type": h.get("type", ""),
            })

    # L2
    l2_labels = {
        "cardiovascular_disease": "Cardiovascular Disease", "diabetes": "Diabetes",
        "immunological_disease": "Immunological Disease",
        "anticoagulant_use": "Anticoagulant Use", "bisphosphonate_use": "Bisphosphonate Use",
        "drug_allergy": "Drug Allergy",
    }
    for group in DENTAL_CLINICAL_SOP["level_2_common_mandatory"].values():
        for item_id in group["items"]:
            items.append({"id": f"l2_{item_id}", "level": 2, "module": "common_mandatory",
                           "label_en": item_id.replace("_", " ").title(),
                           "label_zh": l2_labels.get(item_id, item_id)})

_build_flat()


def get_sop_items_flat(*, level: int | None = None, module: str | None = None) -> list[dict]:
    """Return flat list of SOP items, optionally filtered."""
    out = SOP_FLAT_ITEMS
    if level is not None:
        out = [i for i in out if i["level"] == level]
    if module is not None:
        out = [i for i in out if i["module"] == module]
    return out


def get_red_flags(module: str) -> list[str]:
    """Return red flag IDs for a given L1 module."""
    l1 = DENTAL_CLINICAL_SOP["level_1_chief_complaint_modules"]
    mod = l1.get(module)
    if not mod:
        return []
    return mod.get("red_flags", [])


def get_l1_module_keys() -> list[str]:
    return list(DENTAL_CLINICAL_SOP["level_1_chief_complaint_modules"].keys())


RED_FLAG_LABELS = {
    "night_pain": "Night Pain",
    "neurological_symptoms": "Neurological Symptoms",
    "rapid_worsening": "Rapid Worsening",
    "non_healing_over_2_weeks": "Non-healing > 2 Weeks",
    "induration": "Induration",
    "unexplained_bleeding": "Unexplained Bleeding",
    "rapid_progression": "Rapid Progression",
    "airway_symptoms": "Airway Symptoms",
    "systemic_fever": "Systemic Fever",
    "bilateral_gland_enlargement": "Bilateral Gland Enlargement",
    "systemic_autoimmune_features": "Systemic Autoimmune Features",
    "ulceration": "Ulceration",
    "rapid_change": "Rapid Change",
}
