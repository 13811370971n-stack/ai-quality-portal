"""
Quality Case API endpoints - v2 with proper state transitions.
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
from app.models.evidence import CaseEvidence, CaseTimeline
from app.core.security import require_user
from app.core.quality_agent import build_messages
from app.core.ai_engine import chat_completion_stream
from app.core.state_machine import get_step_for_state

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
    field: str  # "problem_statement", "root_cause", "measures", "advance"
    value: str


# State transition map for confirm actions
CONFIRM_TRANSITIONS = {
    "problem_statement": {"next_step": "rca", "next_status": "rca"},
    "root_cause": {"next_step": "measures", "next_status": "measures"},
    "measures": {"next_step": "8d", "next_status": "closing"},
    "advance": None,  # manual advance
}


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
        title=req.title or f"新质量案例",
        status="intake",
        current_step="describe",
    )
    db.add(case)
    db.commit()
    db.refresh(case)

    # Timeline: created
    db.add(CaseTimeline(case_id=case.id, event_type="created", description="案例创建", actor="user"))

    # If user provided initial description, save as first message
    if req.description:
        msg = CaseMessage(case_id=case.id, role="user", content=req.description, step="describe")
        db.add(msg)
        # Auto-generate title from description
        case.title = req.description[:50] + ("..." if len(req.description) > 50 else "")
        db.add(CaseTimeline(case_id=case.id, event_type="message", description="用户描述问题", actor="user"))

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
            "problem_statement": c.problem_statement[:100] if c.problem_statement else None,
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
    """Get case detail with messages, evidences, timeline."""
    case = db.query(QualityCase).filter(
        QualityCase.id == case_id,
        QualityCase.user_id == user.id,
    ).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    messages = [
        {"id": m.id, "role": m.role, "content": m.content, "step": m.step,
         "created_at": m.created_at.isoformat() if m.created_at else None}
        for m in case.messages
    ]

    evidences = [
        {"id": e.id, "title": e.title, "evidence_type": e.evidence_type,
         "source": e.source, "confidence": e.confidence,
         "verification_status": e.verification_status,
         "created_at": e.created_at.isoformat() if e.created_at else None}
        for e in (case.evidences or [])
    ]

    timeline = [
        {"id": t.id, "event_type": t.event_type, "description": t.description,
         "actor": t.actor, "created_at": t.created_at.isoformat() if t.created_at else None}
        for t in (case.timeline_events or [])
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
        "evidences": evidences,
        "timeline": timeline,
    }


@router.put("/{case_id}")
async def update_case(
    case_id: int,
    req: UpdateCaseRequest,
    user: User = Depends(require_user),
    db: Session = Depends(get_db),
):
    """Update case fields."""
    case = db.query(QualityCase).filter(QualityCase.id == case_id, QualityCase.user_id == user.id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    if req.title is not None: case.title = req.title
    if req.status is not None: case.status = req.status
    if req.current_step is not None: case.current_step = req.current_step
    if req.problem_statement is not None: case.problem_statement = req.problem_statement
    if req.root_cause is not None: case.root_cause = req.root_cause
    if req.measures is not None: case.measures = req.measures

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
    """Confirm a checkpoint and advance to next stage."""
    case = db.query(QualityCase).filter(QualityCase.id == case_id, QualityCase.user_id == user.id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    transition = CONFIRM_TRANSITIONS.get(req.field)
    if not transition and req.field != "advance":
        raise HTTPException(status_code=400, detail="Invalid confirm field")

    # Save the confirmed value
    if req.field == "problem_statement":
        case.problem_statement = req.value
    elif req.field == "root_cause":
        case.root_cause = req.value
    elif req.field == "measures":
        case.measures = req.value

    # Advance state
    if transition:
        case.current_step = transition["next_step"]
        case.status = transition["next_status"]

    # Timeline event
    labels = {"problem_statement": "问题定义已确认", "root_cause": "根因已确认", "measures": "措施已确认"}
    db.add(CaseTimeline(
        case_id=case.id,
        event_type="confirmed",
        description=labels.get(req.field, f"{req.field} confirmed"),
        actor="user",
    ))

    # System message
    step_labels = {"problem_statement": "问题定义", "root_cause": "根因", "measures": "改善措施"}
    db.add(CaseMessage(
        case_id=case.id,
        role="system",
        content=f"✅ {step_labels.get(req.field, req.field)}已确认，进入下一阶段",
        step=case.current_step,
    ))

    case.updated_at = datetime.now(timezone.utc)
    db.commit()

    return {"status": "confirmed", "current_step": case.current_step, "case_status": case.status}


@router.post("/{case_id}/chat")
async def chat_with_ai(
    case_id: int,
    req: ChatRequest,
    user: User = Depends(require_user),
    db: Session = Depends(get_db),
):
    """Send a message and get AI response via SSE stream."""
    case = db.query(QualityCase).filter(QualityCase.id == case_id, QualityCase.user_id == user.id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    # Save user message
    user_msg = CaseMessage(case_id=case.id, role="user", content=req.message, step=case.current_step)
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

        # Save assistant message
        assistant_content = "".join(full_response)
        if assistant_content:
            assistant_msg = CaseMessage(
                case_id=case.id, role="assistant", content=assistant_content, step=case.current_step
            )
            db.add(assistant_msg)
            db.commit()

        yield "data: [DONE]\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive", "X-Accel-Buffering": "no"},
    )


@router.get("/{case_id}/messages")
async def get_messages(
    case_id: int,
    user: User = Depends(require_user),
    db: Session = Depends(get_db),
):
    """Get all messages for a case."""
    case = db.query(QualityCase).filter(QualityCase.id == case_id, QualityCase.user_id == user.id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return [
        {"id": m.id, "role": m.role, "content": m.content, "step": m.step,
         "created_at": m.created_at.isoformat() if m.created_at else None}
        for m in case.messages
    ]


@router.get("/{case_id}/timeline")
async def get_timeline(
    case_id: int,
    user: User = Depends(require_user),
    db: Session = Depends(get_db),
):
    """Get case timeline events."""
    case = db.query(QualityCase).filter(QualityCase.id == case_id, QualityCase.user_id == user.id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    events = db.query(CaseTimeline).filter(CaseTimeline.case_id == case_id).order_by(CaseTimeline.created_at).all()
    return [
        {"id": t.id, "event_type": t.event_type, "description": t.description,
         "actor": t.actor, "created_at": t.created_at.isoformat() if t.created_at else None}
        for t in events
    ]


@router.post("/{case_id}/generate-8d")
async def generate_8d(
    case_id: int,
    user: User = Depends(require_user),
    db: Session = Depends(get_db),
):
    """Generate 8D report content from case data."""
    case = db.query(QualityCase).filter(QualityCase.id == case_id, QualityCase.user_id == user.id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    # Build 8D from confirmed data
    report = {
        "D0_ERA": "参见临时遏制措施",
        "D1_Team": user.nickname or user.email or "质量工程师",
        "D2_Problem": case.problem_statement or "待定义",
        "D3_Containment": "",
        "D4_RootCause": case.root_cause or "待确认",
        "D5_Corrective": "",
        "D6_Verification": "待验证",
        "D7_Prevention": "",
        "D8_Closure": "待关闭",
    }

    # Extract measures if available
    if case.measures:
        try:
            measures_data = json.loads(case.measures)
            report["D3_Containment"] = measures_data.get("containment", "")
            report["D5_Corrective"] = measures_data.get("corrective", "")
            report["D7_Prevention"] = measures_data.get("preventive", "")
        except json.JSONDecodeError:
            report["D5_Corrective"] = case.measures

    # Timeline
    db.add(CaseTimeline(case_id=case.id, event_type="8d_generated", description="8D报告生成", actor="system"))
    db.commit()

    return {"report": report, "case_title": case.title, "case_type": case.case_type}
