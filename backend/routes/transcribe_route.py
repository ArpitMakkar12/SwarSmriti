from fastapi import APIRouter, File, UploadFile
from fastapi.responses import JSONResponse
from routes.vosk_transcriber import transcribe_from_path
import shutil
import os
import uuid

router = APIRouter()

@router.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    try:
        if not file.filename.endswith(".wav"):
            return JSONResponse(
                status_code=400,
                content={"error": "Only .wav files are supported. Please upload a WAV file (mono, 16-bit PCM)."}
            )

        # Save uploaded .wav file to disk
        temp_wav = f"temp_{uuid.uuid4()}.wav"
        with open(temp_wav, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Transcribe directly
        transcript = transcribe_from_path(temp_wav)

        # Cleanup
        os.remove(temp_wav)

        return {"transcript": transcript}

    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})
