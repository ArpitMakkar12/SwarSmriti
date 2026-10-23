from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from pydantic import BaseModel

import config
import db
from errors import ServiceError
from services import elevenlabs_client

router = APIRouter()


class ProfileUpdate(BaseModel):
    name: str
    about: str = ""


def _public(profile: dict) -> dict:
    return {"name": profile["name"], "about": profile["about"], "has_cloned_voice": bool(profile["voice_id"])}


@router.get("/profile")
def get_profile():
    return {"status": "success", "data": _public(db.get_profile())}


@router.put("/profile")
def update_profile(data: ProfileUpdate):
    name = data.name.strip()
    if not name:
        raise HTTPException(400, "Please enter a name.")
    profile = db.update_profile(name[:80], data.about.strip()[:2000])
    return {"status": "success", "data": _public(profile)}


@router.post("/profile/voice")
def clone_voice(files: list[UploadFile] = File(...), consent: bool = Form(False)):
    """Creates an ElevenLabs voice clone from 1-5 recordings of the person."""
    if not consent:
        raise HTTPException(400, "Please confirm you have the right to use this voice.")
    if not 1 <= len(files) <= 5:
        raise HTTPException(400, "Upload between 1 and 5 recordings.")

    samples, total = [], 0
    for f in files:
        content = f.file.read(config.MAX_UPLOAD_BYTES + 1)
        total += len(content)
        if len(content) > config.MAX_UPLOAD_BYTES or total > 3 * config.MAX_UPLOAD_BYTES:
            raise HTTPException(413, "Recordings are too large. Use shorter clips (1-2 minutes each is plenty).")
        samples.append((f.filename or "sample.wav", content, f.content_type or "application/octet-stream"))

    profile = db.get_profile()
    new_voice_id = elevenlabs_client.clone_voice(f"SwarSmriti - {profile['name'] or 'persona'}", samples)

    old_voice_id = profile["voice_id"]
    db.set_voice_id(new_voice_id)
    if old_voice_id:  # free the old voice slot on ElevenLabs
        try:
            elevenlabs_client.delete_voice(old_voice_id)
        except ServiceError:
            pass

    db.log_activity("voice_clone", "Voice clone updated")
    return {"status": "success", "data": _public(db.get_profile())}


@router.delete("/profile/voice")
def remove_voice():
    profile = db.get_profile()
    if profile["voice_id"]:
        elevenlabs_client.delete_voice(profile["voice_id"])
        db.set_voice_id(None)
    return {"status": "success", "data": _public(db.get_profile())}