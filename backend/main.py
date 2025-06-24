import os
from dotenv import load_dotenv
load_dotenv() 
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.train_route import router as train_router
from routes.chat_route import router as chat_router  # ✅ Chat: text + audio ID
from routes.audio_route import router as audio_router  # ✅ Audio: streaming MP3
from routes import transcribe_route
from routes.voice_chat_route import router as voice_chat_router
from routes.memories_route import router as memories_router

app = FastAPI()

# ✅ Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://swarsmriti-1.onrender.com",  # ✅ your deployed frontend
        "http://localhost:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



# Include your routers:
app.include_router(train_router)
app.include_router(chat_router)
app.include_router(audio_router)  # ✅ New: streaming endpoint
app.include_router(transcribe_route.router)
app.include_router(voice_chat_router)
app.include_router(memories_router)

for route in app.routes:
    print(f"ROUTE: {route.path} [{route.methods}]")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

