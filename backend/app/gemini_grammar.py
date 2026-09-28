"""Optional Gemini-powered academic grammar review.

The API key is read only from the backend environment. This module is best-effort:
when Gemini is disabled, unavailable, or returns invalid data, callers keep the
PyThaiNLP result instead of failing the analysis request.
"""

import json
import logging
import os
import time
from typing import Any, Dict, List, Optional

logger = logging.getLogger("thaiwrite.gemini")
FORMAL_STYLES = {"เชิงวิชาการ", "รายงาน", "บทความ", "วิทยานิพนธ์"}


def is_enabled(writing_style: str) -> bool:
    key = os.getenv("GEMINI_API_KEY", "").strip()
    return (
        writing_style in FORMAL_STYLES
        and os.getenv("ENABLE_GEMINI_GRAMMAR", "false").lower() == "true"
        and bool(key)
        and key != "YOUR_ROTATED_GEMINI_KEY"
        and key != "MY_GEMINI_API_KEY"
    )


def _extract_json(text: str) -> Dict[str, Any]:
    raw = text.strip()
    if raw.startswith("```"):
        raw = raw.strip("`")
        if raw.startswith("json"):
            raw = raw[4:]
    payload = json.loads(raw)
    return payload if isinstance(payload, dict) else {}


def _normalize_findings(payload: Dict[str, Any], source: str) -> List[Dict[str, Any]]:
    findings: List[Dict[str, Any]] = []
    occupied: List[tuple[int, int]] = []
    for item in payload.get("findings", []):
        if not isinstance(item, dict):
            continue
        text = str(item.get("text", ""))
        if not text:
            continue
        start = item.get("startOffset")
        end = item.get("endOffset")
        if not isinstance(start, int) or not isinstance(end, int) or start < 0 or end <= start or end > len(source):
            start = source.find(text)
            end = start + len(text) if start >= 0 else -1
        if start < 0 or end <= start or source[start:end] != text:
            continue
        if any(start < used_end and end > used_start for used_start, used_end in occupied):
            continue
        issue_type = str(item.get("type", "grammar"))
        if issue_type not in {"grammar", "register", "punctuation", "wordUsage"}:
            issue_type = "grammar"
        replacement = str(item.get("replacement", ""))
        suggestions = item.get("suggestions", [])
        if not isinstance(suggestions, list):
            suggestions = []
        findings.append({
            "text": text,
            "type": issue_type,
            "replacement": replacement,
            "suggestions": [str(value) for value in suggestions[:5]],
            "reason": str(item.get("reason", "Gemini ตรวจพบประเด็นด้านภาษาเชิงวิชาการ")),
            "startOffset": start,
            "endOffset": end,
        })
        occupied.append((start, end))
    return findings


def review_academic_text(text: str, writing_style: str) -> Optional[Dict[str, Any]]:
    """Return normalized Gemini findings, or None when the optional service is unavailable."""
    if not is_enabled(writing_style):
        return {"enabled": False, "used": False, "model": None, "findings": []}

    try:
        from google import genai
        from google.genai import types

        model = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
        client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])
        prompt = f"""ตรวจโครงสร้างประโยคและไวยากรณ์ภาษาไทยเชิงลึกสำหรับระดับภาษา: {writing_style}

ข้อความต้นฉบับ:
{text}

ตอบเป็น JSON เท่านั้นตาม schema:
{{"findings":[{{"type":"grammar|register|punctuation|wordUsage","text":"ข้อความช่วงที่ผิด","replacement":"คำ/ประโยคที่แนะนำ","suggestions":["ตัวเลือก"],"reason":"เหตุผลภาษาไทย","startOffset":0,"endOffset":1}}]}}

กติกา: ตรวจเฉพาะข้อผิดพลาดที่มีหลักฐานจากข้อความ ห้ามแก้คำถูกต้องเพียงเพราะเป็นภาษาพูด และห้ามใส่ Markdown fence
"""
        max_attempts = 3
        for attempt in range(max_attempts):
            try:
                response = client.models.generate_content(
                    model=model,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        temperature=0.1,
                        automatic_function_calling=types.AutomaticFunctionCallingConfig(disable=True),
                    ),
                )
                payload = _extract_json(response.text or "{}")
                return {"enabled": True, "used": True, "model": model, "findings": _normalize_findings(payload, text)}
            except Exception as exc:
                message = str(exc)
                transient = any(marker in message for marker in ("429", "500", "502", "503", "504", "UNAVAILABLE", "ResourceExhausted"))
                if not transient or attempt == max_attempts - 1:
                    logger.warning("Gemini grammar review unavailable: %s", type(exc).__name__)
                    break
                delay = 0.5 * (2 ** attempt)
                logger.info("Gemini transient error; retrying attempt %s/%s", attempt + 2, max_attempts)
                time.sleep(delay)
        return {"enabled": True, "used": False, "model": model, "findings": [], "error": "บริการตรวจเชิงลึกไม่พร้อมใช้งาน"}
    except Exception as exc:
        logger.warning("Gemini grammar review unavailable: %s", type(exc).__name__)
        return {"enabled": True, "used": False, "model": os.getenv("GEMINI_MODEL", "gemini-2.5-flash"), "findings": [], "error": "บริการตรวจเชิงลึกไม่พร้อมใช้งาน"}
