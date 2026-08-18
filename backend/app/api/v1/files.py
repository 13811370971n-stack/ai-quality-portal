"""
File upload endpoints for Quality Cases.
Stores files locally in /root/Projects/ai-quality-portal/backend/uploads/
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
import os
import uuid
from datetime import datetime, timezone

from app.database.session import get_db
from app.models.user import User
from app.models.quality_case import QualityCase
from app.models.evidence import CaseEvidence, CaseTimeline
from app.core.security import require_user

router = APIRouter()

UPLOAD_DIR = "/root/Projects/ai-quality-portal/backend/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_EXTENSIONS = {
    ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".csv", ".txt",
    ".png", ".jpg", ".jpeg", ".gif", ".bmp", ".webp",
    ".ppt", ".pptx",
}

def get_extension(filename: str) -> str:
    return os.path.splitext(filename)[1].lower()

def get_evidence_type(ext: str) -> str:
    if ext in {".png", ".jpg", ".jpeg", ".gif", ".bmp", ".webp"}:
        return "image"
    if ext in {".xls", ".xlsx", ".csv"}:
        return "excel"
    if ext in {".pdf", ".doc", ".docx", ".txt"}:
        return "document"
    if ext in {".ppt", ".pptx"}:
        return "presentation"
    return "document"


@router.post("/cases/{case_id}/upload")
async def upload_file(
    case_id: int,
    file: UploadFile = File(...),
    description: str = Form(default=""),
    user: User = Depends(require_user),
    db: Session = Depends(get_db),
):
    """Upload a file as evidence for a case."""
    # Verify case ownership
    case = db.query(QualityCase).filter(
        QualityCase.id == case_id,
        QualityCase.user_id == user.id,
    ).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    # Validate extension
    ext = get_extension(file.filename or "")
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"File type {ext} not supported")

    # Save file
    file_id = str(uuid.uuid4())[:8]
    safe_name = f"{case_id}_{file_id}{ext}"
    file_path = os.path.join(UPLOAD_DIR, safe_name)

    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)

    # Create evidence record
    evidence = CaseEvidence(
        case_id=case_id,
        evidence_type=get_evidence_type(ext),
        source="user_provided",
        title=file.filename or safe_name,
        content=description or f"Uploaded file: {file.filename}",
        file_path=file_path,
        verification_status="unverified",
        related_step=case.current_step,
        created_by="user",
    )
    db.add(evidence)

    # Timeline event
    event = CaseTimeline(
        case_id=case_id,
        event_type="evidence_added",
        description=f"Uploaded file: {file.filename}",
        actor="user",
    )
    db.add(event)
    db.commit()
    db.refresh(evidence)

    return {
        "id": evidence.id,
        "title": evidence.title,
        "evidence_type": evidence.evidence_type,
        "file_path": safe_name,
        "created_at": evidence.created_at.isoformat() if evidence.created_at else None,
    }


@router.get("/cases/{case_id}/evidences")
async def list_evidences(
    case_id: int,
    user: User = Depends(require_user),
    db: Session = Depends(get_db),
):
    """List all evidences for a case."""
    case = db.query(QualityCase).filter(
        QualityCase.id == case_id,
        QualityCase.user_id == user.id,
    ).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    evidences = db.query(CaseEvidence).filter(CaseEvidence.case_id == case_id).all()
    return [
        {
            "id": e.id,
            "evidence_type": e.evidence_type,
            "source": e.source,
            "title": e.title,
            "content": e.content,
            "confidence": e.confidence,
            "verification_status": e.verification_status,
            "created_at": e.created_at.isoformat() if e.created_at else None,
            "created_by": e.created_by,
        }
        for e in evidences
    ]
