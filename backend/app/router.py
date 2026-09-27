"""
ThaiWrite AI - API Router

Implements the full RESTful API contract from BACKEND_AND_DATABASE_SPEC.md:
  GET  /api/v1/templates           – List standard templates
  POST /api/v1/templates/upload    – Upload custom template file
  POST /api/v1/analyze             – Submit analysis job (sync fallback when no Celery)
  GET  /api/v1/analyze/{job_id}    – Get job status / full result
  GET  /api/v1/history             – User analysis history
"""

import os
import uuid
import json
import asyncio
import logging
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from . import crud, schemas, models
from .database import get_db
from .nlp_engine import analyze_thai_text
from .docx_parser import parse_docx, parse_pdf, parse_text
from .structure_checker import STANDARD_TEMPLATES, get_template_by_id as get_tmpl_by_id, evaluate_structure

ENGINE_VERSION = "thaiwrite-nlp/1.0"

api_router = APIRouter()
logger = logging.getLogger("thaiwrite.router")

MAX_UPLOAD_MB = int(os.getenv("MAX_UPLOAD_SIZE_MB", "10"))
ALLOWED_EXTENSIONS = {".docx", ".pdf", ".txt"}
USE_CELERY = os.getenv("USE_CELERY", "false").lower() == "true"
USE_S3 = os.getenv("USE_S3", "false").lower() == "true"


# ────────────────────────────────────────────────────────
# Internal helpers
# ────────────────────────────────────────────────────────

def _validate_file(file: UploadFile):
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"ประเภทไฟล์ไม่รองรับ รองรับเฉพาะ {', '.join(ALLOWED_EXTENSIONS)}",
        )


def _template_orm_to_schema(t: models.DocumentTemplate) -> schemas.DocTemplateOut:
    rules = t.formatting_rules or {}
    return schemas.DocTemplateOut(
        # Public IDs are stable template codes; database UUIDs remain internal.
        id=t.code,
        code=t.code,
        name=t.name,
        category=t.category,
        description=t.description,
        university=t.university,
        is_custom=t.is_custom,
        formattingRules=schemas.FormattingRules(
            fontFamily=rules.get("fontFamily", "TH Sarabun New"),
            fontSizeHeading=rules.get("fontSizeHeading", "18pt"),
            fontSizeBody=rules.get("fontSizeBody", "16pt"),
            margins=rules.get("margins", ""),
            lineSpacing=rules.get("lineSpacing", "1.0"),
            pageNumbering=rules.get("pageNumbering", "มุมบนขวา"),
        ),
        requiredSections=[
            schemas.TemplateSectionOut(
                id=str(section.id),
                title=section.title,
                level=section.section_level,
                required=section.is_required,
                description=section.description,
            )
            for section in (t.sections or [])
        ],
        requiredSectionsCount=len(t.sections) if hasattr(t, "sections") and t.sections else 0,
    )


def _template_dict_to_schema(tmpl: dict) -> schemas.DocTemplateOut:
    rules = tmpl.get("formattingRules", {})
    return schemas.DocTemplateOut(
        id=tmpl["id"],
        code=tmpl["code"],
        name=tmpl["name"],
        category=tmpl["category"],
        description=tmpl.get("description"),
        university=tmpl.get("university"),
        is_custom=False,
        formattingRules=schemas.FormattingRules(
            fontFamily=rules.get("fontFamily", "TH Sarabun New"),
            fontSizeHeading=rules.get("fontSizeHeading", "18pt"),
            fontSizeBody=rules.get("fontSizeBody", "16pt"),
            margins=rules.get("margins", ""),
            lineSpacing=rules.get("lineSpacing", "1.0"),
            pageNumbering=rules.get("pageNumbering", "มุมบนขวา"),
        ),
        requiredSections=[
            schemas.TemplateSectionOut(
                id=section["id"],
                title=section["title"],
                level=section["level"],
                required=section.get("required", True),
                description=section.get("description"),
            )
            for section in tmpl.get("requiredSections", [])
        ],
        requiredSectionsCount=len(tmpl.get("requiredSections", [])),
    )


async def _try_upload_s3(file_bytes: bytes, filename: str, content_type: str) -> Optional[str]:
    """Upload to S3 if configured; silently return None on failure."""
    if not USE_S3:
        return None
    try:
        from .storage import upload_file
        return await upload_file(file_bytes, filename, content_type)
    except Exception:
        logger.exception("S3 upload failed; continuing without object storage")
        return None


def _run_analysis_sync(
    content: str,
    writing_style: str,
    template_id: str,
    file_bytes: Optional[bytes],
    file_type: str,
    db: Session,
    job: models.AnalysisJob,
):
    """Run NLP + structure analysis synchronously and persist results."""
    # 1. NLP analysis via PyThaiNLP
    lang_result = analyze_thai_text(content, writing_style)

    # 2. Parse document structure
    if file_bytes and file_type in ("docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"):
        parsed = parse_docx(file_bytes)
    elif file_bytes and file_type in ("pdf", "application/pdf"):
        parsed = parse_pdf(file_bytes)
    else:
        parsed = parse_text(content)

    # 3. Template compliance
    template = get_tmpl_by_id(template_id)
    if not template:
        db_template = crud.get_template_by_id(db, template_id)
        if not db_template or not db_template.is_custom:
            raise HTTPException(status_code=404, detail=f"ไม่พบแม่แบบ: {template_id}")
        template = {
            "id": db_template.code,
            "name": db_template.name,
            "formattingRules": db_template.formatting_rules or {},
            "requiredSections": [
                {"id": str(section.id), "title": section.title, "level": section.section_level, "required": section.is_required}
                for section in db_template.sections
            ],
        }

    struct_result = evaluate_structure(
        content=parsed.get("fullText", content),
        detected_headings=parsed.get("detectedHeadings", []),
        template=template,
        file_margins=parsed.get("margins"),
        font_info=parsed.get("fontInfo"),
    )

    # 4. Persist to DB
    job.language_score = lang_result["score"]
    job.structure_score = struct_result["overallScore"]
    job.engine_version = ENGINE_VERSION
    job.started_at = job.started_at or datetime.now(timezone.utc)
    job.finished_at = datetime.now(timezone.utc)
    job.word_count = lang_result["wordCount"]
    job.sentence_count = lang_result["sentenceCount"]
    job.issue_count = lang_result["issueCount"]
    job.improved_text = lang_result["improvedText"]
    job.overall_status = "completed"
    # Store full result JSON in original_text field temporarily (max 50k)
    job.original_text = job.original_text  # keep original
    job.result_json = {"languageResult": lang_result, "structureResult": struct_result}

    # Persist language issues
    for hl in lang_result.get("highlights", []):
        db.add(models.LanguageIssue(
            job_id=job.id,
            issue_type=hl["type"],
            detected_text=hl["text"],
            replacement=hl["replacement"],
            reason=hl["reason"],
            start_offset=hl.get("start_offset"),
            end_offset=hl.get("end_offset"),
        ))

    # Persist structure checks
    for sc in struct_result.get("sectionChecks", []):
        db.add(models.StructureResult(
            job_id=job.id,
            section_title=sc["title"],
            expected_order=sc["expectedPosition"],
            actual_order=sc.get("actualPosition"),
            status=sc["status"],
            compliance_note=sc.get("note"),
        ))

    db.commit()
    return lang_result, struct_result


def _build_analysis_response(job_id: str, doc_name: str, lang: dict, struct: dict) -> schemas.AnalysisResponse:
    lang_result = schemas.LanguageResult(
        wordCount=lang.get("wordCount", 0),
        sentenceCount=lang.get("sentenceCount", 0),
        issueCount=lang.get("issueCount", 0),
        score=lang.get("score", 0),
        categories=schemas.CategoryCounts(**lang.get("categories", {})),
        detectedText=lang.get("detectedText", ""),
        replacement=lang.get("replacement", ""),
        reason=lang.get("reason", ""),
        originalText=lang.get("originalText", ""),
        improvedText=lang.get("improvedText", ""),
        detailedBreakdown=schemas.DetailedBreakdown(**lang.get("detailedBreakdown", {})),
        highlights=[schemas.LanguageIssueItem(
            text=h.get("text", ""),
            type=h.get("type", "grammar"),
            replacement=h.get("replacement", ""),
            reason=h.get("reason", ""),
            suggestions=h.get("suggestions", []),
            startOffset=h.get("startOffset", h.get("start_offset")),
            endOffset=h.get("endOffset", h.get("end_offset")),
        ) for h in lang.get("highlights", [])],
    )
    summary = struct.get("sectionsSummary", {})
    struct_result = schemas.StructureResult(
        templateName=struct.get("templateName", ""),
        templateId=struct.get("templateId", ""),
        overallScore=struct.get("overallScore", 0),
        complianceStatus=struct.get("complianceStatus", "fail"),
        sectionsSummary=schemas.SectionsSummary(
            total=summary.get("total", 0),
            matched=summary.get("matched", 0),
            missing=summary.get("missing", 0),
            outOfOrder=summary.get("outOfOrder", 0),
        ),
        sectionChecks=[schemas.SectionCheckItem(**s) for s in struct.get("sectionChecks", [])],
        formattingChecks=[schemas.FormattingCheckItem(**f) for f in struct.get("formattingChecks", [])],
        structureRecommendations=struct.get("structureRecommendations", []),
    )
    return schemas.AnalysisResponse(
        jobId=job_id,
        documentName=doc_name,
        languageResult=lang_result,
        structureResult=struct_result,
    )


# ────────────────────────────────────────────────────────
# GET /templates
# ────────────────────────────────────────────────────────

@api_router.get("/templates", response_model=List[schemas.DocTemplateOut], tags=["Templates"])
async def list_templates(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """ดึงรายการแม่แบบมาตรฐานทั้งหมดในระบบ"""
    db_templates = crud.get_templates(db, skip=skip, limit=limit)
    if db_templates:
        return [_template_orm_to_schema(t) for t in db_templates]
    # Fallback to in-memory when DB not yet seeded
    return [_template_dict_to_schema(t) for t in STANDARD_TEMPLATES]


# ────────────────────────────────────────────────────────
# POST /templates/upload
# ────────────────────────────────────────────────────────

@api_router.post("/templates/upload", response_model=schemas.CustomTemplateUploadResponse,
                 status_code=201, tags=["Templates"])
async def upload_custom_template(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """อัปโหลดไฟล์แม่แบบเฉพาะของคณะหรือสถาบัน (.docx, .pdf)"""
    _validate_file(file)
    file_bytes = await file.read()

    if len(file_bytes) > MAX_UPLOAD_MB * 1024 * 1024:
        raise HTTPException(status_code=400, detail=f"ไฟล์มีขนาดเกินขีดจำกัด {MAX_UPLOAD_MB} MB")

    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext == ".docx":
        parsed = parse_docx(file_bytes)
    elif ext == ".pdf":
        parsed = parse_pdf(file_bytes)
    else:
        parsed = {"detectedHeadings": [], "fullText": ""}

    await _try_upload_s3(file_bytes, file.filename, file.content_type or "application/octet-stream")
    template = crud.create_custom_template(db, file.filename)

    detected_sections = [
        schemas.TemplateSectionOut(id=f"custom-{i}", title=h["title"], level=h["level"], required=True)
        for i, h in enumerate(parsed.get("detectedHeadings", []))
    ]
    for index, section in enumerate(detected_sections, start=1):
        db.add(models.TemplateSection(
            template_id=template.id,
            title=section.title,
            section_level=section.level,
            expected_order=index,
            is_required=section.required,
            description=section.description,
        ))
    db.commit()

    return schemas.CustomTemplateUploadResponse(
        id=template.code, name=template.name, code=template.code,
        category="custom", isCustom=True,
        description=template.description,
        formattingRules=schemas.FormattingRules(
            fontFamily="ไม่ทราบจากไฟล์", fontSizeHeading="ไม่ทราบจากไฟล์",
            fontSizeBody="ไม่ทราบจากไฟล์", margins="ไม่ทราบจากไฟล์",
            lineSpacing="ไม่ทราบจากไฟล์", pageNumbering="ไม่ทราบจากไฟล์",
        ),
        requiredSections=detected_sections, detectedSections=detected_sections,
    )


# ────────────────────────────────────────────────────────
# POST /analyze
# ────────────────────────────────────────────────────────

@api_router.post("/analyze", response_model=schemas.JobStatusResponse, status_code=202, tags=["Analysis"])
async def submit_analysis(
    template_id: str = Form(...),
    writing_style: str = Form(...),
    input_mode: str = Form(...),
    text: Optional[str] = Form(None),
    user_id: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
):
    """
    ตรวจวิเคราะห์เอกสารด้วย PyThaiNLP (NLP) + Template Compliance

    - รัน synchronous ทันที (ถ้าไม่ได้ตั้งค่า USE_CELERY=true)
    - ส่งคืน result พร้อมกันเลย หรือ jobId สำหรับ poll
    """
    valid_styles = {"ทั่วไป", "เชิงวิชาการ", "รายงาน", "บทความ", "วิทยานิพนธ์"}
    if writing_style not in valid_styles:
        raise HTTPException(status_code=422,
                            detail=f"writing_style ต้องเป็นหนึ่งใน: {', '.join(valid_styles)}")

    content = ""
    file_bytes: Optional[bytes] = None
    file_type = "text"
    document_name = "text_input"
    file_size = 0

    if input_mode == "text":
        if not text or not text.strip():
            raise HTTPException(status_code=422, detail="กรุณากรอกข้อความ (field: text)")
        content = text.strip()
        document_name = f"text_{uuid.uuid4().hex[:8]}.txt"

    elif input_mode == "file":
        if not file:
            raise HTTPException(status_code=422, detail="กรุณาแนบไฟล์ (field: file)")
        _validate_file(file)
        file_bytes = await file.read()
        file_size = len(file_bytes)
        if file_size > MAX_UPLOAD_MB * 1024 * 1024:
            raise HTTPException(status_code=400, detail=f"ไฟล์มีขนาดเกิน {MAX_UPLOAD_MB} MB")
        file_type = file.content_type or "application/octet-stream"
        document_name = file.filename or "uploaded_doc"

        ext = os.path.splitext(document_name)[1].lower()
        if ext == ".docx":
            parsed = parse_docx(file_bytes)
        elif ext == ".pdf":
            parsed = parse_pdf(file_bytes)
        else:
            parsed = parse_text(file_bytes.decode("utf-8", errors="ignore"))
        content = parsed.get("fullText", "")

        await _try_upload_s3(file_bytes, document_name, file_type)
    else:
        raise HTTPException(status_code=422, detail="input_mode ต้องเป็น 'text' หรือ 'file'")

    if not get_tmpl_by_id(template_id) and not crud.get_template_by_id(db, template_id):
        raise HTTPException(status_code=404, detail=f"ไม่พบแม่แบบ: {template_id}")

    # Create DB job
    job = crud.create_analysis_job(
        db, template_id=template_id, writing_style=writing_style,
        document_name=document_name, original_text=content[:5000],
        file_type=file_type, file_size_bytes=file_size, user_id=user_id,
    )
    job_id = str(job.id)

    # ── Synchronous mode (default, no Celery needed) ──
    if not USE_CELERY:
        try:
            lang, struct = _run_analysis_sync(content, writing_style, template_id, file_bytes, file_type, db, job)
        except ValueError as exc:
            db.rollback()
            raise HTTPException(status_code=422, detail=str(exc)) from exc
        except Exception as exc:
            db.rollback()
            logger.exception("analysis failed", extra={"job_id": job_id, "writing_style": writing_style})
            raise HTTPException(status_code=500, detail="ระบบตรวจวิเคราะห์ไม่สามารถประมวลผลข้อความนี้ได้") from exc
        return schemas.JobStatusResponse(
            jobId=job_id,
            status="completed",
            engineVersion=ENGINE_VERSION,
            result=_build_analysis_response(job_id, document_name, lang, struct),
        )

    # ── Async Celery mode ──
    from .tasks import analyze_document_task
    analyze_document_task.apply_async(
        kwargs={
            "job_id": job_id,
            "content": content,
            "writing_style": writing_style,
            "template_id": template_id,
            "file_bytes_hex": file_bytes.hex() if file_bytes else None,
            "file_type": file_type,
        },
        task_id=job_id,
    )
    return schemas.JobStatusResponse(jobId=job_id, status="pending", step="queued")


# ────────────────────────────────────────────────────────
# GET /analyze/{job_id} – Poll or get result
# ────────────────────────────────────────────────────────

@api_router.get("/analyze/{job_id}", response_model=schemas.JobStatusResponse, tags=["Analysis"])
async def get_analysis_result(job_id: str, db: Session = Depends(get_db)):
    """ดึงสถานะหรือผลการวิเคราะห์เอกสาร"""
    db_job = crud.get_analysis_job(db, job_id)
    if not db_job:
        raise HTTPException(status_code=404, detail=f"ไม่พบงาน ID: {job_id}")

    if db_job.overall_status != "completed":
        if USE_CELERY:
            from celery.result import AsyncResult
            state = AsyncResult(job_id).state
            step = AsyncResult(job_id).info.get("step") if isinstance(AsyncResult(job_id).info, dict) else None
            return schemas.JobStatusResponse(jobId=job_id, status="processing" if state == "PROCESSING" else "pending", step=step)
        return schemas.JobStatusResponse(
            jobId=job_id,
            status=db_job.overall_status,
            error=db_job.error_message,
            engineVersion=db_job.engine_version or ENGINE_VERSION,
        )

    # Return the exact persisted result from the completed analysis.
    if db_job.result_json:
        persisted = _build_analysis_response(
            job_id,
            db_job.document_name,
            db_job.result_json.get("languageResult", {}),
            db_job.result_json.get("structureResult", {}),
        )
        return schemas.JobStatusResponse(
            jobId=job_id,
            status="completed",
            engineVersion=db_job.engine_version or ENGINE_VERSION,
            result=persisted,
        )

    # Legacy jobs without a snapshot are reconstructed for backward compatibility.
    lang_issues = crud.get_job_language_issues(db, job_id)
    struct_checks = crud.get_job_structure_results(db, job_id)

    # Resolve template name
    template_name = "ไม่ระบุแม่แบบ"
    template_id_str = str(db_job.template_id) if db_job.template_id else ""
    db_template = db.query(models.DocumentTemplate).filter(models.DocumentTemplate.id == db_job.template_id).first()
    public_template_id = db_template.code if db_template else template_id_str
    tmpl = get_tmpl_by_id(public_template_id)
    if tmpl:
        template_name = tmpl["name"]

    highlights = [
        schemas.LanguageIssueItem(
            text=i.detected_text, type=i.issue_type,
            replacement=i.replacement, reason=i.reason,
        )
        for i in lang_issues
    ]

    categories = {"spelling": 0, "grammar": 0, "wordUsage": 0, "academic": 0}
    for i in lang_issues:
        if i.issue_type in categories:
            categories[i.issue_type] += 1

    primary = lang_issues[0] if lang_issues else None

    lang_result = schemas.LanguageResult(
        wordCount=db_job.word_count,
        sentenceCount=db_job.sentence_count,
        issueCount=db_job.issue_count,
        score=db_job.language_score,
        categories=schemas.CategoryCounts(**categories),
        detectedText=primary.detected_text if primary else "",
        replacement=primary.replacement if primary else "",
        reason=primary.reason if primary else "",
        originalText=db_job.original_text or "",
        improvedText=db_job.improved_text or "",
        detailedBreakdown=schemas.DetailedBreakdown(
            spelling="ตรวจพบคำสะกดผิด" if categories["spelling"] else "ไม่พบคำสะกดผิด",
            grammar="ตรวจพบกริยาช่วยฟุ่มเฟือย" if categories["grammar"] else "ไม่พบข้อผิดพลาดทางไวยากรณ์",
            wordUsage="ตรวจพบคำที่ใช้ซ้ำซ้อน" if categories["wordUsage"] else "การใช้คำถูกต้อง",
            academic="ควรปรับระดับภาษาให้เป็นวิชาการ" if categories["academic"] else "ภาษาเหมาะสม",
        ),
        highlights=highlights,
    )

    section_checks = [
        schemas.SectionCheckItem(
            id=str(s.id), title=s.section_title, level=1,
            status=s.status, expectedPosition=s.expected_order,
            actualPosition=s.actual_order, note=s.compliance_note or "",
        )
        for s in struct_checks
    ]

    matched = sum(1 for s in struct_checks if s.status == "present")
    missing = sum(1 for s in struct_checks if s.status == "missing")
    out_of_order = sum(1 for s in struct_checks if s.status == "out_of_order")

    struct_result = schemas.StructureResult(
        templateName=template_name,
        templateId=public_template_id,
        overallScore=db_job.structure_score,
        complianceStatus="pass" if db_job.structure_score >= 85 else "needs_revision" if db_job.structure_score >= 70 else "fail",
        sectionsSummary=schemas.SectionsSummary(
            total=len(struct_checks), matched=matched, missing=missing, outOfOrder=out_of_order,
        ),
        sectionChecks=section_checks,
        formattingChecks=[
            schemas.FormattingCheckItem(
                id=f["id"], ruleName=f["ruleName"], expected=f["expected"],
                detected=f["detected"], status=f["status"], recommendation=f["recommendation"],
            )
            for f in (tmpl.get("formattingChecks", []) if tmpl else [])
        ],
        structureRecommendations=(tmpl.get("structureRecommendations", []) if tmpl else []),
    )

    return schemas.JobStatusResponse(
        jobId=job_id,
        status="completed",
        result=schemas.AnalysisResponse(
            jobId=job_id,
            documentName=db_job.document_name,
            languageResult=lang_result,
            structureResult=struct_result,
        ),
    )


# ────────────────────────────────────────────────────────
# GET /history
# ────────────────────────────────────────────────────────

@api_router.get("/profile/stats", response_model=schemas.ProfileStatsOut, tags=["History"])
async def get_profile_stats(user_id: Optional[str] = None, db: Session = Depends(get_db)):
    if not user_id:
        raise HTTPException(status_code=400, detail="กรุณาระบุ user_id")
    try:
        jobs = crud.get_user_history(db, user_id=user_id, skip=0, limit=10000)
    except Exception:
        logger.exception("failed to load profile stats", extra={"user_id": user_id})
        return schemas.ProfileStatsOut(
            totalChecks=0,
            averageScore=None,
            averageStructureScore=None,
            totalIssues=0,
            engineVersion=ENGINE_VERSION,
        )
    if not jobs:
        return schemas.ProfileStatsOut(totalChecks=0, averageScore=None, averageStructureScore=None, totalIssues=0, engineVersion=ENGINE_VERSION)
    return schemas.ProfileStatsOut(
        totalChecks=len(jobs),
        averageScore=round(sum(j.language_score for j in jobs) / len(jobs), 2),
        averageStructureScore=round(sum(j.structure_score for j in jobs) / len(jobs), 2),
        totalIssues=sum(j.issue_count for j in jobs),
        engineVersion=next((j.engine_version for j in jobs if j.engine_version), ENGINE_VERSION),
    )


@api_router.get("/history", response_model=List[schemas.HistoryItemOut], tags=["History"])
async def get_history(user_id: Optional[str] = None, skip: int = 0, limit: int = 50,
                      db: Session = Depends(get_db)):
    """ดึงประวัติการตรวจสอบของผู้ใช้"""
    if not user_id:
        raise HTTPException(status_code=400, detail="กรุณาระบุ user_id")

    try:
        jobs = crud.get_user_history(db, user_id=user_id, skip=skip, limit=limit)
    except Exception:
        logger.exception("failed to load history", extra={"user_id": user_id})
        return []

    return [
        schemas.HistoryItemOut(
            id=str(j.id), documentName=j.document_name,
            score=j.language_score, structureScore=j.structure_score,
            date=j.created_at.isoformat() if j.created_at else "",
            wordCount=j.word_count, writingStyle=j.writing_style,
            originalSnippet=(j.original_text or "")[:200],
            improvedSnippet=(j.improved_text or "")[:200],
            jobStatus=j.overall_status,
            engineVersion=j.engine_version or ENGINE_VERSION,
        )
        for j in jobs
    ]
