"""
ThaiWrite AI - Celery Background Tasks

Async tasks for NLP analysis and structure checking.
"""

import uuid
from typing import Dict, Any

from .celery_app import celery_app
from .nlp_engine import analyze_thai_text
from .docx_parser import parse_docx, parse_pdf, parse_text
from .structure_checker import evaluate_structure, get_template_by_id
from .database import SessionLocal
from . import models


@celery_app.task(bind=True, name="tasks.analyze_document")
def analyze_document_task(
    self,
    job_id: str,
    content: str,
    writing_style: str,
    template_id: str,
    file_bytes_hex: str | None = None,
    file_type: str = "text",
) -> Dict[str, Any]:
    """
    Background task that:
      1. Runs PyThaiNLP language analysis
      2. Parses document structure (if file provided)
      3. Checks template compliance
      4. Persists results to PostgreSQL
      5. Returns the full analysis response
    """
    # Update task status
    self.update_state(state="PROCESSING", meta={"step": "nlp_analysis"})

    # ── 1. NLP Analysis ──
    language_result = analyze_thai_text(content, writing_style)

    # ── 2. Parse document structure ──
    self.update_state(state="PROCESSING", meta={"step": "structure_parsing"})

    if file_bytes_hex and file_type in ("docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"):
        file_bytes = bytes.fromhex(file_bytes_hex)
        parsed = parse_docx(file_bytes)
    elif file_bytes_hex and file_type in ("pdf", "application/pdf"):
        file_bytes = bytes.fromhex(file_bytes_hex)
        parsed = parse_pdf(file_bytes)
    else:
        parsed = parse_text(content)

    # ── 3. Template compliance ──
    self.update_state(state="PROCESSING", meta={"step": "template_check"})

    template = get_template_by_id(template_id)
    if not template:
        # Fallback to first template
        from .structure_checker import STANDARD_TEMPLATES
        template = STANDARD_TEMPLATES[0]

    structure_result = evaluate_structure(
        content=parsed.get("fullText", content),
        detected_headings=parsed.get("detectedHeadings", []),
        template=template,
        file_margins=parsed.get("margins"),
        font_info=parsed.get("fontInfo"),
    )

    # ── 4. Persist to database ──
    self.update_state(state="PROCESSING", meta={"step": "saving_results"})

    db = SessionLocal()
    try:
        # Update the analysis job record
        job = db.query(models.AnalysisJob).filter(
            models.AnalysisJob.id == uuid.UUID(job_id)
        ).first()

        if job:
            job.language_score = language_result["score"]
            job.structure_score = structure_result["overallScore"]
            job.word_count = language_result["wordCount"]
            job.sentence_count = language_result["sentenceCount"]
            job.issue_count = language_result["issueCount"]
            job.improved_text = language_result["improvedText"]
            job.overall_status = "completed"

            # Persist individual language issues
            for hl in language_result.get("highlights", []):
                issue = models.LanguageIssue(
                    job_id=job.id,
                    issue_type=hl["type"],
                    detected_text=hl["text"],
                    replacement=hl["replacement"],
                    reason=hl["reason"],
                    start_offset=hl.get("start_offset"),
                    end_offset=hl.get("end_offset"),
                )
                db.add(issue)

            # Persist structure results
            for sc in structure_result.get("sectionChecks", []):
                sr = models.StructureResult(
                    job_id=job.id,
                    section_title=sc["title"],
                    expected_order=sc["expectedPosition"],
                    actual_order=sc.get("actualPosition"),
                    status=sc["status"],
                    compliance_note=sc.get("note"),
                )
                db.add(sr)

            db.commit()
    except Exception as e:
        db.rollback()
        raise
    finally:
        db.close()

    return {
        "jobId": job_id,
        "languageResult": language_result,
        "structureResult": structure_result,
    }
