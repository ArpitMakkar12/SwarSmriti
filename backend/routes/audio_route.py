from fastapi import APIRouter
from fastapi.responses import StreamingResponse
import asyncio

router = APIRouter()

from shared_audio_cache import AUDIO_CACHE
@router.get("/audio/{audio_id}")
async def get_audio(audio_id: str):
    print(f"🔎 Audio request received for ID: {audio_id}")
    print(f"🧾 Available IDs in cache: {list(AUDIO_CACHE.keys())}")

    audio_segments = AUDIO_CACHE.get(audio_id)
    if not audio_segments:
        return {"status": "error", "detail": "Invalid or expired audio ID"}

    async def audio_stream():
        for segment in audio_segments:
            yield segment
            await asyncio.sleep(0.05)

    return StreamingResponse(audio_stream(), media_type="audio/mpeg")
