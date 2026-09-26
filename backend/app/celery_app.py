"""
ThaiWrite AI - Celery Worker Configuration

Uses Celery + Redis for async background processing of large documents.
"""

import os
from celery import Celery

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

celery_app = Celery(
    "thaiwrite_worker",
    broker=REDIS_URL,
    backend=REDIS_URL,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Bangkok",
    enable_utc=True,
    task_track_started=True,
    result_expires=3600 * 24,  # results expire after 24 hours
    task_soft_time_limit=300,  # 5 min soft limit per task
    task_time_limit=600,       # 10 min hard limit per task
)
