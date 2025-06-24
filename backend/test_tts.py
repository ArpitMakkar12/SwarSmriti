import requests

url = "https://api.elevenlabs.io/v1/text-to-speech/EXAVITQu4vr4xnSDxMaL"
headers = {
    "Accept": "audio/mpeg",
    "Content-Type": "application/json",
    "xi-api-key": "sk_cf9928551f969af26de7b85017f835263f923ed85c0649d7"
}
data = {
    "text": "Hello from ElevenLabs!",
    "model_id": "eleven_multilingual_v2",
    "voice_settings": {
        "stability": 0.5,
        "similarity_boost": 0.5
    }
}

response = requests.post(url, headers=headers, json=data)

if response.status_code == 200:
    with open("test.mp3", "wb") as f:
        f.write(response.content)
    print("✅ Success! Saved test.mp3")
else:
    print(f"❌ Error {response.status_code}: {response.text}")
