"""
ThaiWrite AI - Pydantic Schemas

Request/response models matching the frontend TypeScript interfaces
and the API contract in BACKEND_AND_DATABASE_SPEC.md.
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


# ────────────────────────────────────────────────────────
# Template Schemas
# ────────────────────────────────────────────────────────

class TemplateSectionOut(BaseModel):
    id: str
    title: str
    level: int = Field(..., ge=1, le=3)
    required: bool = True
    description: Optional[str] = None

    class Config:
        from_attributes = True


class FormattingRules(BaseModel):
    fontFamily: str
    fontSizeHeading: str
    fontSizeBody: str
    margins: str
    lineSpacing: str
    pageNumbering: str


class DocTemplateOut(BaseModel):
    id: str
    code: str
    name: str
    category: str
    description: Optional[str] = None
    university: Optional[str] = None
    is_custom: bool = False
    formattingRules: FormattingRules
    requiredSections: List[TemplateSectionOut] = []
    requiredSectionsCount: int = 0

    class Config:
        from_attributes = True


class CustomTemplateUploadResponse(BaseModel):
    id: str
    name: str
    code: str
    category: str = "custom"
    isCustom: bool = True
    description: Optional[str] = None
    university: Optional[str] = None
    formattingRules: FormattingRules
    requiredSections: List[TemplateSectionOut] = []
    detectedSections: List[TemplateSectionOut] = []


# ────────────────────────────────────────────────────────
# Analysis Schemas
# ────────────────────────────────────────────────────────

class LanguageIssueItem(BaseModel):
    text: str
    type: str
    replacement: str
    reason: str


class CategoryCounts(BaseModel):
    spelling: int = 0
    grammar: int = 0
    wordUsage: int = 0
    academic: int = 0


class DetailedBreakdown(BaseModel):
    spelling: str = ""
    grammar: str = ""
    wordUsage: str = ""
    academic: str = ""


class LanguageResult(BaseModel):
    wordCount: int
    sentenceCount: int
    issueCount: int
    score: int
    categories: CategoryCounts
    detectedText: str = ""
    replacement: str = ""
    reason: str = ""
    originalText: str = ""
    improvedText: str = ""
    detailedBreakdown: DetailedBreakdown
    highlights: List[LanguageIssueItem] = []


class SectionCheckItem(BaseModel):
    id: str
    title: str
    level: int
    status: str  # 'present' | 'missing' | 'out_of_order' | 'warning'
    expectedPosition: int
    actualPosition: Optional[int] = None
    note: str


class FormattingCheckItem(BaseModel):
    id: str
    ruleName: str
    expected: str
    detected: str
    status: str  # 'pass' | 'warning' | 'fail' | 'unknown'
    recommendation: str


class SectionsSummary(BaseModel):
    total: int
    matched: int
    missing: int
    outOfOrder: int


class StructureResult(BaseModel):
    templateName: str
    templateId: str
    overallScore: int
    complianceStatus: str  # 'pass' | 'needs_revision' | 'fail'
    sectionsSummary: SectionsSummary
    sectionChecks: List[SectionCheckItem]
    formattingChecks: List[FormattingCheckItem]
    structureRecommendations: List[str]


class AnalysisResponse(BaseModel):
    """Full response for POST /api/v1/analyze — matches frontend types."""
    jobId: str
    documentName: str
    languageResult: LanguageResult
    structureResult: StructureResult


class JobStatusResponse(BaseModel):
    """Status of an async analysis job."""
    jobId: str
    status: str  # 'pending' | 'processing' | 'completed' | 'failed'
    step: Optional[str] = None
    error: Optional[str] = None
    requestId: Optional[str] = None
    engineVersion: Optional[str] = None
    result: Optional[AnalysisResponse] = None


class ProfileStatsOut(BaseModel):
    totalChecks: int
    averageScore: Optional[float] = None
    averageStructureScore: Optional[float] = None
    totalIssues: int
    engineVersion: str


# ────────────────────────────────────────────────────────
# History
# ────────────────────────────────────────────────────────

class HistoryItemOut(BaseModel):
    id: str
    documentName: str
    score: int
    structureScore: int
    templateName: Optional[str] = None
    date: str
    wordCount: int
    writingStyle: str
    originalSnippet: Optional[str] = None
    improvedSnippet: Optional[str] = None
    jobStatus: str = "completed"
    engineVersion: Optional[str] = None

    class Config:
        from_attributes = True
