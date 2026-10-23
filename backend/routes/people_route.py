"""The family: everyone being remembered. Each person has their own memories and voice."""
from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from pydantic import BaseModel

import config
import db
from errors import ServiceError
from services import elevenlabs_client

router = APIRouter()


class PersonIn(BaseModel):
    name: str
    about: str = ""


def require_person(person_id: str) -> dict:
    """Look a person up or stop with 404. Also used by the train, chat and memories routes."""
    person = db.get_person(person_id)
    if not person:
        raise HTTPException(404, "That person isn't in the family archive (they may have been removed).")
    return person


def public(person: dict) -> dict:
    """What the browser gets: everything except the private ElevenLabs voice_id."""
    return {
        "id": person["id"],
        "name": person["name"],
        "about": person["about"],
        "has_cloned_voice": bool(person["voice_id"]),
        "memory_count": person["memory_count"],
        "created_at": person["created_at"],
    }


def _clean(data: PersonIn) -> tuple[str, str]:
    name = data.name.strip()
    if not name:
        raise HTTPException(400, "Please enter a name.")
    return name[:80], data.about.strip()[:2000]


@router.get("/people")
def list_people():
    return {"status": "success", "data": [public(p) for p in db.list_people()]}


@router.post("/people")
def create_person(data: PersonIn):
    name, about = _clean(data)
    return {"status": "success", "data": public(db.create_person(name, about))}


@router.get("/people/{person_id}")
def get_person(person_id: str):
    return {"status": "success", "data": public(require_person(person_id))}


@router.put("/people/{person_id}")
def update_person(person_id: str, data: PersonIn):
    require_person(person_id)
    name, about = _clean(data)
    return {"status": "success", "data": public(db.update_person(person_id, name, about))}


@router.delete("/people/{person_id}")
def delete_person(person_id: str):
    """Removes the person, all their memories, and their cloned voice on ElevenLabs."""
    person = require_person(person_id)
    if person["voice_id"]:
        try:
            elevenlabs_client.delete_voice(person["voice_id"])
        except ServiceError:
            pass  # don't block removing the person if ElevenLabs is unreachable
    db.delete_person(person_id)
    return {"status": "success"}


@router.post("/people/{person_id}/voice")
def clone_voice(person_id: str, files: list[UploadFile] = File(...), consent: bool = Form(False)):
    """Creates an ElevenLabs voice clone for this person from 1-5 recordings."""
    person = require_person(person_id)
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

    new_voice_id = elevenlabs_client.clone_voice(f"SwarSmriti - {person['name']}", samples)
    db.set_voice_id(person_id, new_voice_id)
    if person["voice_id"]:  # free the old voice slot on ElevenLabs
        try:
            elevenlabs_client.delete_voice(person["voice_id"])
        except ServiceError:
            pass

    db.log_activity(person_id, "voice_clone", "Voice updated")
    return {"status": "success", "data": public(require_person(person_id))}


@router.delete("/people/{person_id}/voice")
def remove_voice(person_id: str):
    person = require_person(person_id)
    if person["voice_id"]:
        elevenlabs_client.delete_voice(person["voice_id"])
        db.set_voice_id(person_id, None)
    return {"status": "success", "data": public(require_person(person_id))}