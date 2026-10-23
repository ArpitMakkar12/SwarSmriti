from fastapi import APIRouter, HTTPException

import db

router = APIRouter()


@router.get("/memories")
def get_memories():
    return {"status": "success", "data": db.list_memories()}


@router.delete("/memories/{memory_id}")
def delete_memory(memory_id: str):
    if not db.delete_memory(memory_id):
        raise HTTPException(404, "Memory not found.")
    return {"status": "success"}


@router.get("/stats")
def get_stats():
    """Real numbers for the dashboard (the old dashboard showed made-up ones)."""
    return {"status": "success", "data": db.get_stats()}