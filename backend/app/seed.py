"""
ThaiWrite AI - Database Seed Script

Seeds standard document templates into PostgreSQL
so they're available from the first GET /api/v1/templates call.
"""

import uuid
from .database import SessionLocal
from . import models
from .structure_checker import STANDARD_TEMPLATES


def seed_standard_templates():
    """Insert standard templates if the table is empty."""
    db = SessionLocal()
    try:
        existing = db.query(models.DocumentTemplate).count()
        if existing > 0:
            return  # already seeded

        for tmpl in STANDARD_TEMPLATES:
            template = models.DocumentTemplate(
                id=uuid.uuid5(uuid.NAMESPACE_DNS, tmpl["id"]),
                code=tmpl["code"],
                name=tmpl["name"],
                category=tmpl["category"],
                description=tmpl.get("description", ""),
                university=tmpl.get("university"),
                is_custom=False,
                formatting_rules=tmpl["formattingRules"],
            )
            db.add(template)
            db.flush()

            # Seed required sections
            for idx, sec in enumerate(tmpl.get("requiredSections", [])):
                section = models.TemplateSection(
                    template_id=template.id,
                    title=sec["title"],
                    section_level=sec["level"],
                    expected_order=idx + 1,
                    is_required=sec.get("required", True),
                    description=sec.get("description"),
                )
                db.add(section)

        db.commit()
        print(f"[seed] Seeded {len(STANDARD_TEMPLATES)} standard templates.")
    except Exception as e:
        db.rollback()
        print(f"[seed] Error seeding templates: {e}")
    finally:
        db.close()
