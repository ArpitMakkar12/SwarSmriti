import os
import httpx
from dotenv import load_dotenv

load_dotenv()

COHERE_API_KEY = os.getenv("COHERE_API_KEY")

# ✅ For summarizing (training)
async def summarize(text: str) -> str:
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:  # ⏱️ Extended timeout
            response = await client.post(
                "https://api.cohere.ai/v1/summarize",
                headers={
                    "Authorization": f"Bearer {COHERE_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "text": text,
                    "length": "short",          # ⬅️ Keeps output concise
                    "format": "paragraph"
                }
            )
            response.raise_for_status()
            return response.json()["summary"]
    except httpx.HTTPError as e:
        return f"Error: {str(e)}"

async def generate_answer(prompt: str) -> str:
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://api.cohere.ai/v1/chat",
            headers={
                "Authorization": f"Bearer {COHERE_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": "command-r",
                "message": prompt,
                "chat_history": []
            }
        )
        response.raise_for_status()
        data = response.json()

        # Get reply
        answer = data.get("text") or data.get("reply") or ""

        # ✂️ Limit to 150 words to save ElevenLabs credits
        max_words = 150
        words = answer.split()
        if len(words) > max_words:
            answer = " ".join(words[:max_words]) + "..."

        return answer
