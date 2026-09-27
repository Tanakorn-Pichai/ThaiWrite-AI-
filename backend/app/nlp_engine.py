"""
ThaiWrite AI - NLP Analysis Engine (PyThaiNLP-based)

Uses PyThaiNLP's newmm tokenizer for word segmentation,
spell checking, and academic style rewriting.
"""

import os
import re
from functools import lru_cache
from typing import List, Dict, Any, Tuple

from pythainlp.tokenize import word_tokenize
from pythainlp.spell import correct as spell_correct
from pythainlp.corpus import thai_words

# ────────────────────────────────────────────────────────
# 1. Academic replacement rules
# ────────────────────────────────────────────────────────
ACADEMIC_REPLACEMENTS: List[Tuple[str, str, str, str]] = [
    # (pattern, replacement, issue_type, reason)
    # 1. คำสะกดผิดตามบริบท (Contextual Spelling)
    ("ขออนุญาติ", "ขออนุญาต", "spelling", "คำว่า 'ขออนุญาต' สะกดโดยไม่มีสระอิ ตามพจนานุกรมราชบัณฑิตยสถาน"),
    ("อนุญาติ", "อนุญาต", "spelling", "คำว่า 'อนุญาต' สะกดโดยไม่มีสระอิ ตามพจนานุกรมราชบัณฑิตยสถาน"),
    ("สังเกตุ", "สังเกต", "spelling", "คำว่า 'สังเกต' สะกดโดยไม่มีสระอุ"),
    ("กฏหมาย", "กฎหมาย", "spelling", "ใช้ ฎ (ชฎา) ในคำว่า 'กฎหมาย'"),
    ("กฏเกณฑ์", "กฎเกณฑ์", "spelling", "ใช้ ฎ (ชฎา) ในคำว่า 'กฎเกณฑ์'"),
    ("กระทันหัน", "กะทันหัน", "spelling", "สะกดว่า 'กะทันหัน' โดยไม่มี ร.เรือ"),
    ("ผัดวันประกันพรุ่ง", "ผลัดวันประกันพรุ่ง", "spelling", "ใช้คำว่า 'ผลัด' (เปลี่ยน) ไม่ใช่ 'ผัด' (อาหาร)"),
    ("สัมนา", "สัมมนา", "spelling", "สะกดว่า 'สัมมนา' มี ม.ม้า 2 ตัว"),
    ("ลายเซ็นต์", "ลายเซ็น", "spelling", "คำว่า 'ลายเซ็น' ไม่มี ต์"),
    ("เวบไซต์", "เว็บไซต์", "spelling", "สะกดคำทับศัพท์ว่า 'เว็บไซต์'"),
    ("เวบไซด์", "เว็บไซต์", "spelling", "สะกดคำทับศัพท์ว่า 'เว็บไซต์'"),
    ("อินเตอร์เนต", "อินเทอร์เน็ต", "spelling", "สะกดคำทับศัพท์ว่า 'อินเทอร์เน็ต'"),
    ("ออฟฟิส", "ออฟฟิศ", "spelling", "ใช้ ศ.ศาลา เป็นตัวสะกด"),

    # 2. คำฟุ่มเฟือยและคำซ้ำซ้อน (Redundant & Repetitive Words)
    ("แล้วเรียบร้อยแล้ว", "แล้ว", "grammar", "ตัดคำซ้ำซ้อน 'เรียบร้อยแล้ว' ออกเมื่อมีคำว่า 'แล้ว'"),
    ("ได้ทำการส่ง", "ส่ง", "grammar", "ตัดกริยาซ้อน 'ได้ทำการ' ให้เหลือเพียง 'ส่ง'"),
    ("ทำการส่ง", "ส่ง", "grammar", "ตัดกริยาช่วยฟุ่มเฟือย 'ทำการ' ออก เพื่อความกระชับ"),
    ("ทำการวิเคราะห์", "วิเคราะห์", "grammar", "ใช้คำกริยาตรงเพื่อความกระชับ"),
    ("ทำการศึกษา", "ศึกษา", "grammar", "ตัดกริยาช่วย 'ทำการ' ออก"),
    ("ทำการทดลอง", "ทดลอง", "grammar", "ตัดกริยาช่วย 'ทำการ' ออก"),
    ("ทำการทดสอบ", "ทดสอบ", "grammar", "ตัดกริยาช่วย 'ทำการ' ออก"),
    ("ทำการตรวจสอบ", "ตรวจสอบ", "grammar", "ตัดกริยาช่วย 'ทำการ' ออก"),
    ("ได้ทำการ", "ได้", "grammar", "ตัดกริยาซ้อน 'ทำการ' ออก"),
    ("มีความต้องการที่จะ", "ต้องการ", "wordUsage", "รวบคำเพื่อลดความเยิ่นเย้อของประโยค"),
    ("มีความประสงค์ที่จะ", "ประสงค์", "wordUsage", "รวบคำเพื่อลดคำฟุ่มเฟือย"),
    ("มีจุดประสงค์เพื่อที่จะ", "มีวัตถุประสงค์เพื่อ", "wordUsage", "ใช้คำศัพท์เชิงวิชาการและลดคำฟุ่มเฟือย"),
    ("มีความจำเป็นที่จะต้อง", "จำเป็นต้อง", "wordUsage", "รวบเป็น 'จำเป็นต้อง' เพื่อประโยคที่กระชับ"),
    ("เป็นจำนวนทั้งสิ้น", "รวม", "wordUsage", "ใช้คำกระชับ 'รวม' แทน 'เป็นจำนวนทั้งสิ้น'"),
    ("ในอนาคตข้างหน้า", "ในอนาคต", "wordUsage", "คำว่า 'อนาคต' หมายถึงข้างหน้าอยู่แล้ว ตัดคำซ้ำซ้อนออก"),
    ("พิจารณาดู", "พิจารณา", "wordUsage", "ตัดคำฟุ่มเฟือย 'ดู' ออก"),

    # 3. ระดับภาษาไม่เหมาะสม (Inappropriate Academic Tone)
    ("เยอะแยะ", "จำนวนมาก", "academic", "หลีกเลี่ยงภาษาพูด เปลี่ยนเป็นภาษาทางการ"),
    ("เยอะมาก", "จำนวนมาก", "academic", "หลีกเลี่ยงภาษาพูด เปลี่ยนเป็นภาษาทางการ"),
    ("จริงๆ แล้ว", "แท้จริงแล้ว", "academic", "ปรับภาษาพูดเป็นภาษาทางการ"),
    ("จริงๆ", "แท้จริง", "academic", "ปรับภาษาพูดเป็นภาษาทางการ"),
    ("ในส่วนของ", "สำหรับ", "academic", "ใช้คำเชื่อมที่กระชับและเป็นทางการขึ้น"),
    ("แบบว่า", "", "academic", "ตัดคำภาษาพูดที่ไม่จำเป็นออก"),
    ("ก็คือ", "คือ", "academic", "ตัดคำฟุ่มเฟือย 'ก็' ออก"),
    ("ทำเรื่อง", "ยื่นคำร้อง", "academic", "ใช้ภาษาวิชาการ/ราชการที่เป็นทางการ"),

    # 4. โครงสร้างประโยคไม่สมบูรณ์ (Incomplete Sentence Structure)
    ("จึงทำให้เกิด", "ส่งผลให้เกิด", "grammar", "ปรับโครงสร้างประโยคเชื่อมโยงเหตุและผลให้สมบูรณ์"),
    ("ทำให้เกิด", "ส่งผลให้เกิด", "grammar", "ขึ้นต้นประโยคด้วยคำกริยา 'ส่งผลให้เกิด' เพื่อความสมบูรณ์ของความหมาย"),
]

# Style-specific rules. Spelling and sentence-level grammar always run;
# register/word-choice rules only run for styles that need formal language.
STYLE_RULE_TYPES: Dict[str, set[str]] = {
    "ทั่วไป": {"grammar"},
    "เชิงวิชาการ": {"grammar", "wordUsage", "academic"},
    "รายงาน": {"grammar", "wordUsage", "academic"},
    "บทความ": {"grammar", "wordUsage", "academic"},
    "วิทยานิพนธ์": {"grammar", "wordUsage", "academic"},
}

# Known misspellings for quick lookup
CUSTOM_DICTIONARY_WORDS = tuple(
    word.strip() for word in os.getenv("THAI_CUSTOM_WORDS", "").split(",") if word.strip()
)


@lru_cache(maxsize=1)
def _thai_word_set() -> set[str]:
    """Load the Thai dictionary once per process instead of once per request."""
    return set(thai_words())


@lru_cache(maxsize=2048)
def _cached_spell_suggestion(word: str) -> str:
    """Cache spell suggestions because documents commonly repeat the same words."""
    suggestion = spell_correct(word)
    return suggestion or ""


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
    # Thai sentences typically end with punctuation or line breaks.
    # Do not use variable-width look-behind here: Python's ``re`` rejects it.
    thai_sentences = re.split(r'[\.\?\!。]+|\n|\s{2,}', text)
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
    try:
        tokenizer_kwargs = {"engine": "newmm"}
        if CUSTOM_DICTIONARY_WORDS:
            tokenizer_kwargs["custom_dict"] = list(CUSTOM_DICTIONARY_WORDS)
        words = word_tokenize(cleaned, **tokenizer_kwargs)
    except (TypeError, ValueError):
        # Older PyThaiNLP releases may not support custom_dict for newmm.
        words = word_tokenize(cleaned, engine="newmm")
    word_count = len([w for w in words if w.strip()])
    sentence_count = _count_sentences(cleaned)

    # ── 2. Spelling check via PyThaiNLP ──
    spelling_issues = _check_spelling(words, cleaned)

    # ── 3. Repeated words check (คำซ้ำซ้อน) ──
    repeated_issues, text_after_rep = _check_repeated_words(cleaned)

    # ── 4. Grammar and style rules ──
    style_issues, improved_text = _apply_academic_rules(
        text_after_rep,
        allowed_types=STYLE_RULE_TYPES.get(writing_style, {"wordUsage", "academic"}),
    )

    # ── 5. Sentence structure and semantic consistency check ──
    structure_issues = _check_sentence_structure(cleaned)
    for issue in sorted(
        (item for item in structure_issues if item.get("start_offset") is not None),
        key=lambda item: item["start_offset"],
        reverse=True,
    ):
        start = issue["start_offset"]
        end = issue["end_offset"]
        improved_text = improved_text[:start] + issue["replacement"] + improved_text[end:]

    # ── 6. Aggregate issues (Deduplicate while preserving order) ──
    all_issues = []
    seen_issues = set()
    for iss in (spelling_issues + repeated_issues + style_issues + structure_issues):
        issue_key = (
            iss["type"],
            iss["detected_text"],
            iss.get("replacement", ""),
            iss.get("start_offset"),
            iss.get("end_offset"),
        )
        if issue_key not in seen_issues:
            seen_issues.add(issue_key)
            all_issues.append(iss)

    # Return findings in document order so the primary issue and UI numbering
    # match the text the user is reading.
    all_issues.sort(key=lambda issue: issue.get("start_offset", len(cleaned)))

    categories = {
        "spelling": len([i for i in all_issues if i["type"] == "spelling"]),
        "grammar": len([i for i in all_issues if i["type"] == "grammar"]),
        "wordUsage": len([i for i in all_issues if i["type"] == "wordUsage"]),
        "academic": len([i for i in all_issues if i["type"] == "academic"]),
    }
    issue_count = sum(categories.values())

    # ── 7. Score calculation ──
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
            "replacement": iss.get("replacement", ""),
            "reason": iss["reason"],
            "suggestions": iss.get("suggestions", [iss["replacement"]] if iss.get("replacement") else []),
            "startOffset": iss.get("start_offset"),
            "endOffset": iss.get("end_offset"),
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

def _check_spelling(words: List[str], text: str) -> List[Dict[str, Any]]:
    """Check each token against PyThaiNLP dictionary and known misspellings."""
    issues: List[Dict[str, Any]] = []
    thai_word_set = _thai_word_set()

    for word in words:
        w = word.strip()
        if not w or len(w) < 2:
            continue

        # Skip non-Thai characters (numbers, English, punctuation)
        if not re.search(r'[฀-๿]', w):
            continue

        start = text.find(w)
        # Check known misspellings first
        if w in KNOWN_MISSPELLINGS:
            replacement = KNOWN_MISSPELLINGS[w]
            issues.append({
                "type": "spelling",
                "detected_text": w,
                "replacement": replacement,
                "suggestions": [replacement],
                "reason": f"คำว่า '{w}' สะกดผิด ควรเปลี่ยนเป็น '{replacement}' ตามพจนานุกรมราชบัณฑิตยสถาน",
                "start_offset": start if start >= 0 else None,
                "end_offset": start + len(w) if start >= 0 else None,
            })
            continue

        # Check against PyThaiNLP corpus
        if w not in thai_word_set and len(w) >= 3:
            suggestion = _cached_spell_suggestion(w)
            if suggestion and suggestion != w:
                issues.append({
                    "type": "spelling",
                    "detected_text": w,
                    "replacement": suggestion,
                    "suggestions": [suggestion],
                    "reason": f"คำว่า '{w}' อาจสะกดผิด แนะนำ '{suggestion}'",
                    "start_offset": start if start >= 0 else None,
                    "end_offset": start + len(w) if start >= 0 else None,
                })

    return issues


def _check_repeated_words(text: str) -> Tuple[List[Dict[str, str]], str]:
    """Detect consecutive duplicate word/phrase repetitions (คำซ้ำซ้อน)."""
    issues: List[Dict[str, str]] = []
    improved = text

    # Pattern for consecutive duplicated words (2+ times)
    pattern = r'([฀-๿]{2,})(\s*\1){1,}'

    # Exclude common intentional Thai word reduplications
    exclude_list = {"ต่าง", "เพื่อน", "เล็ก", "ใหญ่", "คล้าย", "ค่อย", "จริง", "แฟน", "น้อง", "พี่", "เด็ก"}

    for match in re.finditer(pattern, text):
        full_match = match.group(0)
        single_word = match.group(1)

        if single_word in exclude_list:
            continue

        issues.append({
            "type": "grammar",
            "detected_text": full_match,
            "replacement": single_word,
            "reason": f"พบการใช้คำซ้ำซ้อน '{full_match}' ติดกันหลายครั้ง ควรใช้คำว่า '{single_word}' เพียงครั้งเดียวเพื่อความถูกต้องของประโยค",
            "start_offset": match.start(),
            "end_offset": match.end(),
        })
        improved = improved.replace(full_match, single_word)

    return issues, improved


def _check_sentence_structure(text: str) -> List[Dict[str, str]]:
    """Check for incomplete or internally contradictory Thai sentence patterns."""
    issues: List[Dict[str, str]] = []

    lines = [line.strip() for line in text.splitlines() if line.strip()]
    for line in lines:
        # Check for clauses starting with cause/condition conjunctions without a main clause.
        # Thai text is often written without spaces between words, so a word-boundary
        # assertion would miss valid clauses such as "เนื่องจากไม่มีข้อมูล".
        if re.match(r'^(เนื่องจาก|เพราะว่า|ด้วยเหตุที่)', line) and not re.search(r'(จึง|ส่งผลให้|ทำให้|ดังนั้น)', line):
            issues.append({
                "type": "grammar",
                "detected_text": line,
                "replacement": f"{line} จึงไม่สามารถดำเนินการได้",
                "reason": "ประโยคขึ้นต้นด้วยคำเชื่อมสาเหตุ แต่ขาดภาคประธานหรือประโยคหลัก",
            })

        # A completed eating action (กินข้าวแล้ว) conflicts with a simultaneous
        # progressive eating action (กำลังกินอยู่). Suggest one consistent tense.
        conflict = re.search(r'^(?P<subject>.+?)กินข้าวแล้วกำลังกินอยู่$', line)
        if conflict:
            subject = conflict.group("subject")
            issues.append({
                "type": "grammar",
                "detected_text": line,
                "replacement": f"{subject}กำลังกินข้าวอยู่",
                "reason": "คำว่า 'กินข้าวแล้ว' หมายถึงรับประทานเสร็จแล้ว แต่ 'กำลังกินอยู่' หมายถึงกำลังทำในขณะนี้ จึงควรเลือกใช้เวลาให้สอดคล้องกัน",
                "start_offset": text.find(line),
                "end_offset": text.find(line) + len(line),
            })

    return issues


def _apply_academic_rules(
    text: str,
    allowed_types: set[str],
) -> Tuple[List[Dict[str, str]], str]:
    """Apply enabled high-confidence style rules without overlapping replacements."""
    issues: List[Dict[str, str]] = []
    improved = text
    occupied_ranges: List[Tuple[int, int]] = []

    # Detect the common Thai construction ``...แล้วเรียบร้อยแล้ว``. The first
    # ``แล้ว`` is redundant when the completed-action phrase already ends with
    # ``เรียบร้อยแล้ว`` (for example, ``ส่งงานแล้วเรียบร้อยแล้ว``).
    if "grammar" in allowed_types:
        redundant_pattern = re.compile(r"(?P<before>[^\n.!?]{1,100}?)แล้วเรียบร้อยแล้ว")
        for match in redundant_pattern.finditer(text):
            before = match.group("before")
            redundant_start = match.start("before") + len(before)
            redundant_end = redundant_start + len("แล้ว")
            issues.append({
                "type": "grammar",
                "detected_text": match.group(0),
                "replacement": before + "เรียบร้อยแล้ว",
                "reason": "คำว่า 'แล้ว' ซ้ำกับวลี 'เรียบร้อยแล้ว' ควรใช้เพียงรูปแบบเดียวเพื่อให้ประโยคกระชับ",
                "start_offset": match.start(),
                "end_offset": match.end(),
                "replacement_start": redundant_start,
                "replacement_end": redundant_end,
            })
            occupied_ranges.append((match.start(), match.end()))

    # Longer phrases must win over shorter phrases. This prevents rules such as
    # ``ทำการส่ง`` and ``ทำการ`` from producing overlapping suggestions and
    # prevents replacement text from being scanned again in the same pass.
    rules = sorted(ACADEMIC_REPLACEMENTS, key=lambda item: len(item[0]), reverse=True)
    for pattern, repl, issue_type, reason in rules:
        if issue_type not in allowed_types and issue_type != "spelling":
            continue
        for match in re.finditer(re.escape(pattern), text):
            start, end = match.span()
            if any(start < used_end and end > used_start for used_start, used_end in occupied_ranges):
                continue

            occupied_ranges.append((start, end))
            issues.append({
                "type": issue_type,
                "detected_text": pattern,
                "replacement": repl,
                "reason": reason,
                "start_offset": start,
                "end_offset": end,
            })

    # Apply all replacements from right to left so offsets remain valid and a
    # replacement can never trigger another rule in this same analysis.
    for issue in sorted(issues, key=lambda item: item["start_offset"], reverse=True):
        start = issue["start_offset"]
        end = issue["end_offset"]
        improved = improved[:start] + issue["replacement"] + improved[end:]

    issues.sort(key=lambda item: item["start_offset"])
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
