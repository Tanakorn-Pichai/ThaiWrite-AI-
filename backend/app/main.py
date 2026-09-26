"""
ThaiWrite AI - FastAPI Application Entry Point

Features:
  - CORS for React frontend
  - Async analysis with Celery
  - PostgreSQL via SQLAlchemy
  - S3-compatible file storage
  - PyThaiNLP-based NLP engine
"""

import os
import uvicorn
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import engine, Base
from .router import api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create DB tables on startup (dev convenience)."""
    Base.metadata.create_all(bind=engine)
    # Optionally seed standard templates
    from .seed import seed_standard_templates
    seed_standard_templates()
    yield


app = FastAPI(
    title="ThaiWrite AI Backend",
    description=(
        "ระบบตรวจสอบภาษาไทยเชิงวิชาการ — "
        "FastAPI + PyThaiNLP + PostgreSQL + Celery + S3"
    ),
    version="0.1.0",
    lifespan=lifespan,
)

# ── CORS ──
FRONTEND_ORIGINS = os.getenv("FRONTEND_ORIGINS", "http://localhost:3000,http://localhost:5173").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=FRONTEND_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routes ──
app.include_router(api_router, prefix="/api/v1")


@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "ThaiWrite AI Backend"}


if __name__ == "__main__":
    uvicorn.run(
        "backend.app.main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", "8000")),
        reload=True,
    )
