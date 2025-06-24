from fastapi import APIRouter, UploadFile, File
from routes.elevenlabs_client import text_to_speech, split_text_into_chunks
from routes.cohere_client import generate_answer
from shared_audio_cache import AUDIO_CACHE
from routes.vosk_transcriber import transcribe_from_path, convert_to_wav

import uuid
import os

router = APIRouter()

@router.post("/voice-chat")
async def voice_chat(audio: UploadFile = File(...)):
    print("🎤 /voice-chat endpoint hit")
    
    file_ext = audio.filename.split('.')[-1]
    temp_path = f"temp_{uuid.uuid4()}.{file_ext}"
    wav_path = None  # <== FIXED
    with open(temp_path, "wb") as f:
        f.write(await audio.read())

    try:
        print("📥 Saved audio to:", temp_path)

        # Convert the uploaded file to WAV
        wav_path = convert_to_wav(temp_path)

        # Transcribe from the WAV file
        transcript = transcribe_from_path(wav_path)
        
        print("📝 Transcript:", transcript)

        # Generate prompt intelligently
        if not transcript or len(transcript.strip()) < 3 or not any(c.isalpha() for c in transcript):
            prompt = "The user's speech was unclear or unintelligible. Respond kindly and ask them to repeat or rephrase."
        else:
            prompt = (
                f"You are a helpful and friendly AI assistant.\n"
                f"The user said: \"{transcript}\".\n"
                "Respond in a natural, human-like tone."
            )

        # Get LLM response
        answer = await generate_answer(prompt)
        print("💬 LLM Answer:", answer)

        # Convert to speech using ElevenLabs
        chunks = split_text_into_chunks(answer)
        audio_segments = []
        for chunk in chunks:
            print("🔊 TTS chunk:", chunk)
            audio_data = await text_to_speech(chunk)
            audio_segments.append(audio_data)

        # Store audio in memory cache
        audio_id = str(uuid.uuid4())
        AUDIO_CACHE[audio_id] = audio_segments

        return {
            "status": "success",
            "transcript": transcript,
            "answer": answer,
            "audio_url": f"/audio/{audio_id}"
        }

    except Exception as e:
        print("❌ ERROR:", str(e))
        import traceback
        traceback.print_exc()
        return {"status": "error", "message": str(e)}

    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)
        if os.path.exists(wav_path):
            os.remove(wav_path)
