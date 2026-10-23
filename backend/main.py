import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

import config
import db
from errors import ServiceError
from routes import chat_route, memories_route, profile_route, train_route, transcribe_route


@asynccontextmanager
async def lifespan(app: FastAPI):
    db.init_db()  # connect + create tables on startup
    yield
    db.close_db()


app = FastAPI(title="SwarSmriti API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.FRONTEND_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(ServiceError)
async def service_error_handler(request: Request, exc: ServiceError):
    """Any ServiceError raised anywhere becomes a clean JSON error for the frontend."""
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.message})


@app.get("/")
@app.get("/health")
def health():
    """Cheap endpoint the frontend pings to wake the server up (Render free tier sleeps)."""
    return {"status": "ok"}


app.include_router(train_route.router)
app.include_router(chat_route.router)
app.include_router(memories_route.router)
app.include_router(transcribe_route.router)
app.include_router(profile_route.router)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=int(os.getenv("PORT", "8000")), reload=True)