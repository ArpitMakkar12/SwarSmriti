from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

import config
import db
from routes.people_route import require_person
from services import cohere_client

router = APIRouter()


class TrainRequest(BaseModel):
    person_id: str  # whose memory this is
    text: str
    tags: list[str] = []
    source: str = "text"  # "text" or "voice"


@router.post("/train")
def train_memory(data: TrainRequest):
    require_person(data.person_id)
    text = data.text.strip()
    if len(text) < config.MIN_MEMORY_CHARS:
        raise HTTPException(400, f"Please share at least {config.MIN_MEMORY_CHARS} characters.")
    if len(text) > config.MAX_MEMORY_CHARS:
        raise HTTPException(400, f"Please keep one memory under {config.MAX_MEMORY_CHARS} characters. Split longer stories into parts.")

    summary, suggested_tags = cohere_client.summarize_and_tag(text)
    user_tags = [t.strip().lower() for t in data.tags if t.strip()]
    tags = list(dict.fromkeys(user_tags + suggested_tags))  # merge, keep order, no duplicates

    embedding = cohere_client.embed([text], "search_document")[0]
    memory = db.add_memory(
        person_id=data.person_id,
        text=text,
        summary=summary,
        tags=tags,
        source="voice" if data.source == "voice" else "text",
        embedding=embedding,
    )
    db.log_activity(data.person_id, "memory", summary)
    return {"status": "success", "data": memory}