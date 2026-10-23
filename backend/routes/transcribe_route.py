from fastapi import APIRouter, File, HTTPException, UploadFile

import config
from services import speech

router = APIRouter()


@router.post("/transcribe")
def transcribe_audio(file: UploadFile = File(...)):
    """Turns a recorded memory into text so the user can review it before saving."""
    wav = file.file.read(config.MAX_UPLOAD_BYTES + 1)
    if len(wav) > config.MAX_UPLOAD_BYTES:
        raise HTTPException(413, "Recording is too long. Try recording it in shorter parts.")
    return {"status": "success", "data": {"transcript": speech.transcribe_wav(wav)}}