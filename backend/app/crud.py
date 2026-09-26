"""
ThaiWrite AI - CRUD Operations

Database operations for templates, analysis jobs, and results.
"""

import uuid
from typing import List, Optional, Dict, Any

from sqlalchemy.orm import Session

from . import models


# ────────────────────────────────────────────────────────
# Templates
# ────────────────────────────────────────────────────────

def get_templates(db: Session, skip: int = 0, limit: int = 100) -> List[models.DocumentTemplate]:
    """Get all document templates."""
    return db.query(models.DocumentTemplate).offset(skip).limit(limit).all()


def get_template_by_id(db: Session, template_id: str) -> Optional[models.DocumentTemplate]:
    """Get a template by its ID (UUID or string)."""
    try:
        uid = uuid.UUID(template_id)
    except ValueError:
        # Might be a non-UUID string ID like 'tmpl-thesis-5ch'
        return db.query(models.DocumentTemplate).filter(
            models.DocumentTemplate.code == template_id
        ).first()
    return db.query(models.DocumentTemplate).filter(
        models.DocumentTemplate.id == uid
    ).first()


def create_custom_template(db: Session, filename: str, user_id: Optional[str] = None) -> models.DocumentTemplate:
    """Create a custom template from an uploaded file."""
    template = models.DocumentTemplate(
        code=f"CUSTOM-{uuid.uuid4().hex[:8].upper()}",
        name=filename.rsplit(".", 1)[0] if "." in filename else filename,
        category="custom",
        description=f"แม่แบบเฉพาะที่อัปโหลด: {filename}",
        is_custom=True,
        created_by=uuid.UUID(user_id) if user_id else None,
    )
    db.add(template)
    db.commit()
    db.refresh(template)
    return template


# ────────────────────────────────────────────────────────
# Analysis Jobs
# ────────────────────────────────────────────────────────

def create_analysis_job(
    db: Session,
    template_id: str,
    writing_style: str,
    document_name: str,
    original_text: str,
    file_type: str = "text",
    file_url: Optional[str] = None,
    file_size_bytes: Optional[int] = None,
    user_id: Optional[str] = None,
) -> models.AnalysisJob:
    """Create a new analysis job record with status 'pending'."""
    # Resolve template UUID
    tmpl_uuid = None
    tmpl = get_template_by_id(db, template_id)
    if tmpl:
        tmpl_uuid = tmpl.id

    job = models.AnalysisJob(
        user_id=uuid.UUID(user_id) if user_id else None,
        template_id=tmpl_uuid,
        document_name=document_name,
        file_type=file_type,
        file_url=file_url,
        file_size_bytes=file_size_bytes,
        writing_style=writing_style,
        language_score=0,
        structure_score=0,
        overall_status="pending",
        original_text=original_text,
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    return job


def get_analysis_job(db: Session, job_id: str) -> Optional[models.AnalysisJob]:
    """Get an analysis job by ID."""
    try:
        uid = uuid.UUID(job_id)
    except ValueError:
        return None
    return db.query(models.AnalysisJob).filter(
        models.AnalysisJob.id == uid
    ).first()


def get_user_history(
    db: Session, user_id: str, skip: int = 0, limit: int = 50
) -> List[models.AnalysisJob]:
    """Get analysis history for a specific user."""
    try:
        uid = uuid.UUID(user_id)
    except ValueError:
        return []
    return (
        db.query(models.AnalysisJob)
        .filter(models.AnalysisJob.user_id == uid)
        .order_by(models.AnalysisJob.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def get_job_language_issues(db: Session, job_id: str) -> List[models.LanguageIssue]:
    """Get all language issues for a given job."""
    try:
        uid = uuid.UUID(job_id)
    except ValueError:
        return []
    return db.query(models.LanguageIssue).filter(
        models.LanguageIssue.job_id == uid
    ).all()


def get_job_structure_results(db: Session, job_id: str) -> List[models.StructureResult]:
    """Get structure results for a given job."""
    try:
        uid = uuid.UUID(job_id)
    except ValueError:
        return []
    return db.query(models.StructureResult).filter(
        models.StructureResult.job_id == uid
    ).all()
