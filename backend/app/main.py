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
import time
import uuid
import uvicorn
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .database import engine, Base, migrate_sqlite_schema
from .router import api_router
from .logging_config import bind_request_id, clear_request_id, configure_logging

configure_logging()
logger = logging.getLogger("thaiwrite")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create DB tables on startup (dev convenience)."""
    try:
        Base.metadata.create_all(bind=engine)
        migrate_sqlite_schema()
        # Seed standard templates
        from .seed import seed_standard_templates
        seed_standard_templates()
    except Exception:
        # Keep the server available so /health and CORS diagnostics remain usable.
        logger.exception("database initialization failed")
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
raw_origins = os.getenv(
    "FRONTEND_ORIGINS",
    "http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://192.168.1.36:3000",
).split(",")
origins = [o.strip().rstrip("/") for o in raw_origins if o.strip()]
origin_regex = os.getenv(
    "FRONTEND_ORIGIN_REGEX",
    r"^https?://(localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3})(:\d+)?$",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=origin_regex,
    allow_credentials=False,
    allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "X-Request-ID"],
)


@app.middleware("http")
async def request_logging_middleware(request: Request, call_next):
    request_id = request.headers.get("X-Request-ID") or uuid.uuid4().hex
    token = bind_request_id(request_id)
    started = time.perf_counter()
    try:
        response = await call_next(request)
        duration_ms = round((time.perf_counter() - started) * 1000, 2)
        logger.info(
            "request completed",
            extra={
                "method": request.method,
                "path": request.url.path,
                "status_code": response.status_code,
                "duration_ms": duration_ms,
            },
        )
        response.headers["X-Request-ID"] = request_id
        return response
    finally:
        clear_request_id(token)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception("unhandled application error", extra={"method": request.method, "path": request.url.path})
    request_id = request.headers.get("X-Request-ID") or "-"
    return JSONResponse(
        status_code=500,
        content={"detail": "เกิดข้อผิดพลาดภายในระบบ", "requestId": request_id},
        headers={"X-Request-ID": request_id},
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
