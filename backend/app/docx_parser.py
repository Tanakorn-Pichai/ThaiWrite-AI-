"""
ThaiWrite AI - Document Structure & Format Parser

Parses .docx files using python-docx to extract:
  - Headings, section hierarchy
  - Font family / size / bold
  - Page margins
  - Section ordering compliance

Parses .pdf files using PyMuPDF (fitz) to extract:
  - Text blocks per page
  - Font metadata
"""

import re
from typing import List, Dict, Any, Optional, Tuple
from io import BytesIO

import docx
from docx.shared import Inches

try:
    import fitz  # PyMuPDF
except ImportError:
    fitz = None  # type: ignore


# ────────────────────────────────────────────────────────
# 1. DOCX Parsing
# ────────────────────────────────────────────────────────

def parse_docx(file_bytes: bytes) -> Dict[str, Any]:
    """
    Parse a .docx file and extract structure + formatting metadata.

    Returns dict with:
      - margins: {left, top, right, bottom} in inches
      - detectedHeadings: list of headings with title, style, fontSize, isBold
      - fullText: concatenated body text
      - fontInfo: detected font family and sizes
    """
    doc = docx.Document(BytesIO(file_bytes))

    # ── Margins ──
    section = doc.sections[0]
    margins = {
        "left": round(section.left_margin.inches, 2) if section.left_margin else 1.5,
        "top": round(section.top_margin.inches, 2) if section.top_margin else 1.5,
        "right": round(section.right_margin.inches, 2) if section.right_margin else 1.0,
        "bottom": round(section.bottom_margin.inches, 2) if section.bottom_margin else 1.0,
    }

    # ── Headings & Body Text ──
    headings: List[Dict[str, Any]] = []
    paragraphs_text: List[str] = []
    detected_fonts = set()
    detected_sizes = set()

    for para in doc.paragraphs:
        text = para.text.strip()
        if not text:
            continue

        paragraphs_text.append(text)

        # Detect font info from runs
        font_name = None
        font_size = None
        is_bold = False
        if para.runs:
            run = para.runs[0]
            if run.font.name:
                font_name = run.font.name
                detected_fonts.add(font_name)
            if run.font.size:
                font_size = run.font.size.pt
                detected_sizes.add(font_size)
            is_bold = bool(run.font.bold)

        # Check if it's a heading
        style_name = para.style.name if para.style else ""
        is_heading = (
            style_name.startswith("Heading")
            or _looks_like_thai_heading(text)
        )

        if is_heading:
            level = _detect_heading_level(style_name, text)
            headings.append({
                "title": text,
                "style": style_name,
                "fontSize": font_size or 16,
                "isBold": is_bold,
                "level": level,
            })

    full_text = "\n".join(paragraphs_text)

    return {
        "margins": margins,
        "detectedHeadings": headings,
        "fullText": full_text,
        "fontInfo": {
            "detectedFonts": list(detected_fonts),
            "detectedSizes": sorted(detected_sizes) if detected_sizes else [],
        },
    }


def _looks_like_thai_heading(text: str) -> bool:
    """Check if the text looks like a Thai chapter/section heading."""
    patterns = [
        r'^บทที่\s*\d+',
        r'^\d+\.\d+\s+',
        r'^\d+\.\s+',
        r'^ภาคผนวก',
        r'^บรรณานุกรม',
        r'^สารบัญ',
        r'^กิตติกรรมประกาศ',
        r'^บทคัดย่อ',
        r'^เอกสารอ้างอิง',
    ]
    for p in patterns:
        if re.match(p, text):
            return True
    return False


def _detect_heading_level(style_name: str, text: str) -> int:
    """Determine heading level (1=chapter, 2=section, 3=subsection)."""
    if style_name == "Heading 1" or re.match(r'^บทที่\s*\d+', text):
        return 1
    if style_name == "Heading 2" or re.match(r'^\d+\.\d+\s+', text):
        return 2
    if style_name == "Heading 3" or re.match(r'^\d+\.\d+\.\d+\s+', text):
        return 3
    # Fallback
    if re.match(r'^(บรรณานุกรม|ภาคผนวก|สารบัญ|บทคัดย่อ|เอกสารอ้างอิง)', text):
        return 1
    return 2


# ────────────────────────────────────────────────────────
# 2. PDF Parsing (PyMuPDF)
# ────────────────────────────────────────────────────────

def parse_pdf(file_bytes: bytes) -> Dict[str, Any]:
    """
    Parse a .pdf file using PyMuPDF and extract text + basic font metadata.
    """
    if fitz is None:
        return {
            "margins": {"left": 1.5, "top": 1.5, "right": 1.0, "bottom": 1.0},
            "detectedHeadings": [],
            "fullText": "",
            "fontInfo": {"detectedFonts": [], "detectedSizes": []},
            "error": "PyMuPDF (fitz) not installed",
        }

    pdf_doc = fitz.open(stream=file_bytes, filetype="pdf")
    all_text_blocks: List[str] = []
    headings: List[Dict[str, Any]] = []
    detected_fonts = set()
    detected_sizes = set()

    for page_num in range(len(pdf_doc)):
        page = pdf_doc.load_page(page_num)

        # Extract text blocks
        blocks = page.get_text("dict")["blocks"]
        for block in blocks:
            if "lines" not in block:
                continue
            for line in block["lines"]:
                line_text_parts = []
                for span in line["spans"]:
                    span_text = span["text"].strip()
                    if span_text:
                        line_text_parts.append(span_text)
                        detected_fonts.add(span["font"])
                        detected_sizes.add(round(span["size"], 1))

                line_text = " ".join(line_text_parts)
                if line_text:
                    all_text_blocks.append(line_text)
                    if _looks_like_thai_heading(line_text):
                        headings.append({
                            "title": line_text,
                            "style": "PDF_detected",
                            "fontSize": round(span["size"], 1) if line["spans"] else 16,
                            "isBold": "Bold" in (span.get("font", "") if line["spans"] else ""),
                            "level": _detect_heading_level("", line_text),
                        })

    pdf_doc.close()

    full_text = "\n".join(all_text_blocks)

    return {
        "margins": {"left": 1.5, "top": 1.5, "right": 1.0, "bottom": 1.0},
        "detectedHeadings": headings,
        "fullText": full_text,
        "fontInfo": {
            "detectedFonts": list(detected_fonts),
            "detectedSizes": sorted(detected_sizes) if detected_sizes else [],
        },
    }


# ────────────────────────────────────────────────────────
# 3. Plain-text "parsing" (for text input mode)
# ────────────────────────────────────────────────────────

def parse_text(text: str) -> Dict[str, Any]:
    """Minimal parser for plain text input (no file to parse)."""
    lines = [l.strip() for l in text.split("\n") if l.strip()]
    headings = [
        {
            "title": line,
            "style": "text_detected",
            "fontSize": 16,
            "isBold": False,
            "level": _detect_heading_level("", line),
        }
        for line in lines
        if _looks_like_thai_heading(line)
    ]
    return {
        "margins": {"left": 1.5, "top": 1.5, "right": 1.0, "bottom": 1.0},
        "detectedHeadings": headings,
        "fullText": text,
        "fontInfo": {"detectedFonts": [], "detectedSizes": []},
    }
