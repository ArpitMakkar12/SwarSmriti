import json

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from pydantic import BaseModel

import config
import db
from routes.people_route import require_person
from services import persona, speech

router = APIRouter()


class Turn(BaseModel):
    role: str  # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    person_id: str  # who you are talking with
    question: str
    history: list[Turn] = []


@router.post("/chat")
def chat(data: ChatRequest):
    person = require_person(data.person_id)
    question = data.question.strip()
    if not question:
        raise HTTPException(400, "Please type a message.")
    result = persona.answer(person, question, [t.model_dump() for t in data.history])
    db.log_activity(person["id"], "chat", question)
    return {"status": "success", "data": result}


@router.post("/voice-chat")
def voice_chat(person_id: str = Form(...), audio: UploadFile = File(...), history: str = Form("[]")):
    person = require_person(person_id)
    wav = audio.file.read(config.MAX_UPLOAD_BYTES + 1)
    if len(wav) > config.MAX_UPLOAD_BYTES:
        raise HTTPException(413, "Recording is too long. Keep voice messages under a minute or two.")

    transcript = speech.transcribe_wav(wav)
    if len(transcript) < 2:
        raise HTTPException(422, "I couldn't hear any words in that recording. Please try again, a little closer to the mic.")

    try:
        past = json.loads(history)
    except json.JSONDecodeError:
        past = []

    result = persona.answer(person, transcript, past if isinstance(past, list) else [])
    db.log_activity(person["id"], "voice_chat", transcript)
    return {"status": "success", "data": {"transcript": transcript, **result}}