import os
from pathlib import Path

from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import sessionmaker, declarative_base

# Database URL: PostgreSQL in production, SQLite fallback for local dev.
# Resolve the development database from this file instead of the process cwd so
# `uvicorn app.main:app` and `uvicorn backend.app.main:app` use the same data.
_default_sqlite_path = Path(__file__).resolve().parents[1] / "thaiwrite_dev.db"
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    f"sqlite:///{_default_sqlite_path.as_posix()}",
)

# SQLite needs connect_args for multi-thread FastAPI
connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(DATABASE_URL, echo=False, future=True, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def migrate_sqlite_schema() -> None:
    """Add columns introduced after the initial local SQLite schema."""
    if not DATABASE_URL.startswith("sqlite"):
        return

    with engine.begin() as connection:
        columns = {column["name"] for column in inspect(connection).get_columns("analysis_jobs")}
        if "result_json" not in columns:
            connection.execute(text("ALTER TABLE analysis_jobs ADD COLUMN result_json JSON"))
        if "error_message" not in columns:
            connection.execute(text("ALTER TABLE analysis_jobs ADD COLUMN error_message TEXT"))
        if "engine_version" not in columns:
            connection.execute(text("ALTER TABLE analysis_jobs ADD COLUMN engine_version VARCHAR(100)"))
        if "started_at" not in columns:
            connection.execute(text("ALTER TABLE analysis_jobs ADD COLUMN started_at DATETIME"))
        if "finished_at" not in columns:
            connection.execute(text("ALTER TABLE analysis_jobs ADD COLUMN finished_at DATETIME"))


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
