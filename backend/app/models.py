"""
ThaiWrite AI - SQLAlchemy Models

Supports both PostgreSQL (production) and SQLite (local dev).
Uses SQLAlchemy 2.x Uuid type for cross-database compatibility.
"""

from sqlalchemy import Column, String, Boolean, Integer, BigInteger, Text, DateTime, ForeignKey, JSON, func, Index, Uuid
from sqlalchemy.orm import relationship
import uuid
from .database import Base


class User(Base):
    __tablename__ = "users"
    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    student_id = Column(String(30), unique=True, nullable=True)
    email = Column(String(255), unique=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    faculty = Column(String(255), nullable=True)
    tier = Column(String(50), default="University Academic Tier")
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class DocumentTemplate(Base):
    __tablename__ = "document_templates"
    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    code = Column(String(50), unique=True, nullable=False)
    name = Column(String(255), nullable=False)
    category = Column(String(50), nullable=False)
    description = Column(Text, nullable=True)
    university = Column(String(255), nullable=True)
    is_custom = Column(Boolean, default=False)
    created_by = Column(Uuid, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    formatting_rules = Column(JSON, nullable=False, default=lambda: {
        "fontFamily": "TH Sarabun New",
        "fontSizeHeading": "18pt",
        "fontSizeBody": "16pt",
        "margins": "Left 1.5 inch, Top 1.5/1.0 inch, Right 1.0 inch, Bottom 1.0 inch",
        "lineSpacing": "1.0",
        "pageNumbering": "Top Right",
    })
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    sections = relationship("TemplateSection", backref="template", cascade="all, delete-orphan", lazy="selectin")


class TemplateSection(Base):
    __tablename__ = "template_sections"
    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    template_id = Column(Uuid, ForeignKey("document_templates.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    section_level = Column(Integer, default=1)
    expected_order = Column(Integer, nullable=False)
    is_required = Column(Boolean, default=True)
    description = Column(Text, nullable=True)


class AnalysisJob(Base):
    __tablename__ = "analysis_jobs"
    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    user_id = Column(Uuid, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    template_id = Column(Uuid, ForeignKey("document_templates.id"), nullable=True)
    document_name = Column(String(255), nullable=False)
    file_type = Column(String(50), nullable=True)
    file_url = Column(Text, nullable=True)
    file_size_bytes = Column(BigInteger, nullable=True)
    writing_style = Column(String(50), nullable=False)
    language_score = Column(Integer, nullable=False)
    structure_score = Column(Integer, nullable=False)
    overall_status = Column(String(50), default="pending")
    word_count = Column(Integer, default=0)
    sentence_count = Column(Integer, default=0)
    issue_count = Column(Integer, default=0)
    original_text = Column(Text, nullable=True)
    improved_text = Column(Text, nullable=True)
    result_json = Column(JSON, nullable=True)
    error_message = Column(Text, nullable=True)
    engine_version = Column(String(100), nullable=True)
    started_at = Column(DateTime(timezone=True), nullable=True)
    finished_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class LanguageIssue(Base):
    __tablename__ = "language_issues"
    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    job_id = Column(Uuid, ForeignKey("analysis_jobs.id", ondelete="CASCADE"), nullable=False)
    issue_type = Column(String(50), nullable=False)
    detected_text = Column(Text, nullable=False)
    replacement = Column(Text, nullable=False)
    reason = Column(Text, nullable=False)
    start_offset = Column(Integer, nullable=True)
    end_offset = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class StructureResult(Base):
    __tablename__ = "structure_results"
    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    job_id = Column(Uuid, ForeignKey("analysis_jobs.id", ondelete="CASCADE"), nullable=False)
    section_title = Column(String(255), nullable=False)
    expected_order = Column(Integer, nullable=False)
    actual_order = Column(Integer, nullable=True)
    status = Column(String(50), nullable=False)  # present, missing, out_of_order, warning
    compliance_note = Column(Text, nullable=True)


# Indexes for performance
Index("idx_analysis_jobs_user", AnalysisJob.user_id)
Index("idx_analysis_jobs_template", AnalysisJob.template_id)
Index("idx_template_sections_tmpl", TemplateSection.template_id)
Index("idx_language_issues_job", LanguageIssue.job_id)
Index("idx_structure_results_job", StructureResult.job_id)
