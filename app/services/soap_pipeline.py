from sqlalchemy.orm import Session

from app.domain.soap_schema import SoapSchema
from app.services.soap_generator import generate_soap
from app.services.soap_renderer import render_soap
from app.db.models import SoapVersion


def generate_and_save_soap(
    *,
    db: Session,
    case_id: int,
    transcript_text: str,
) -> SoapVersion:
    # 1) LLM → JSON string
    soap_json_str = generate_soap(transcript_text)

    # 2) JSON string → schema validated object
    soap = SoapSchema.model_validate_json(soap_json_str)

    # 3) schema → fixed text
    rendered = render_soap(soap)

    # 4) save version
    version = SoapVersion(
        case_id=case_id,
        schema_json=soap.model_dump_json(ensure_ascii=False),
        rendered_text=rendered,
    )
    db.add(version)
    db.commit()
    db.refresh(version)

    return version


    

