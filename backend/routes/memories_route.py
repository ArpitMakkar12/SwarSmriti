from fastapi import APIRouter
from chroma_local.memory_manager import collection

router = APIRouter()

@router.get("/memories")
async def get_memories():
    try:
        # Get all memories from ChromaDB
        results = collection.get()
        
        memories = []
        for i, doc in enumerate(results['documents']):
            metadata = results['metadatas'][i]
            memories.append({
                "id": results['ids'][i],
                "text": doc,
                "summary": metadata.get('summary', ''),
                "tags": metadata.get('tags', '').split(',') if metadata.get('tags') else [],
                "timestamp": metadata.get('timestamp', ''),
                "voice_path_url": metadata.get('voice_path_url', '')
            })
        
        return {"status": "success", "data": memories}
    except Exception as e:
        return {"status": "error", "message": str(e)}
