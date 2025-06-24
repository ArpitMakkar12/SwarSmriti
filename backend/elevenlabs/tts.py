import os
import requests

ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")

def generate_speech(text: str) -> str:
    url = "https://api.elevenlabs.io/v1/text-to-speech/YOUR_VOICE_ID"
    headers = {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json"
    }
    payload = {
        "text": text,
        "voice_settings": {
            "stability": 0.5,
            "similarity_boost": 0.75
        }
    }

    response = requests.post(url, json=payload, headers=headers)
    response.raise_for_status()

    # Save to a file or return audio bytes
    audio_filename = f"output_{hash(text)}.mp3"
    with open(audio_filename, "wb") as f:
        f.write(response.content)

    return f"/static/{audio_filename}"  # If serving via static files
