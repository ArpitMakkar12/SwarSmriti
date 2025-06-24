import os
import httpx
import re
from dotenv import load_dotenv

load_dotenv()

ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")
ELEVENLABS_VOICE_ID = os.getenv("ELEVENLABS_VOICE_ID", "EXAVITQu4vr4xnSDxMaL")

BASE_URL = "https://api.elevenlabs.io/v1/text-to-speech"

async def text_to_speech(text: str) -> bytes:
    url = f"{BASE_URL}/{ELEVENLABS_VOICE_ID}"
    
    headers = {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
        "Accept": "audio/mpeg"  # Critical header for audio stream
    }

    payload = {
        "model_id": "eleven_multilingual_v2",
        "voice_settings": {
            "stability": 0.5,
            "similarity_boost": 0.5
        },
        "text": text
    }

    print("🔎 ElevenLabs TTS Request")
    print("URL:", url)
    print("Headers:", headers)
    print("Payload:", payload)


    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(url, headers=headers, json=payload)
            print("📥 Status Code:", response.status_code)
            print("📥 Response Text:", response.text)
            response.raise_for_status()
            return response.content
    except httpx.HTTPStatusError as e:
        print("❌ ElevenLabs API returned an error:")
        print("Status Code:", e.response.status_code)
        print("Response Body:", e.response.text)
        raise


def split_text_into_chunks(text, max_length=250):
    sentences = re.split(r'(?<=[.!?]) +', text)
    chunks = []
    current = ""
    for sentence in sentences:
        if len(current) + len(sentence) <= max_length:
            current += " " + sentence
        else:
            chunks.append(current.strip())
            current = sentence
    if current:
        chunks.append(current.strip())
    return chunks

# Debug prints
print("ELEVENLABS_API_KEY:", ELEVENLABS_API_KEY)
print("ELEVENLABS_VOICE_ID:", ELEVENLABS_VOICE_ID)
