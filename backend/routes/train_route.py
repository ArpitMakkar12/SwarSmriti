from fastapi import APIRouter
from pydantic import BaseModel
from typing import List

from routes.cohere_client import summarize
from chroma_local.memory_manager import store_memory

router = APIRouter()

class TrainRequest(BaseModel):
    text: str
    tags: List[str] = []

@router.post("/train")
async def train_memory(data: TrainRequest):
    MAX_INPUT_CHARS = 3000

    cleaned_text = data.text.strip()
    if len(cleaned_text) < 100:  # ⬅️ Allow shorter inputs (not just >250)
        return {
            "status": "error",
            "message": "Text must be at least 100 characters for training."
        }

    # Truncate if too long
    if len(cleaned_text) > MAX_INPUT_CHARS:
        cleaned_text = cleaned_text[:MAX_INPUT_CHARS]

    print("🧪 Input text length:", len(cleaned_text))

    summary = await summarize(cleaned_text)

    if summary.startswith("Error:"):
        return {
            "status": "error",
            "error_message": summary
        }

    store_memory(
        user_id="arpit",
        text=cleaned_text,
        summary=summary,
        tags=data.tags
    )

    return {
        "status": "success",
    "message": "✅ Memory stored successfully!",
    "data": {
        "summary": summary  # or whatever you're generating
    }
    }
