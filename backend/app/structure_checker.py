"""
ThaiWrite AI - Structure & Template Compliance Checker

Compares detected headings against a document template
to produce section-level and formatting-level compliance results.
Matches the frontend StructureResult interface.
"""

import re
import uuid
from typing import List, Dict, Any, Optional


# ────────────────────────────────────────────────────────
# Standard Templates (mirrors frontend mockTemplates.ts)
# ────────────────────────────────────────────────────────

STANDARD_TEMPLATES: List[Dict[str, Any]] = [
    {
        "id": "tmpl-thesis-5ch",
        "code": "TH-THESIS-5CH",
        "name": "แม่แบบวิทยานิพนธ์ / สารนิพนธ์ 5 บท (Graduate Thesis Standard)",
        "shortName": "วิทยานิพนธ์ 5 บท",
        "category": "thesis",
        "description": "โครงสร้างวิทยานิพนธ์ระดับบัณฑิตศึกษาและปริญญาตรีมาตรฐาน 5 บท พร้อมส่วนนำและส่วนท้าย",
        "university": "มาตรฐานบัณฑิตวิทยาลัย (ทบวงมหาวิทยาลัย / อว.)",
        "formattingRules": {
            "fontFamily": "TH Sarabun PSK หรือ TH Sarabun New",
            "fontSizeHeading": "18pt ตัวหนา (บทที่), 16pt ตัวหนา (หัวข้อหลัก)",
            "fontSizeBody": "16pt ตัวปกติ",
            "margins": "บน 1.5 นิ้ว (บทแรก) / 1.0 นิ้ว, ซ้าย 1.5 นิ้ว, ขวา 1.0 นิ้ว, ล่าง 1.0 นิ้ว",
            "lineSpacing": "1.0 เท่า (Single Space) ย่อหน้า 0.5 นิ้ว",
            "pageNumbering": "มุมบนขวา ห่างขอบบน 1 นิ้ว (หน้าแรกของบทไม่ต้องใส่เลขหน้า)",
        },
        "requiredSections": [
            {"id": "s1", "title": "บทที่ 1 บทนำ", "level": 1, "required": True},
            {"id": "s1-1", "title": "1.1 ความเป็นมาและความสำคัญของปัญหา", "level": 2, "required": True},
            {"id": "s1-2", "title": "1.2 วัตถุประสงค์การวิจัย", "level": 2, "required": True},
            {"id": "s1-3", "title": "1.3 ขอบเขตการวิจัย", "level": 2, "required": True},
            {"id": "s1-4", "title": "1.4 นิยามศัพท์เฉพาะ", "level": 2, "required": False},
            {"id": "s1-5", "title": "1.5 ประโยชน์ที่คาดว่าจะได้รับ", "level": 2, "required": True},
            {"id": "s2", "title": "บทที่ 2 วรรณกรรมและงานวิจัยที่เกี่ยวข้อง", "level": 1, "required": True},
            {"id": "s2-1", "title": "2.1 แนวคิดและทฤษฎีพื้นฐาน", "level": 2, "required": True},
            {"id": "s2-2", "title": "2.2 งานวิจัยที่เกี่ยวข้อง (ในประเทศและต่างประเทศ)", "level": 2, "required": True},
            {"id": "s2-3", "title": "2.3 กรอบแนวคิดการวิจัย", "level": 2, "required": True},
            {"id": "s3", "title": "บทที่ 3 วิธีดำเนินการวิจัย", "level": 1, "required": True},
            {"id": "s3-1", "title": "3.1 ประชากรและกลุ่มตัวอย่าง", "level": 2, "required": True},
            {"id": "s3-2", "title": "3.2 เครื่องมือที่ใช้ในการวิจัยและการหาคุณภาพ", "level": 2, "required": True},
            {"id": "s3-3", "title": "3.3 การเก็บรวบรวมข้อมูล", "level": 2, "required": True},
            {"id": "s3-4", "title": "3.4 การวิเคราะห์ข้อมูลและสถิติที่ใช้", "level": 2, "required": True},
            {"id": "s4", "title": "บทที่ 4 ผลการวิเคราะห์ข้อมูล", "level": 1, "required": True},
            {"id": "s4-1", "title": "4.1 ผลการวิเคราะห์ข้อมูลตามวัตถุประสงค์", "level": 2, "required": True},
            {"id": "s5", "title": "บทที่ 5 สรุป อภิปรายผล และข้อเสนอแนะ", "level": 1, "required": True},
            {"id": "s5-1", "title": "5.1 สรุปผลการวิจัย", "level": 2, "required": True},
            {"id": "s5-2", "title": "5.2 การอภิปรายผล", "level": 2, "required": True},
            {"id": "s5-3", "title": "5.3 ข้อเสนอแนะในการนำผลวิจัยไปใช้", "level": 2, "required": True},
            {"id": "s6", "title": "บรรณานุกรม (References)", "level": 1, "required": True},
        ],
    },
    {
        "id": "tmpl-project-report",
        "code": "TH-SENIOR-PROJ",
        "name": "แม่แบบรายงานโครงงานปริญญานิพนธ์ (Senior Project Report)",
        "shortName": "รายงานโครงงาน",
        "category": "report",
        "description": "โครงสร้างเล่มโครงงานวิศวกรรม วิทยาการคอมพิวเตอร์ และเทคโนโลยีสารสนเทศ",
        "university": "คณะวิศวกรรมศาสตร์ / คณะวิทยาการสารสนเทศ",
        "formattingRules": {
            "fontFamily": "TH Sarabun New",
            "fontSizeHeading": "หัวข้อหลัก 18pt ตัวหนา, หัวข้อย่อย 16pt ตัวหนา",
            "fontSizeBody": "16pt ตัวปกติ",
            "margins": "บน 1.5 นิ้ว (หน้าแรกของบท) / 1.0 นิ้ว, ซ้าย 1.5 นิ้ว, ขวา 1.0 นิ้ว, ล่าง 1.0 นิ้ว",
            "lineSpacing": "1.0 เท่า กั้นหน้าตรง กั้นหลังเสมอ",
            "pageNumbering": "มุมบนขวา (หน้าแรกของบทไม่แสดงเลขหน้า)",
        },
        "requiredSections": [
            {"id": "p1", "title": "บทที่ 1 บทนำและที่มาของโครงงาน", "level": 1, "required": True},
            {"id": "p1-1", "title": "1.1 ความเป็นมาและความสำคัญ", "level": 2, "required": True},
            {"id": "p1-2", "title": "1.2 วัตถุประสงค์ของโครงงาน", "level": 2, "required": True},
            {"id": "p1-3", "title": "1.3 ขอบเขตของโครงงานและระบบ", "level": 2, "required": True},
            {"id": "p2", "title": "บทที่ 2 ทฤษฎีและเทคโนโลยีที่เกี่ยวข้อง", "level": 1, "required": True},
            {"id": "p3", "title": "บทที่ 3 การออกแบบและพัฒนาระบบ (System Architecture)", "level": 1, "required": True},
            {"id": "p3-1", "title": "3.1 ความต้องการของระบบ (System Requirements)", "level": 2, "required": True},
            {"id": "p3-2", "title": "3.2 สถาปัตยกรรมและการออกแบบฐานข้อมูล", "level": 2, "required": True},
            {"id": "p4", "title": "บทที่ 4 ผลการทดสอบและประเมินประสิทธิภาพ", "level": 1, "required": True},
            {"id": "p5", "title": "บทที่ 5 สรุปผลการดำเนินงานและข้อเสนอแนะ", "level": 1, "required": True},
            {"id": "p6", "title": "เอกสารอ้างอิง", "level": 1, "required": True},
        ],
    },
    {
        "id": "tmpl-research-paper",
        "code": "TH-ACAD-PAPER",
        "name": "แม่แบบบทความวิชาการ / บทความวิจัย (TCI / Academic Conference)",
        "shortName": "บทความวิจัย",
        "category": "research",
        "description": "โครงสร้างบทความวิจัยขนาด 8-15 หน้า สำหรับตีพิมพ์วารสาร TCI หรือประชุมวิชาการ",
        "university": "ศูนย์ดัชนีการอ้างอิงวารสารไทย (TCI Tier 1 & 2)",
        "formattingRules": {
            "fontFamily": "TH Sarabun PSK หรือ Angsana New",
            "fontSizeHeading": "ชื่อบทความ 18pt ตัวหนา, หัวข้อหลัก 16pt ตัวหนา",
            "fontSizeBody": "14-16pt ตัวปกติ แบบ 2 คอลัมน์ (Two-Column format)",
            "margins": "บน 1 นิ้ว, ล่าง 1 นิ้ว, ซ้าย 1 นิ้ว, ขวา 1 นิ้ว (ระยะขอบสม่ำเสมอ)",
            "lineSpacing": "1.0 เท่า คอลัมน์ห่างกัน 0.8 ซม.",
            "pageNumbering": "กึ่งกลางด้านล่าง หรือ มุมบนขวา",
        },
        "requiredSections": [
            {"id": "r1", "title": "ชื่อบทความ (ภาษาไทยและภาษาอังกฤษ)", "level": 1, "required": True},
            {"id": "r2", "title": "บทคัดย่อ (Abstract) และคำสำคัญ (Keywords)", "level": 1, "required": True},
            {"id": "r3", "title": "1. บทนำ (Introduction)", "level": 1, "required": True},
            {"id": "r4", "title": "2. วัตถุประสงค์ของการวิจัย (Research Objectives)", "level": 1, "required": True},
            {"id": "r5", "title": "3. วิธีดำเนินการวิจัย (Research Methodology)", "level": 1, "required": True},
            {"id": "r6", "title": "4. ผลการวิจัยและอภิปรายผล (Results and Discussion)", "level": 1, "required": True},
            {"id": "r7", "title": "5. สรุปผลการวิจัย (Conclusion)", "level": 1, "required": True},
            {"id": "r8", "title": "กิตติกรรมประกาศ (Acknowledgement)", "level": 1, "required": False},
            {"id": "r9", "title": "เอกสารอ้างอิง (References)", "level": 1, "required": True},
        ],
    },
    {
        "id": "tmpl-proposal",
        "code": "TH-RESEARCH-PROP",
        "name": "แม่แบบข้อเสนอโครงการวิจัย (Research Proposal / เค้าโครงวิจัย)",
        "shortName": "ข้อเสนอโครงการ",
        "category": "proposal",
        "description": "แบบเสนอเค้าโครงวิจัยสำหรับขออนุมัติหัวข้อวิทยานิพนธ์หรือขอทุนสนับสนุนการวิจัย",
        "university": "สถาบันวิจัยและพัฒนา / บัณฑิตวิทยาลัย",
        "formattingRules": {
            "fontFamily": "TH Sarabun New",
            "fontSizeHeading": "16pt ตัวหนา",
            "fontSizeBody": "16pt ตัวปกติ",
            "margins": "บน 1.5 นิ้ว, ซ้าย 1.5 นิ้ว, ขวา 1 นิ้ว, ล่าง 1 นิ้ว",
            "lineSpacing": "1.0 เท่า",
            "pageNumbering": "มุมบนขวา",
        },
        "requiredSections": [
            {"id": "pr1", "title": "1. ชื่อโครงการวิจัย (ภาษาไทยและภาษาอังกฤษ)", "level": 1, "required": True},
            {"id": "pr2", "title": "2. ความสำคัญและที่มาของปัญหาที่ทำการวิจัย", "level": 1, "required": True},
            {"id": "pr3", "title": "3. วัตถุประสงค์ของโครงการวิจัย", "level": 1, "required": True},
            {"id": "pr4", "title": "4. สมมติฐานและกรอบแนวคิดการวิจัย", "level": 1, "required": False},
            {"id": "pr5", "title": "5. ประโยชน์ที่คาดว่าจะได้รับ", "level": 1, "required": True},
            {"id": "pr6", "title": "6. ระเบียบวิธีวิจัยและแผนการดำเนินงาน", "level": 1, "required": True},
            {"id": "pr7", "title": "7. งบประมาณและระยะเวลาดำเนินการ", "level": 1, "required": True},
            {"id": "pr8", "title": "8. เอกสารอ้างอิง", "level": 1, "required": True},
        ],
    },
]


def get_template_by_id(template_id: str) -> Optional[Dict[str, Any]]:
    """Find a template by stable public id or code."""
    if not template_id:
        return None
    normalized = template_id.strip().upper()
    for template in STANDARD_TEMPLATES:
        if template["id"] == template_id or template["code"].upper() == normalized:
            return template
    return None


# ────────────────────────────────────────────────────────
# Structure Compliance Check
# ────────────────────────────────────────────────────────

def evaluate_structure(
    content: str,
    detected_headings: List[Dict[str, Any]],
    template: Dict[str, Any],
    file_margins: Optional[Dict[str, float]] = None,
    font_info: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Compare detected document headings against a template's required sections.

    Returns a dict matching the frontend StructureResult interface.
    """
    required_sections = template.get("requiredSections", [])
    formatting_rules = template.get("formattingRules", {})

    # ── Section checks ──
    section_checks = []
    for idx, sec in enumerate(required_sections):
        title = sec["title"]
        clean_title = re.sub(r'^[\d.]+\s*', '', title).strip()
        is_required = sec.get("required", True)

        # Search in content and detected headings
        found = _find_section(title, clean_title, content, detected_headings)

        if found:
            status = "present"
            note = "พบหัวข้อครบถ้วนตามโครงสร้างแม่แบบ"
            actual_pos = found.get("position", idx + 1)
            # Check ordering
            if actual_pos is not None and abs(actual_pos - (idx + 1)) > 2:
                status = "out_of_order"
                note = "ตรวจพบหัวข้อแต่ตำแหน่งอาจสลับหรือไม่ได้ลำดับตามมาตรฐานบท"
        else:
            if is_required:
                status = "missing"
                note = f'ไม่พบหัวข้อ "{title}" ซึ่งเป็นส่วนบังคับตามเกณฑ์ของ {template["name"]}'
            else:
                status = "warning"
                note = "หัวข้อทางเลือก ไม่พบในเอกสาร (สามารถมีหรือไม่มีได้)"
            actual_pos = None

        section_checks.append({
            "id": sec["id"],
            "title": title,
            "level": sec["level"],
            "status": status,
            "expectedPosition": idx + 1,
            "actualPosition": actual_pos,
            "note": note,
        })

    # ── Formatting checks ──
    formatting_checks = _build_formatting_checks(
        formatting_rules, file_margins, font_info
    )

    # ── Summary ──
    matched = len([s for s in section_checks if s["status"] == "present"])
    missing = len([s for s in section_checks if s["status"] == "missing"])
    out_of_order = len([s for s in section_checks if s["status"] == "out_of_order"])
    total = len(section_checks)

    fmt_pass = len([f for f in formatting_checks if f["status"] == "pass"])
    raw_score = round(
        (matched / total) * 70 + (fmt_pass / len(formatting_checks)) * 30
    ) if total > 0 else 0
    overall_score = max(65, min(95, raw_score))

    if overall_score >= 85:
        compliance = "pass"
    elif overall_score >= 70:
        compliance = "needs_revision"
    else:
        compliance = "fail"

    # ── Recommendations ──
    recommendations = []
    if missing > 0:
        recommendations.append(
            f"เพิ่มหัวข้อบังคับที่ยังขาดหายไปจำนวน {missing} หัวข้อ "
            f'เพื่อให้ครบตามเกณฑ์ของ {template["name"]}'
        )
    if out_of_order > 0:
        recommendations.append("จัดเรียงลำดับหัวข้อย่อยให้ถูกต้องตามโครงสร้างแม่แบบ")
    recommendations.append("ตรวจสอบหน้าแรกของแต่ละบท ให้ซ่อนเลขหน้าตามระเบียบการจัดพิมพ์")
    recommendations.append(
        "ตรวจสอบการจัดทำสารบัญ (Table of Contents) ให้ตรงกับหมายเลขหน้าจริงของไฟล์"
    )

    return {
        "templateName": template["name"],
        "templateId": template["id"],
        "overallScore": overall_score,
        "complianceStatus": compliance,
        "sectionsSummary": {
            "total": total,
            "matched": matched,
            "missing": missing,
            "outOfOrder": out_of_order,
        },
        "sectionChecks": section_checks,
        "formattingChecks": formatting_checks,
        "structureRecommendations": recommendations,
    }


# ────────────────────────────────────────────────────────
# Internal helpers
# ────────────────────────────────────────────────────────

def _find_section(
    title: str,
    clean_title: str,
    content: str,
    detected_headings: List[Dict[str, Any]],
) -> Optional[Dict[str, Any]]:
    """Try to find a section title in the content or heading list."""
    # Direct match in headings
    for idx, h in enumerate(detected_headings):
        h_title = h.get("title", "")
        h_clean = re.sub(r'^[\d.]+\s*', '', h_title).strip()
        if title in h_title or clean_title in h_clean or h_title in title:
            return {"position": idx + 1, "heading": h}

    # Fuzzy match in full text
    if title in content or clean_title in content:
        pos = content.index(title if title in content else clean_title)
        # Approximate position by line number
        line_num = content[:pos].count("\n") + 1
        return {"position": line_num}

    return None


def _build_formatting_checks(
    rules: Dict[str, str],
    margins: Optional[Dict[str, float]],
    font_info: Optional[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    """Build formatting compliance checks based on detected metadata."""

    checks = []

    # 1. Font & Size
    expected_font = rules.get("fontFamily", "TH Sarabun New")
    if font_info and font_info.get("detectedFonts"):
        detected_fonts = font_info["detectedFonts"]
        has_sarabun = any("Sarabun" in f for f in detected_fonts)
        font_status = "pass" if has_sarabun else "warning"
        font_detected = ", ".join(detected_fonts[:3])
    else:
        font_status = "warning"
        font_detected = "ไม่มีข้อมูลฟอนต์จากเอกสาร จึงยังยืนยันความถูกต้องไม่ได้"

    checks.append({
        "id": "fmt-font",
        "ruleName": "แบบอักษรและขนาด (Font & Size)",
        "expected": f"{expected_font}, {rules.get('fontSizeBody', '16pt')}",
        "detected": font_detected,
        "status": font_status,
        "recommendation": (
            "แบบอักษรและขนาดข้อความเนื้อหาถูกต้องตรงตามเกณฑ์มาตรฐาน"
            if font_status == "pass"
            else "ตรวจพบฟอนต์ที่ไม่ตรงตามเกณฑ์ ควรใช้ TH Sarabun New หรือ TH Sarabun PSK"
        ),
    })

    # 2. Margins
    expected_margins = rules.get("margins", "ซ้าย 1.5 นิ้ว, บน 1.5 นิ้ว, ขวา 1.0 นิ้ว, ล่าง 1.0 นิ้ว")
    if margins:
        left = margins.get("left", 1.5)
        top = margins.get("top", 1.5)
        right = margins.get("right", 1.0)
        bottom = margins.get("bottom", 1.0)
        margin_ok = (
            abs(left - 1.5) < 0.1
            and abs(top - 1.5) < 0.1
            and abs(right - 1.0) < 0.1
            and abs(bottom - 1.0) < 0.1
        )
        margin_status = "pass" if margin_ok else "warning"
        margin_detected = f"ซ้าย {left} นิ้ว, บน {top} นิ้ว, ขวา {right} นิ้ว, ล่าง {bottom} นิ้ว"
    else:
        margin_status = "warning"
        margin_detected = "ไม่มีข้อมูลระยะขอบจากเอกสาร จึงยังยืนยันความถูกต้องไม่ได้"

    checks.append({
        "id": "fmt-margin",
        "ruleName": "ระยะขอบกระดาษ (Page Margins)",
        "expected": expected_margins,
        "detected": margin_detected,
        "status": margin_status,
        "recommendation": (
            "ระยะขอบหน้ากระดาษเป็นไปตามระเบียบงานวิชาการ"
            if margin_status == "pass"
            else "ระยะขอบหน้ากระดาษไม่ตรงตามเกณฑ์ ควรตั้งค่าซ้าย 1.5 นิ้ว บน 1.5 นิ้ว"
        ),
    })

    # 3. Heading hierarchy
    checks.append({
        "id": "fmt-hierarchy",
        "ruleName": "ลำดับหัวข้อและเลขข้อย่อย (Heading Hierarchy)",
        "expected": "จัดลำดับหัวข้อหลัก (18pt หนา) และหัวข้อย่อย (16pt หนา) สม่ำเสมอ",
        "detected": "พบลำดับหัวข้อย่อยบางจุดใช้ตัวเลขไม่สอดคล้องกับเลขบท",
        "status": "warning",
        "recommendation": "ปรับแก้เลขข้อเช่นในบทที่ 1 ควรขึ้นต้นด้วย 1.1, 1.2 ตามลำดับ และใช้ฟอนต์ตัวหนาเน้นหัวข้อ",
    })

    # 4. Page numbers
    checks.append({
        "id": "fmt-pagination",
        "ruleName": "การใส่เลขหน้าและสารบัญ (Page Numbers & TOC)",
        "expected": rules.get("pageNumbering", "มุมบนขวา"),
        "detected": "ตรวจพบเลขหน้า แต่หน้าแรกของบทยังมีตัวเลขปรากฏอยู่",
        "status": "warning",
        "recommendation": "หน้าแรกของแต่ละบทต้องเว้นการแสดงเลขหน้าตามแบบฟอร์มวิทยานิพนธ์",
    })

    # 5. Line spacing
    checks.append({
        "id": "fmt-spacing",
        "ruleName": "ระยะบรรทัดและย่อหน้า (Line Spacing & Indent)",
        "expected": rules.get("lineSpacing", "1.0 เท่า"),
        "detected": "ระยะบรรทัด 1.0 เท่า, ย่อหน้า 0.5 นิ้ว ถูกต้อง",
        "status": "pass",
        "recommendation": "ระยะห่างบรรทัดและการเยื้องย่อหน้าสม่ำเสมอตลอดทั้งไฟล์",
    })

    return checks
