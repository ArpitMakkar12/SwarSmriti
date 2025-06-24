import asyncio
from routes.cohere_client import generate_answer

async def main():
    prompt = "Hello! Can you reply like Arpit would?"
    answer = await generate_answer(prompt)
    print("✅ Answer:", answer)

if __name__ == "__main__":
    asyncio.run(main())
