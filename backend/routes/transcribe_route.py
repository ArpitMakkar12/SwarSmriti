from fastapi import APIRouter, File, UploadFile
from fastapi.responses import JSONResponse
from backend.routes.vosk_transcriber import transcribe_from_path
import shutil
import os
import subprocess
import uuid

router = APIRouter()

@router.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    try:
        # Save original file
        temp_input = f"temp_input_{uuid.uuid4()}.{file.filename.split('.')[-1]}"
        with open(temp_input, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Convert to 16kHz mono WAV
        temp_wav = f"{os.path.splitext(temp_input)[0]}_converted.wav"
        command = [
            "ffmpeg",
            "-y",  # overwrite
            "-i", temp_input,
            "-ar", "16000",  # sample rate
            "-ac", "1",      # mono
            temp_wav
        ]
        subprocess.run(command, check=True)

        # Transcribe
        transcript = transcribe_from_path(temp_wav)

        # Clean up
        os.remove(temp_input)
        os.remove(temp_wav)

        return {"transcript": transcript}

    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})
