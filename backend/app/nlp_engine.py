"""
ThaiWrite AI - NLP Analysis Engine (PyThaiNLP-based)

Uses PyThaiNLP's newmm tokenizer for word segmentation,
spell checking, and academic style rewriting.
"""

import re
from typing import List, Dict, Any, Tuple

from pythainlp.tokenize import word_tokenize
from pythainlp.spell import correct as spell_correct
from pythainlp.corpus import thai_words

# ────────────────────────────────────────────────────────
# 1. Academic replacement rules
# ────────────────────────────────────────────────────────
ACADEMIC_REPLACEMENTS: List[Tuple[str, str, str, str]] = [
    # (pattern, replacement, issue_type, reason)
    ("ทำการส่ง", "ส่ง", "grammar", "ตัดกริยาช่วยฟุ่มเฟือย 'ทำการ' ออก เพื่อความกระชับ"),
    ("ทำการวิเคราะห์", "วิเคราะห์", "grammar", "ใช้คำกริยาตรงเพื่อความกระชับ"),
    ("ทำการศึกษา", "ศึกษา", "grammar", "ตัดกริยาช่วย 'ทำการ' ออก"),
    ("ทำการทดลอง", "ทดลอง", "grammar", "ตัดกริยาช่วย 'ทำการ' ออก"),
    ("ทำการทดสอบ", "ทดสอบ", "grammar", "ตัดกริยาช่วย 'ทำการ' ออก"),
    ("ทำการตรวจสอบ", "ตรวจสอบ", "grammar", "ตัดกริยาช่วย 'ทำการ' ออก"),
    ("ทำการประเมิน", "ประเมิน", "grammar", "ตัดกริยาช่วย 'ทำการ' ออก"),
    ("ทำการสำรวจ", "สำรวจ", "grammar", "ตัดกริยาช่วย 'ทำการ' ออก"),
    ("ทำการเปรียบเทียบ", "เปรียบเทียบ", "grammar", "ตัดกริยาช่วย 'ทำการ' ออก"),
    ("ได้ทำการ", "ได้", "grammar", "ตัดกริยาซ้อน 'ทำการ' ออก"),
    ("มีความต้องการที่จะ", "ต้องการ", "wordUsage", "รวบคำเพื่อลดความเยิ่นเย้อของประโยค"),
    ("มีจุดประสงค์เพื่อที่จะ", "มีวัตถุประสงค์เพื่อ", "wordUsage", "ใช้คำศัพท์เชิงวิชาการและลดคำฟุ่มเฟือย"),
    ("ในส่วนของ", "สำหรับ", "academic", "ใช้คำเชื่อมที่กระชับและเป็นทางการขึ้น"),
    ("เยอะแยะ", "จำนวนมาก", "academic", "หลีกเลี่ยงภาษาพูด เปลี่ยนเป็นภาษาทางการ"),
    ("เยอะมาก", "จำนวนมาก", "academic", "หลีกเลี่ยงภาษาพูด เปลี่ยนเป็นภาษาทางการ"),
    ("แบบว่า", "", "academic", "ตัดคำภาษาพูดที่ไม่จำเป็นออก"),
    ("ก็คือ", "คือ", "academic", "ตัดคำฟุ่มเฟือย 'ก็' ออก"),
    ("ตัวเอง", "ตนเอง", "academic", "ใช้คำทางการ 'ตนเอง' แทน 'ตัวเอง'"),
    ("เค้า", "เขา", "spelling", "สะกดถูกต้องตามพจนานุกรมราชบัณฑิตยสถาน"),
    ("สัมนา", "สัมมนา", "spelling", "สะกดถูกต้องตามพจนานุกรมราชบัณฑิตยสถาน"),
    ("ลายเซ็นต์", "ลายเซ็น", "spelling", "สะกดถูกต้องตามพจนานุกรมราชบัณฑิตยสถาน"),
    ("โปรแกรมเมอร์", "โปรแกรมเมอร์", "spelling", "ตรวจสอบให้ตรงกับพจนานุกรม"),
]

# Known misspellings for quick lookup
KNOWN_MISSPELLINGS: Dict[str, str] = {
    "สัมนา": "สัมมนา",
    "เค้า": "เขา",
    "ลายเซ็นต์": "ลายเซ็น",
    "บรรได": "บันได",
    "กระทั่ง": "กระทั่ง",
    "สาระณียกรรม": "สารานียกรรม",
    "ปฏิสังขร": "ปฏิสังขรณ์",
    "อนุญาติ": "อนุญาต",
    "สังเกตุ": "สังเกต",
    "ประมาท": "ประมาท",
}


def _count_sentences(text: str) -> int:
    """Estimate sentence count from Thai text by splitting on sentence-ending markers."""
    # Thai sentences typically end with spaces or certain punctuation
    sentences = re.split(r'[。\n\r]+|(?<=\s{2,})', text)
    # Also split on Thai sentence-like patterns
    thai_sentences = re.split(r'[\.\?\!。]+|\n', text)
    count = len([s for s in thai_sentences if s.strip()])
    return max(count, 1)


def analyze_thai_text(text: str, writing_style: str = "เชิงวิชาการ") -> Dict[str, Any]:
    """
    Main NLP analysis function using PyThaiNLP.

    Args:
        text: The Thai text to analyze
        writing_style: Writing style context

    Returns:
        Dictionary matching the frontend AnalysisResult interface
    """
    if not text or not text.strip():
        return _empty_result()

    cleaned = text.strip()

    # ── 1. Word tokenization via PyThaiNLP (newmm engine) ──
    words = word_tokenize(cleaned, engine="newmm")
    word_count = len([w for w in words if w.strip()])
    sentence_count = _count_sentences(cleaned)

    # ── 2. Spelling check via PyThaiNLP ──
    spelling_issues = _check_spelling(words)

    # ── 3. Grammar and academic style rules ──
    style_issues, improved_text = _apply_academic_rules(cleaned)

    # ── 4. Aggregate issues ──
    all_issues = spelling_issues + style_issues
    categories = {
        "spelling": len([i for i in all_issues if i["type"] == "spelling"]),
        "grammar": len([i for i in all_issues if i["type"] == "grammar"]),
        "wordUsage": len([i for i in all_issues if i["type"] == "wordUsage"]),
        "academic": len([i for i in all_issues if i["type"] == "academic"]),
    }
    issue_count = sum(categories.values())

    # ── 5. Score calculation ──
    score = max(60, 100 - issue_count * 3)

    # Primary issue for top-level display
    primary = all_issues[0] if all_issues else {
        "type": "grammar",
        "detected_text": "",
        "replacement": "",
        "reason": "ไม่พบข้อผิดพลาด",
    }

    # Build detailed breakdown descriptions
    detailed_breakdown = _build_breakdown(categories, writing_style)

    # Build highlights list (matches frontend IssueHighlight[])
    highlights = [
        {
            "text": iss["detected_text"],
            "type": iss["type"],
            "replacement": iss["replacement"],
            "reason": iss["reason"],
        }
        for iss in all_issues
    ]

    return {
        "wordCount": word_count,
        "sentenceCount": sentence_count,
        "issueCount": issue_count,
        "score": score,
        "categories": categories,
        "detectedText": primary.get("detected_text", ""),
        "replacement": primary.get("replacement", ""),
        "reason": primary.get("reason", ""),
        "originalText": cleaned,
        "improvedText": improved_text,
        "detailedBreakdown": detailed_breakdown,
        "highlights": highlights,
    }


# ────────────────────────────────────────────────────────
# Internal helpers
# ────────────────────────────────────────────────────────

def _check_spelling(words: List[str]) -> List[Dict[str, str]]:
    """Check each token against PyThaiNLP dictionary and known misspellings."""
    issues: List[Dict[str, str]] = []
    thai_word_set = thai_words()

    for word in words:
        w = word.strip()
        if not w or len(w) < 2:
            continue

        # Skip non-Thai characters (numbers, English, punctuation)
        if not re.search(r'[฀-๿]', w):
            continue

        # Check known misspellings first
        if w in KNOWN_MISSPELLINGS:
            issues.append({
                "type": "spelling",
                "detected_text": w,
                "replacement": KNOWN_MISSPELLINGS[w],
                "reason": f"คำว่า '{w}' สะกดผิด ควรเปลี่ยนเป็น '{KNOWN_MISSPELLINGS[w]}' ตามพจนานุกรมราชบัณฑิตยสถาน",
            })
            continue

        # Check against PyThaiNLP corpus
        if w not in thai_word_set and len(w) >= 3:
            suggestion = spell_correct(w)
            if suggestion and suggestion != w:
                issues.append({
                    "type": "spelling",
                    "detected_text": w,
                    "replacement": suggestion,
                    "reason": f"คำว่า '{w}' อาจสะกดผิด แนะนำ '{suggestion}'",
                })

    return issues


def _apply_academic_rules(text: str) -> Tuple[List[Dict[str, str]], str]:
    """Apply academic writing style rules and return issues + improved text."""
    issues: List[Dict[str, str]] = []
    improved = text

    for pattern, repl, issue_type, reason in ACADEMIC_REPLACEMENTS:
        if pattern in improved:
            # Find all occurrences and record start/end offsets
            for match in re.finditer(re.escape(pattern), improved):
                issues.append({
                    "type": issue_type,
                    "detected_text": pattern,
                    "replacement": repl,
                    "reason": reason,
                    "start_offset": match.start(),
                    "end_offset": match.end(),
                })
            improved = improved.replace(pattern, repl)

    return issues, improved


def _build_breakdown(categories: Dict[str, int], style: str) -> Dict[str, str]:
    """Build human-readable breakdown descriptions per category."""
    return {
        "spelling": (
            "พบคำสะกดผิดที่อาจพิมพ์ตกหล่น ควรตรวจสอบตามพจนานุกรมฉบับราชบัณฑิตยสถานเพื่อความถูกต้อง"
            if categories["spelling"] > 0
            else "ไม่พบคำสะกดผิดในเอกสาร"
        ),
        "grammar": (
            f"ตรวจสอบความสอดคล้องของโครงสร้างประโยคตามรูปแบบ{style} และตัดกริยาช่วยฟุ่มเฟือย"
            if categories["grammar"] > 0
            else "ไม่พบข้อผิดพลาดทางไวยากรณ์"
        ),
        "wordUsage": (
            "ตรวจพบคำเชื่อมและสำนวนที่สามารถรวบคำเพื่อลดความเยิ่นเย้อของประโยค"
            if categories["wordUsage"] > 0
            else "การใช้คำถูกต้องเหมาะสม"
        ),
        "academic": (
            f"ปรับระดับภาษาให้มีความเป็นวิชาการและเป็นทางการ เหมาะสำหรับ{style}"
            if categories["academic"] > 0
            else "ระดับภาษาเหมาะสมกับงานเขียนเชิงวิชาการ"
        ),
    }


def _empty_result() -> Dict[str, Any]:
    """Return an empty analysis result."""
    return {
        "wordCount": 0,
        "sentenceCount": 0,
        "issueCount": 0,
        "score": 100,
        "categories": {"spelling": 0, "grammar": 0, "wordUsage": 0, "academic": 0},
        "detectedText": "",
        "replacement": "",
        "reason": "ไม่มีข้อความสำหรับตรวจสอบ",
        "originalText": "",
        "improvedText": "",
        "detailedBreakdown": {
            "spelling": "ไม่มีข้อความสำหรับตรวจสอบ",
            "grammar": "ไม่มีข้อความสำหรับตรวจสอบ",
            "wordUsage": "ไม่มีข้อความสำหรับตรวจสอบ",
            "academic": "ไม่มีข้อความสำหรับตรวจสอบ",
        },
        "highlights": [],
    }
