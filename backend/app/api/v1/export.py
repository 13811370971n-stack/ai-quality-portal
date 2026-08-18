"""
8D Report Word/PDF export endpoint.
"""
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from datetime import datetime
import tempfile
import json
import os

from app.database.session import get_db
from app.models.user import User
from app.models.quality_case import QualityCase
from app.core.security import require_user

router = APIRouter()

try:
    from docx import Document
    from docx.shared import Inches, Pt, Cm
    from docx.enum.text import WD_PARAGRAPH_ALIGNMENT
    HAS_DOCX = True
except ImportError:
    HAS_DOCX = False


@router.get("/cases/{case_id}/export-8d")
async def export_8d_word(
    case_id: int,
    user: User = Depends(require_user),
    db: Session = Depends(get_db),
):
    """Export 8D report as Word document."""
    if not HAS_DOCX:
        raise HTTPException(status_code=500, detail="python-docx not installed")

    case = db.query(QualityCase).filter(QualityCase.id == case_id, QualityCase.user_id == user.id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    doc = Document()

    # Title
    title = doc.add_heading("8D Report", level=0)
    title.alignment = WD_PARAGRAPH_ALIGNMENT.CENTER

    # Case info
    doc.add_paragraph(f"Case: {case.title or 'Untitled'}")
    doc.add_paragraph(f"Type: {case.case_type}")
    doc.add_paragraph(f"Date: {datetime.now().strftime('%Y-%m-%d')}")
    doc.add_paragraph(f"Owner: {user.nickname or user.email}")
    doc.add_paragraph("")

    # D sections
    sections = [
        ("D0 - Emergency Response Action", "Refer to containment measures below."),
        ("D1 - Team", user.nickname or user.email or "Quality Engineer"),
        ("D2 - Problem Description", case.problem_statement or "(Not yet defined)"),
        ("D3 - Interim Containment Action", ""),
        ("D4 - Root Cause Analysis", case.root_cause or "(Not yet confirmed)"),
        ("D5 - Permanent Corrective Action", ""),
        ("D6 - Verification of Effectiveness", "(Pending verification)"),
        ("D7 - Prevention of Recurrence", ""),
        ("D8 - Team Recognition & Closure", "(Pending closure)"),
    ]

    # Parse measures
    containment = ""
    corrective = ""
    preventive = ""
    if case.measures:
        try:
            m = json.loads(case.measures)
            containment = m.get("containment", "")
            corrective = m.get("corrective", "")
            preventive = m.get("preventive", "")
        except (json.JSONDecodeError, TypeError):
            corrective = case.measures

    sections[3] = ("D3 - Interim Containment Action", containment or "(None specified)")
    sections[5] = ("D5 - Permanent Corrective Action", corrective or "(None specified)")
    sections[7] = ("D7 - Prevention of Recurrence", preventive or "(None specified)")

    for heading, content in sections:
        doc.add_heading(heading, level=2)
        doc.add_paragraph(content or "(To be completed)")
        doc.add_paragraph("")

    # Save to temp file
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".docx")
    doc.save(tmp.name)
    tmp.close()

    filename = f"8D_Report_{case.id}_{datetime.now().strftime('%Y%m%d')}.docx"
    return FileResponse(
        tmp.name,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        filename=filename,
    )
