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
import logging
import traceback
import uvicorn
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .database import engine, Base
from .router import api_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("thaiwrite")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create DB tables on startup (dev convenience)."""
    Base.metadata.create_all(bind=engine)
    # Seed standard templates
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
raw_origins = os.getenv("FRONTEND_ORIGINS", "http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000").split(",")
origins = [o.strip() for o in raw_origins if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error on {request.url.path}: {exc}")
    logger.error(traceback.format_exc())
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal Server Error: {str(exc)}"},
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
