"""All settings in one place, read from environment variables.

Locally they come from backend/.env (never commit that file).
On Render they come from the service's Environment tab.
"""
import os

from dotenv import load_dotenv

load_dotenv()

# --- Required secrets -------------------------------------------------------
DATABASE_URL = os.getenv("DATABASE_URL", "")
COHERE_API_KEY = os.getenv("COHERE_API_KEY", "")
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY", "")

# --- Models (safe defaults, override only if you know why) ------------------
COHERE_CHAT_MODEL = os.getenv("COHERE_CHAT_MODEL", "command-a-03-2025")
COHERE_EMBED_MODEL = os.getenv("COHERE_EMBED_MODEL", "embed-v4.0")
EMBED_DIM = 1024  # the memories table is created with this vector size

# Voice used until a cloned voice is set on the Persona page ("Sarah", a premade voice)
ELEVENLABS_DEFAULT_VOICE_ID = os.getenv("ELEVENLABS_DEFAULT_VOICE_ID", "EXAVITQu4vr4xnSDxMaL")
ELEVENLABS_TTS_MODEL = os.getenv("ELEVENLABS_TTS_MODEL", "eleven_multilingual_v2")

# --- App behaviour ----------------------------------------------------------
FRONTEND_ORIGINS = [
    o.strip()
    for o in os.getenv(
        "FRONTEND_ORIGINS",
        "https://swarsmriti-1.onrender.com,http://localhost:5173",
    ).split(",")
    if o.strip()
]

MIN_MEMORY_CHARS = 100
MAX_MEMORY_CHARS = 5000
MAX_UPLOAD_BYTES = 15 * 1024 * 1024  # 15 MB per audio upload
MEMORIES_PER_ANSWER = 5  # how many memories are looked up for each question