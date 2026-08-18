"""
Quality Case API endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone
import json

from app.database.session import get_db
from app.models.user import User
from app.models.quality_case import QualityCase, CaseMessage
from app.core.security import require_user
from app.core.quality_agent import build_messages
from app.core.ai_engine import chat_completion_stream

router = APIRouter()


# === Schemas ===

class CreateCaseRequest(BaseModel):
    case_type: str
    title: Optional[str] = None
    description: Optional[str] = None

class UpdateCaseRequest(BaseModel):
    title: Optional[str] = None
    status: Optional[str] = None
    current_step: Optional[str] = None
    problem_statement: Optional[str] = None
    root_cause: Optional[str] = None
    measures: Optional[str] = None

class ChatRequest(BaseModel):
    message: str

class ConfirmRequest(BaseModel):
    field: str  # "problem_statement" or "root_cause"
    value: str


# === Endpoints ===

@router.post("/")
async def create_case(
    req: CreateCaseRequest,
    user: User = Depends(require_user),
    db: Session = Depends(get_db),
):
    """Create a new quality case."""
    case = QualityCase(
        user_id=user.id,
        case_type=req.case_type,
        title=req.title or f"新质量案例 - {req.case_type}",
        status="analyzing",
        current_step="describe",
    )
    db.add(case)
    db.commit()
    db.refresh(case)

    # If user provided initial description, save as first message
    if req.description:
        msg = CaseMessage(
            case_id=case.id,
            role="user",
            content=req.description,
            step="describe",
        )
        db.add(msg)
        db.commit()

    return {
        "id": case.id,
        "case_type": case.case_type,
        "title": case.title,
        "status": case.status,
        "current_step": case.current_step,
        "created_at": case.created_at.isoformat() if case.created_at else None,
    }


@router.get("/")
async def list_cases(
    user: User = Depends(require_user),
    db: Session = Depends(get_db),
):
    """List user's quality cases."""
    cases = db.query(QualityCase).filter(
        QualityCase.user_id == user.id
    ).order_by(QualityCase.updated_at.desc()).all()

    return [
        {
            "id": c.id,
            "title": c.title,
            "case_type": c.case_type,
            "status": c.status,
            "current_step": c.current_step,
            "created_at": c.created_at.isoformat() if c.created_at else None,
            "updated_at": c.updated_at.isoformat() if c.updated_at else None,
        }
        for c in cases
    ]


@router.get("/{case_id}")
async def get_case(
    case_id: int,
    user: User = Depends(require_user),
    db: Session = Depends(get_db),
):
    """Get case detail with messages."""
    case = db.query(QualityCase).filter(
        QualityCase.id == case_id,
        QualityCase.user_id == user.id,
    ).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    messages = [
        {
            "id": m.id,
            "role": m.role,
            "content": m.content,
            "step": m.step,
            "created_at": m.created_at.isoformat() if m.created_at else None,
        }
        for m in case.messages
    ]

    return {
        "id": case.id,
        "title": case.title,
        "case_type": case.case_type,
        "status": case.status,
        "current_step": case.current_step,
        "problem_statement": case.problem_statement,
        "root_cause": case.root_cause,
        "measures": case.measures,
        "created_at": case.created_at.isoformat() if case.created_at else None,
        "updated_at": case.updated_at.isoformat() if case.updated_at else None,
        "messages": messages,
    }


@router.put("/{case_id}")
async def update_case(
    case_id: int,
    req: UpdateCaseRequest,
    user: User = Depends(require_user),
    db: Session = Depends(get_db),
):
    """Update case fields."""
    case = db.query(QualityCase).filter(
        QualityCase.id == case_id,
        QualityCase.user_id == user.id,
    ).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    if req.title is not None:
        case.title = req.title
    if req.status is not None:
        case.status = req.status
    if req.current_step is not None:
        case.current_step = req.current_step
    if req.problem_statement is not None:
        case.problem_statement = req.problem_statement
    if req.root_cause is not None:
        case.root_cause = req.root_cause
    if req.measures is not None:
        case.measures = req.measures

    case.updated_at = datetime.now(timezone.utc)
    db.commit()
    return {"status": "updated"}


@router.post("/{case_id}/confirm")
async def confirm_node(
    case_id: int,
    req: ConfirmRequest,
    user: User = Depends(require_user),
    db: Session = Depends(get_db),
):
    """Confirm a checkpoint (problem_statement or root_cause)."""
    case = db.query(QualityCase).filter(
        QualityCase.id == case_id,
        QualityCase.user_id == user.id,
    ).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    if req.field == "problem_statement":
        case.problem_statement = req.value
        case.current_step = "rca"
        case.status = "rca"
    elif req.field == "root_cause":
        case.root_cause = req.value
        case.current_step = "measures"
        case.status = "measures"
    else:
        raise HTTPException(status_code=400, detail="Invalid field")

    # Save system message
    msg = CaseMessage(
        case_id=case.id,
        role="system",
        content=f"[已确认] {req.field}: {req.value[:200]}",
        step=case.current_step,
    )
    db.add(msg)
    case.updated_at = datetime.now(timezone.utc)
    db.commit()

    return {"status": "confirmed", "current_step": case.current_step}


@router.post("/{case_id}/chat")
async def chat_with_ai(
    case_id: int,
    req: ChatRequest,
    user: User = Depends(require_user),
    db: Session = Depends(get_db),
):
    """Send a message and get AI response via SSE stream."""
    case = db.query(QualityCase).filter(
        QualityCase.id == case_id,
        QualityCase.user_id == user.id,
    ).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    # Save user message
    user_msg = CaseMessage(
        case_id=case.id,
        role="user",
        content=req.message,
        step=case.current_step,
    )
    db.add(user_msg)
    db.commit()

    # Build context
    history = [
        {"role": m.role, "content": m.content}
        for m in case.messages
        if m.role in ("user", "assistant")
    ]

    messages = build_messages(
        case_type=case.case_type,
        current_step=case.current_step,
        history=history,
        problem_statement=case.problem_statement,
        root_cause=case.root_cause,
    )

    async def generate():
        full_response = []
        try:
            async for chunk in chat_completion_stream(messages):
                full_response.append(chunk)
                yield f"data: {json.dumps({'content': chunk})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

        # Save assistant message after stream completes
        assistant_content = "".join(full_response)
        if assistant_content:
            assistant_msg = CaseMessage(
                case_id=case.id,
                role="assistant",
                content=assistant_content,
                step=case.current_step,
            )
            db.add(assistant_msg)
            db.commit()

        yield "data: [DONE]\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.get("/{case_id}/messages")
async def get_messages(
    case_id: int,
    user: User = Depends(require_user),
    db: Session = Depends(get_db),
):
    """Get all messages for a case."""
    case = db.query(QualityCase).filter(
        QualityCase.id == case_id,
        QualityCase.user_id == user.id,
    ).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    return [
        {
            "id": m.id,
            "role": m.role,
            "content": m.content,
            "step": m.step,
            "created_at": m.created_at.isoformat() if m.created_at else None,
        }
        for m in case.messages
    ]
