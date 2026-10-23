from fastapi import APIRouter, HTTPException

import db
from routes.people_route import require_person

router = APIRouter()


@router.get("/memories")
def get_memories(person_id: str):
    """All memories of one person, newest first. Called as /memories?person_id=..."""
    require_person(person_id)
    return {"status": "success", "data": db.list_memories(person_id)}


@router.delete("/memories/{memory_id}")
def delete_memory(memory_id: str):
    if not db.delete_memory(memory_id):
        raise HTTPException(404, "Memory not found.")
    return {"status": "success"}


@router.get("/stats")
def get_stats(person_id: str):
    """Real numbers for the Home page, for one person. Called as /stats?person_id=..."""
    require_person(person_id)
    return {"status": "success", "data": db.get_stats(person_id)}