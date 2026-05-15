# Gamma

Gamma is a clinical assistant for dental departments. It records doctor-patient conversations, transcribes them via Whisper or Google Cloud STT, and uses GPT-4.1 to generate SOAP notes. A built-in SOP checklist flags missed questions during interviews.

## Run
```
python -m uvicorn main:app --reload --app-dir app
```

## Structure
- `app/` — Backend (FastAPI)
- `data/audio/` — Audio file storage
