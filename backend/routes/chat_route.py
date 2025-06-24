from fastapi import APIRouter
from pydantic import BaseModel
import uuid
from backend.shared_audio_cache import AUDIO_CACHE
from backend.routes.cohere_client import generate_answer
from backend.chroma_local.memory_manager import query_memory
from backend.routes.elevenlabs_client import text_to_speech, split_text_into_chunks

import asyncio

router = APIRouter()


class ChatRequest(BaseModel):
    question: str

@router.post("/chat")
async def chat_memory(data: ChatRequest):
    try:
        print(f"👉 Incoming question: {data.question}")

        # 1️⃣ Query memory
        memories, metadata = query_memory(data.question)
        context = "\n".join(memories) if memories else ""
        prompt = f"{context}\n\nQuestion: {data.question}"

        # 2️⃣ Generate answer
        answer = await generate_answer(prompt)
        print(f"✅ Answer: {answer}")

        # 3️⃣ Generate audio chunks & store
        chunks = split_text_into_chunks(answer)
        audio_segments = []
        for chunk in chunks:
            audio_data = await text_to_speech(chunk)
            audio_segments.append(audio_data)

        # Store in cache with a UUID
        audio_id = str(uuid.uuid4())
        AUDIO_CACHE[audio_id] = audio_segments

        # 4️⃣ Return answer + audio URL
        return {
    "status": "success",
    "data": {
        "answer": answer,
        "audio_url": f"/audio/{audio_id}"
    }
}


    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"status": "error", "detail": str(e)}

# @router.post("/chat")
# async def chat_memory(data: ChatRequest):
#     try:
#         print(f"👉 Incoming question: {data.question}")

#         # 🔧 Step 1: Skip real answer for testing
#         answer = "Hello, this is a test."

#         # 🔈 Step 2: Generate audio
#         try:
#             audio_data = await text_to_speech(answer)
#             print("✅ Audio generated successfully.")
#         except Exception as audio_err:
#             print("❌ ElevenLabs failed:", audio_err)
#             return {
#                 "status": "error",
#                 "detail": f"Audio generation failed: {str(audio_err)}"
#             }

#         # 🧠 Step 3: Store audio
#         audio_id = str(uuid.uuid4())
#         AUDIO_CACHE[audio_id] = [audio_data]
#         print(f"🧠 Stored audio in cache under ID: {audio_id}")

#         # ✅ Step 4: Return answer + audio_url
#         return {
#             "status": "success",
#             "answer": answer,
#             "audio_url": f"/audio/{audio_id}"
#         }

#     except Exception as e:
#         import traceback
#         traceback.print_exc()
#         return {"status": "error", "detail": str(e)}
