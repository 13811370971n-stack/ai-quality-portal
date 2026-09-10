"""
Case Analysis API (P1):
- Multi root cause management
- Actions with root-cause linkage + coverage validation
- Effect verification (before/after statistical comparison + AI interpretation)
"""
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime, timezone
import json
import math

from app.database.session import get_db
from app.models.user import User
from app.models.quality_case import QualityCase, CaseMessage
from app.models.evidence import CaseRootCause, CaseAction, CaseTimeline, CaseEvidence
from app.core.security import require_user
from app.core.ai_engine import chat_completion_stream

router = APIRouter()

CATEGORY_LABELS = {
    "man": "\u4eba (Man)",
    "machine": "\u673a (Machine)",
    "material": "\u6599 (Material)",
    "method": "\u6cd5 (Method)",
    "measurement": "\u6d4b (Measurement)",
    "environment": "\u73af (Environment)",
    "design": "\u8bbe\u8ba1 (Design)",
    "system": "\u7cfb\u7edf (System)",
}

ACTION_TYPE_LABELS = {
    "containment": "\u4e34\u65f6\u904f\u5236",
    "corrective": "\u7ea0\u6b63\u63aa\u65bd",
    "preventive": "\u9884\u9632\u63aa\u65bd",
}


def _owned_case(case_id: int, user: User, db: Session) -> QualityCase:
    case = db.query(QualityCase).filter(
        QualityCase.id == case_id, QualityCase.user_id == user.id
    ).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return case


# ============================================================
# Root Causes (multi)
# ============================================================

class RootCauseIn(BaseModel):
    description: str
    category: Optional[str] = None
    cause_chain: Optional[List[str]] = None
    confidence: Optional[float] = None
    status: str = "hypothesis"  # hypothesis | high_probability | confirmed | rejected
    evidence_ids: Optional[List[int]] = None


class RootCauseUpdate(BaseModel):
    description: Optional[str] = None
    category: Optional[str] = None
    cause_chain: Optional[List[str]] = None
    confidence: Optional[float] = None
    status: Optional[str] = None
    evidence_ids: Optional[List[int]] = None


def _rc_dict(rc: CaseRootCause) -> dict:
    chain = None
    if rc.cause_chain:
        try:
            chain = json.loads(rc.cause_chain)
        except (json.JSONDecodeError, TypeError):
            chain = None
    ev = None
    if rc.evidence_ids:
        try:
            ev = json.loads(rc.evidence_ids)
        except (json.JSONDecodeError, TypeError):
            ev = None
    return {
        "id": rc.id,
        "description": rc.description,
        "category": rc.category,
        "category_label": CATEGORY_LABELS.get(rc.category or "", rc.category),
        "cause_chain": chain,
        "confidence": rc.confidence,
        "status": rc.status,
        "evidence_ids": ev,
        "verified_by": rc.verified_by,
        "verified_at": rc.verified_at.isoformat() if rc.verified_at else None,
        "created_at": rc.created_at.isoformat() if rc.created_at else None,
    }


@router.get("/{case_id}/root-causes")
async def list_root_causes(case_id: int, user: User = Depends(require_user), db: Session = Depends(get_db)):
    """List all root causes for a case."""
    _owned_case(case_id, user, db)
    rcs = db.query(CaseRootCause).filter(CaseRootCause.case_id == case_id).order_by(CaseRootCause.id).all()
    return [_rc_dict(rc) for rc in rcs]


@router.post("/{case_id}/root-causes")
async def add_root_cause(case_id: int, req: RootCauseIn,
                         user: User = Depends(require_user), db: Session = Depends(get_db)):
    """Add a candidate root cause."""
    case = _owned_case(case_id, user, db)
    rc = CaseRootCause(
        case_id=case_id,
        description=req.description,
        category=req.category,
        cause_chain=json.dumps(req.cause_chain, ensure_ascii=False) if req.cause_chain else None,
        confidence=req.confidence,
        status=req.status,
        evidence_ids=json.dumps(req.evidence_ids) if req.evidence_ids else None,
    )
    if req.status == "confirmed":
        rc.verified_by = user.nickname or user.email
        rc.verified_at = datetime.now(timezone.utc)
    db.add(rc)
    db.add(CaseTimeline(case_id=case_id, event_type="root_cause_added",
                        description="\u6dfb\u52a0\u5019\u9009\u6839\u56e0: " + req.description[:80], actor="user"))
    case.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(rc)
    return _rc_dict(rc)


@router.put("/{case_id}/root-causes/{rc_id}")
async def update_root_cause(case_id: int, rc_id: int, req: RootCauseUpdate,
                            user: User = Depends(require_user), db: Session = Depends(get_db)):
    """Update a root cause (including confirming it)."""
    case = _owned_case(case_id, user, db)
    rc = db.query(CaseRootCause).filter(CaseRootCause.id == rc_id, CaseRootCause.case_id == case_id).first()
    if not rc:
        raise HTTPException(status_code=404, detail="Root cause not found")

    if req.description is not None:
        rc.description = req.description
    if req.category is not None:
        rc.category = req.category
    if req.cause_chain is not None:
        rc.cause_chain = json.dumps(req.cause_chain, ensure_ascii=False)
    if req.confidence is not None:
        rc.confidence = req.confidence
    if req.evidence_ids is not None:
        rc.evidence_ids = json.dumps(req.evidence_ids)
    if req.status is not None:
        was = rc.status
        rc.status = req.status
        if req.status == "confirmed" and was != "confirmed":
            rc.verified_by = user.nickname or user.email
            rc.verified_at = datetime.now(timezone.utc)
            db.add(CaseTimeline(case_id=case_id, event_type="root_cause_confirmed",
                                description="\u6839\u56e0\u5df2\u786e\u8ba4: " + rc.description[:80], actor="user"))
            # Sync legacy single-field for 8D export compatibility
            confirmed = db.query(CaseRootCause).filter(
                CaseRootCause.case_id == case_id, CaseRootCause.status == "confirmed"
            ).all()
            parts = []
            for i, c in enumerate(confirmed + [rc], 1):
                if c.id == rc.id and c in confirmed:
                    continue
                label = CATEGORY_LABELS.get(c.category or "", c.category or "")
                parts.append(str(i) + ". [" + str(label) + "] " + c.description)
            case.root_cause = "\n".join(parts) if parts else rc.description

    case.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(rc)
    return _rc_dict(rc)


@router.delete("/{case_id}/root-causes/{rc_id}")
async def delete_root_cause(case_id: int, rc_id: int,
                            user: User = Depends(require_user), db: Session = Depends(get_db)):
    """Delete a root cause. Unlinks any actions pointing to it."""
    _owned_case(case_id, user, db)
    rc = db.query(CaseRootCause).filter(CaseRootCause.id == rc_id, CaseRootCause.case_id == case_id).first()
    if not rc:
        raise HTTPException(status_code=404, detail="Root cause not found")

    db.query(CaseAction).filter(
        CaseAction.case_id == case_id, CaseAction.related_root_cause_id == rc_id
    ).update({"related_root_cause_id": None})
    db.delete(rc)
    db.commit()
    return {"status": "deleted"}


# ============================================================
# Actions with root-cause linkage
# ============================================================

class ActionIn(BaseModel):
    action_type: str  # containment | corrective | preventive
    description: str
    related_root_cause_id: Optional[int] = None
    owner: Optional[str] = None
    due_date: Optional[str] = None
    status: str = "planned"


class ActionUpdate(BaseModel):
    action_type: Optional[str] = None
    description: Optional[str] = None
    related_root_cause_id: Optional[int] = None
    owner: Optional[str] = None
    due_date: Optional[str] = None
    status: Optional[str] = None


def _action_dict(a: CaseAction, rc_map: Dict[int, str] = None) -> dict:
    rc_map = rc_map or {}
    return {
        "id": a.id,
        "action_type": a.action_type,
        "action_type_label": ACTION_TYPE_LABELS.get(a.action_type, a.action_type),
        "description": a.description,
        "related_root_cause_id": a.related_root_cause_id,
        "related_root_cause": rc_map.get(a.related_root_cause_id) if a.related_root_cause_id else None,
        "owner": a.owner,
        "due_date": a.due_date.isoformat() if a.due_date else None,
        "status": a.status,
        "effectiveness_check": a.effectiveness_check,
        "created_at": a.created_at.isoformat() if a.created_at else None,
    }


@router.get("/{case_id}/actions")
async def list_actions(case_id: int, user: User = Depends(require_user), db: Session = Depends(get_db)):
    """List all actions grouped by type."""
    _owned_case(case_id, user, db)
    rcs = db.query(CaseRootCause).filter(CaseRootCause.case_id == case_id).all()
    rc_map = {rc.id: rc.description[:60] for rc in rcs}
    actions = db.query(CaseAction).filter(CaseAction.case_id == case_id).order_by(CaseAction.id).all()
    return [_action_dict(a, rc_map) for a in actions]


@router.post("/{case_id}/actions")
async def add_action(case_id: int, req: ActionIn,
                     user: User = Depends(require_user), db: Session = Depends(get_db)):
    """Add an action. Corrective actions should link to a root cause."""
    case = _owned_case(case_id, user, db)

    if req.action_type not in ACTION_TYPE_LABELS:
        raise HTTPException(status_code=400, detail="Invalid action_type")

    # Validate root cause linkage
    if req.related_root_cause_id:
        rc = db.query(CaseRootCause).filter(
            CaseRootCause.id == req.related_root_cause_id, CaseRootCause.case_id == case_id
        ).first()
        if not rc:
            raise HTTPException(status_code=400, detail="Referenced root cause does not belong to this case")

    due = None
    if req.due_date:
        try:
            due = datetime.fromisoformat(req.due_date.replace("Z", "+00:00"))
        except ValueError:
            pass

    a = CaseAction(
        case_id=case_id,
        action_type=req.action_type,
        description=req.description,
        related_root_cause_id=req.related_root_cause_id,
        owner=req.owner,
        due_date=due,
        status=req.status,
    )
    db.add(a)
    db.add(CaseTimeline(case_id=case_id, event_type="action_added",
                        description="[" + ACTION_TYPE_LABELS[req.action_type] + "] " + req.description[:70],
                        actor="user"))
    case.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(a)

    rcs = db.query(CaseRootCause).filter(CaseRootCause.case_id == case_id).all()
    return _action_dict(a, {rc.id: rc.description[:60] for rc in rcs})


@router.put("/{case_id}/actions/{action_id}")
async def update_action(case_id: int, action_id: int, req: ActionUpdate,
                        user: User = Depends(require_user), db: Session = Depends(get_db)):
    """Update an action."""
    case = _owned_case(case_id, user, db)
    a = db.query(CaseAction).filter(CaseAction.id == action_id, CaseAction.case_id == case_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Action not found")

    if req.action_type is not None:
        a.action_type = req.action_type
    if req.description is not None:
        a.description = req.description
    if req.related_root_cause_id is not None:
        a.related_root_cause_id = req.related_root_cause_id or None
    if req.owner is not None:
        a.owner = req.owner
    if req.status is not None:
        a.status = req.status
    if req.due_date is not None:
        try:
            a.due_date = datetime.fromisoformat(req.due_date.replace("Z", "+00:00")) if req.due_date else None
        except ValueError:
            pass

    case.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(a)
    rcs = db.query(CaseRootCause).filter(CaseRootCause.case_id == case_id).all()
    return _action_dict(a, {rc.id: rc.description[:60] for rc in rcs})


@router.delete("/{case_id}/actions/{action_id}")
async def delete_action(case_id: int, action_id: int,
                        user: User = Depends(require_user), db: Session = Depends(get_db)):
    """Delete an action."""
    _owned_case(case_id, user, db)
    a = db.query(CaseAction).filter(CaseAction.id == action_id, CaseAction.case_id == case_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Action not found")
    db.delete(a)
    db.commit()
    return {"status": "deleted"}


@router.get("/{case_id}/action-coverage")
async def action_coverage(case_id: int, user: User = Depends(require_user), db: Session = Depends(get_db)):
    """
    Validate that every confirmed root cause has at least one corrective action.
    Returns gaps and warnings.
    """
    _owned_case(case_id, user, db)

    root_causes = db.query(CaseRootCause).filter(CaseRootCause.case_id == case_id).all()
    actions = db.query(CaseAction).filter(CaseAction.case_id == case_id).all()

    confirmed = [rc for rc in root_causes if rc.status == "confirmed"]
    corrective = [a for a in actions if a.action_type == "corrective"]
    preventive = [a for a in actions if a.action_type == "preventive"]
    containment = [a for a in actions if a.action_type == "containment"]

    covered_ids = {a.related_root_cause_id for a in corrective if a.related_root_cause_id}

    gaps = []
    for rc in confirmed:
        if rc.id not in covered_ids:
            gaps.append({
                "root_cause_id": rc.id,
                "description": rc.description,
                "category": rc.category,
                "issue": "no_corrective_action",
            })

    orphan_actions = [
        {"action_id": a.id, "description": a.description, "issue": "not_linked_to_root_cause"}
        for a in corrective if not a.related_root_cause_id
    ]

    warnings = []
    if confirmed and not containment:
        warnings.append("\u5c1a\u672a\u5236\u5b9a\u4e34\u65f6\u904f\u5236\u63aa\u65bd\uff08\u5ba2\u6237\u98ce\u9669\u672a\u63a7\u5236\uff09")
    if confirmed and not preventive:
        warnings.append("\u5c1a\u672a\u5236\u5b9a\u9884\u9632\u63aa\u65bd\uff08\u65e0\u6cd5\u9632\u6b62\u518d\u53d1\u751f\uff09")
    if not confirmed and root_causes:
        warnings.append("\u6709\u5019\u9009\u6839\u56e0\u4f46\u5c1a\u672a\u786e\u8ba4\u4efb\u4f55\u4e00\u9879")

    return {
        "total_root_causes": len(root_causes),
        "confirmed_root_causes": len(confirmed),
        "corrective_actions": len(corrective),
        "preventive_actions": len(preventive),
        "containment_actions": len(containment),
        "coverage_rate": round(len(covered_ids) / len(confirmed) * 100, 1) if confirmed else None,
        "gaps": gaps,
        "orphan_actions": orphan_actions,
        "warnings": warnings,
        "is_complete": len(gaps) == 0 and len(confirmed) > 0 and len(containment) > 0 and len(preventive) > 0,
    }


class EffectivenessCheckRequest(BaseModel):
    action_id: int


@router.post("/{case_id}/actions/{action_id}/check")
async def ai_effectiveness_check(case_id: int, action_id: int,
                                 user: User = Depends(require_user), db: Session = Depends(get_db)):
    """AI checks whether an action truly addresses its root cause (streaming)."""
    _owned_case(case_id, user, db)
    a = db.query(CaseAction).filter(CaseAction.id == action_id, CaseAction.case_id == case_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Action not found")

    rc = None
    if a.related_root_cause_id:
        rc = db.query(CaseRootCause).filter(CaseRootCause.id == a.related_root_cause_id).first()

    system = """\u4f60\u662f\u8d28\u91cf\u63aa\u65bd\u6709\u6548\u6027\u5ba1\u6838\u4e13\u5bb6\u3002

\u5ba1\u6838\u6807\u51c6\uff1a
1. **\u6d88\u9664 vs \u53d1\u73b0**\uff1a\u63aa\u65bd\u662f\u771f\u6b63\u6d88\u9664\u4e86\u6839\u56e0\uff0c\u8fd8\u662f\u53ea\u80fd\u63d0\u9ad8\u53d1\u73b0\u6982\u7387\uff1f
   - \u201c\u589e\u52a0\u68c0\u9a8c\u201d\u3001\u201c\u5168\u6570\u68c0\u67e5\u201d\u3001\u201c\u589e\u52a0\u672b\u68c0\u201d = \u53ea\u80fd\u53d1\u73b0\uff0c\u4e0d\u80fd\u6d88\u9664
   - \u201c\u4fee\u6539\u53c2\u6570\u63a7\u5236\u903b\u8f91\u201d\u3001\u201c\u66f4\u6539\u5de5\u88c5\u8bbe\u8ba1\u201d = \u6d88\u9664\u539f\u56e0
2. **\u5bf9\u5e94\u5173\u7cfb**\uff1a\u63aa\u65bd\u662f\u5426\u771f\u6b63\u9488\u5bf9\u8be5\u6839\u56e0\uff1f
3. **\u53ef\u6301\u7eed\u6027**\uff1a\u4f9d\u8d56\u4eba\u5de5\u81ea\u5f8b\u8fd8\u662f\u7cfb\u7edf\u9632\u9519\uff1f\uff08Poka-Yoke > \u57f9\u8bad > \u63d0\u9192\uff09
4. **\u9057\u6f0f\u98ce\u9669**\uff1a\u662f\u5426\u6f0f\u6389\u4e86\u6d41\u51fa\u539f\u56e0\uff08\u4e3a\u4f55\u6ca1\u62e6\u4f4f\uff09\uff1f

\u8f93\u51fa\u683c\u5f0f\uff1a
**\u3010\u5224\u5b9a\u3011** \u6709\u6548 / \u90e8\u5206\u6709\u6548 / \u65e0\u6548

**\u3010\u63aa\u65bd\u7c7b\u578b\u3011** \u6d88\u9664\u539f\u56e0 / \u4ec5\u63d0\u9ad8\u53d1\u73b0 / \u964d\u4f4e\u5f71\u54cd

**\u3010\u95ee\u9898\u3011**
\u5177\u4f53\u6307\u51fa\u4e0d\u8db3

**\u3010\u6539\u8fdb\u5efa\u8bae\u3011**
\u7ed9\u51fa\u66f4\u5f3a\u7684\u63aa\u65bd\u5efa\u8bae

\u4e25\u683c\u4f46\u5efa\u8bbe\u6027\u3002\u4f7f\u7528\u4e2d\u6587\u3002"""

    user_content = "\u63aa\u65bd\u7c7b\u578b: " + ACTION_TYPE_LABELS.get(a.action_type, a.action_type)
    user_content += "\n\u63aa\u65bd\u5185\u5bb9: " + a.description
    if rc:
        user_content += "\n\n\u5bf9\u5e94\u6839\u56e0 [" + str(CATEGORY_LABELS.get(rc.category or "", "")) + "]: " + rc.description
        if rc.cause_chain:
            user_content += "\n5Why\u94fe: " + rc.cause_chain
    else:
        user_content += "\n\n\u26a0 \u6b64\u63aa\u65bd\u672a\u5173\u8054\u4efb\u4f55\u6839\u56e0"

    messages = [{"role": "system", "content": system}, {"role": "user", "content": user_content}]

    async def generate():
        collected = []
        try:
            async for chunk in chat_completion_stream(messages, temperature=0.4):
                collected.append(chunk)
                yield "data: " + json.dumps({"content": chunk}) + "\n\n"
        except Exception as e:
            yield "data: " + json.dumps({"error": str(e)}) + "\n\n"

        full = "".join(collected)
        if full:
            try:
                a.effectiveness_check = full[:4000]
                db.commit()
            except Exception:
                pass
        yield "data: [DONE]\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream",
                             headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})


# ============================================================
# Effect Verification (before/after)
# ============================================================

class VerificationRequest(BaseModel):
    before_data: str  # comma-separated values
    after_data: str
    metric_name: str = "\u4e0d\u826f\u7387"
    usl: Optional[float] = None
    lsl: Optional[float] = None
    lower_is_better: bool = True
    before_defects: Optional[int] = None
    before_total: Optional[int] = None
    after_defects: Optional[int] = None
    after_total: Optional[int] = None


def _parse_values(raw: str) -> List[float]:
    out = []
    for tok in raw.replace("\n", ",").replace("\t", ",").split(","):
        tok = tok.strip()
        if not tok:
            continue
        try:
            out.append(float(tok))
        except ValueError:
            continue
    return out


def _stats(values: List[float]) -> dict:
    n = len(values)
    if n == 0:
        return {}
    mean = sum(values) / n
    if n > 1:
        var = sum((v - mean) ** 2 for v in values) / (n - 1)
    else:
        var = 0.0
    std = math.sqrt(var)
    srt = sorted(values)
    return {
        "n": n,
        "mean": round(mean, 4),
        "std": round(std, 4),
        "min": round(srt[0], 4),
        "max": round(srt[-1], 4),
        "median": round(srt[n // 2] if n % 2 else (srt[n // 2 - 1] + srt[n // 2]) / 2, 4),
        "_mean_raw": mean,
        "_std_raw": std,
    }


def _cpk(mean: float, std: float, usl: Optional[float], lsl: Optional[float]) -> Optional[float]:
    if std <= 0 or (usl is None and lsl is None):
        return None
    vals = []
    if usl is not None:
        vals.append((usl - mean) / (3 * std))
    if lsl is not None:
        vals.append((mean - lsl) / (3 * std))
    return round(min(vals), 3) if vals else None


@router.post("/{case_id}/verify")
async def submit_verification(case_id: int, req: VerificationRequest,
                              user: User = Depends(require_user), db: Session = Depends(get_db)):
    """
    Submit before/after data. Computes statistical comparison:
    mean shift, std change, Cpk before/after, defect rate change, Welch's t-test.
    """
    case = _owned_case(case_id, user, db)

    before = _parse_values(req.before_data)
    after = _parse_values(req.after_data)

    if len(before) < 2 or len(after) < 2:
        raise HTTPException(status_code=400, detail="Each dataset needs at least 2 numeric values")

    sb = _stats(before)
    sa = _stats(after)

    mb, sdb = sb["_mean_raw"], sb["_std_raw"]
    ma, sda = sa["_mean_raw"], sa["_std_raw"]
    nb, na = sb["n"], sa["n"]

    mean_shift = ma - mb
    mean_shift_pct = (mean_shift / mb * 100) if mb != 0 else None
    std_change_pct = ((sda - sdb) / sdb * 100) if sdb > 0 else None

    # Welch's t-test
    t_stat = None
    p_value = None
    significant = None
    se = math.sqrt((sdb ** 2 / nb) + (sda ** 2 / na)) if (sdb > 0 or sda > 0) else 0
    if se > 0:
        t_stat = (ma - mb) / se
        z = abs(t_stat)
        p_value = max(0.0, min(1.0, 2 * math.exp(-0.717 * z - 0.416 * z * z)))
        significant = p_value < 0.05

    cpk_before = _cpk(mb, sdb, req.usl, req.lsl)
    cpk_after = _cpk(ma, sda, req.usl, req.lsl)

    # Defect rate
    defect = None
    if req.before_total and req.after_total:
        rb = (req.before_defects or 0) / req.before_total * 100
        ra = (req.after_defects or 0) / req.after_total * 100
        defect = {
            "before_rate": round(rb, 3),
            "after_rate": round(ra, 3),
            "reduction_pct": round((rb - ra) / rb * 100, 1) if rb > 0 else None,
            "before_defects": req.before_defects or 0,
            "before_total": req.before_total,
            "after_defects": req.after_defects or 0,
            "after_total": req.after_total,
        }

    # Verdict
    improved = (mean_shift < 0) if req.lower_is_better else (mean_shift > 0)
    if significant and improved:
        if cpk_after is not None and cpk_after >= 1.33:
            verdict = "effective"
            verdict_label = "\u63aa\u65bd\u6709\u6548"
        elif cpk_after is not None and cpk_after < 1.33:
            verdict = "partially_effective"
            verdict_label = "\u90e8\u5206\u6709\u6548\uff08\u8fc7\u7a0b\u80fd\u529b\u4ecd\u4e0d\u8db3\uff09"
        else:
            verdict = "effective"
            verdict_label = "\u63aa\u65bd\u6709\u6548"
    elif improved and not significant:
        verdict = "insufficient_evidence"
        verdict_label = "\u8d8b\u52bf\u5411\u597d\u4f46\u8bc1\u636e\u4e0d\u8db3\uff08\u672a\u8fbe\u7edf\u8ba1\u663e\u8457\uff09"
    elif significant and not improved:
        verdict = "ineffective"
        verdict_label = "\u63aa\u65bd\u65e0\u6548\uff08\u6307\u6807\u6076\u5316\uff09"
    else:
        verdict = "insufficient_evidence"
        verdict_label = "\u65e0\u660e\u786e\u6539\u5584"

    for k in ("_mean_raw", "_std_raw"):
        sb.pop(k, None)
        sa.pop(k, None)

    result = {
        "metric_name": req.metric_name,
        "before": sb,
        "after": sa,
        "mean_shift": round(mean_shift, 4),
        "mean_shift_pct": round(mean_shift_pct, 2) if mean_shift_pct is not None else None,
        "std_change_pct": round(std_change_pct, 2) if std_change_pct is not None else None,
        "t_stat": round(t_stat, 4) if t_stat is not None else None,
        "p_value": round(p_value, 4) if p_value is not None else None,
        "significant": significant,
        "cpk_before": cpk_before,
        "cpk_after": cpk_after,
        "cpk_improvement": round(cpk_after - cpk_before, 3) if (cpk_before is not None and cpk_after is not None) else None,
        "defect": defect,
        "verdict": verdict,
        "verdict_label": verdict_label,
        "lower_is_better": req.lower_is_better,
        "usl": req.usl,
        "lsl": req.lsl,
    }

    # Persist as evidence
    ev = CaseEvidence(
        case_id=case_id,
        evidence_type="measurement",
        source="user_provided",
        title="\u6548\u679c\u9a8c\u8bc1: " + req.metric_name,
        content=json.dumps(result, ensure_ascii=False),
        verification_status="verified" if verdict == "effective" else "unverified",
        related_step="verify",
        created_by="user",
    )
    db.add(ev)
    db.add(CaseTimeline(case_id=case_id, event_type="verification_submitted",
                        description="\u6548\u679c\u9a8c\u8bc1: " + verdict_label, actor="user"))
    case.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(ev)

    result["evidence_id"] = ev.id
    return result


class InterpretVerificationRequest(BaseModel):
    verification: dict
    context: Optional[str] = None


@router.post("/{case_id}/verify/interpret")
async def interpret_verification(case_id: int, req: InterpretVerificationRequest,
                                 user: User = Depends(require_user), db: Session = Depends(get_db)):
    """AI interprets the before/after comparison (streaming)."""
    case = _owned_case(case_id, user, db)

    system = """\u4f60\u662f\u8d28\u91cf\u6539\u5584\u6548\u679c\u9a8c\u8bc1\u4e13\u5bb6\u3002\u7528\u6237\u63d0\u4f9b\u4e86\u6539\u5584\u524d\u540e\u7684\u7edf\u8ba1\u5bf9\u6bd4\u6570\u636e\u3002

\u4f60\u7684\u4efb\u52a1\uff1a
1. \u89e3\u8bfb\u5747\u503c\u504f\u79fb\u3001\u6ce2\u52a8\u53d8\u5316\u3001\u8fc7\u7a0b\u80fd\u529b\u53d8\u5316
2. \u5224\u65ad\u6539\u5584\u662f\u5426\u7edf\u8ba1\u663e\u8457\uff08\u770bp\u503c\uff09\uff0c\u4ee5\u53ca\u662f\u5426\u5177\u6709\u5b9e\u9645\u610f\u4e49
3. **\u91cd\u8981**\uff1a\u533a\u5206\u201c\u5747\u503c\u6539\u5584\u201d\u548c\u201c\u6ce2\u52a8\u6539\u5584\u201d\u3002\u5982\u679c\u5747\u503c\u6539\u5584\u4f46\u6807\u51c6\u5dee\u53d8\u5927\uff0c\u8fc7\u7a0b\u53ef\u80fd\u66f4\u4e0d\u7a33\u5b9a
4. \u63d0\u9192\u9a8c\u8bc1\u5145\u5206\u6027\uff1a\u6837\u672c\u91cf\u662f\u5426\u8db3\u591f\uff1f\u662f\u5426\u8fde\u7eed\u591a\u6279\u9a8c\u8bc1\uff1f\u662f\u5426\u8986\u76d6\u4e0d\u540c\u73ed\u6b21/\u8bbe\u5907\uff1f
5. \u7ed9\u51fa\u5173\u95ed\u5efa\u8bae\uff1a\u53ef\u4ee5\u5173\u95ed / \u9700\u8865\u5145\u9a8c\u8bc1 / \u63aa\u65bd\u9700\u8c03\u6574

\u8f93\u51fa\u683c\u5f0f\uff1a
**\u3010\u9a8c\u8bc1\u7ed3\u8bba\u3011**

**\u3010\u6570\u636e\u89e3\u8bfb\u3011**
- \u4e2d\u5fc3\u8d8b\u52bf\u53d8\u5316
- \u6ce2\u52a8\u53d8\u5316
- \u8fc7\u7a0b\u80fd\u529b\u53d8\u5316

**\u3010\u98ce\u9669\u63d0\u9192\u3011**

**\u3010\u5173\u95ed\u5efa\u8bae\u3011**

\u4f7f\u7528\u4e2d\u6587\uff0c\u7b80\u6d01\u4e13\u4e1a\u3002"""

    user_content = "\u9a8c\u8bc1\u6570\u636e:\n" + json.dumps(req.verification, ensure_ascii=False)[:2500]
    if case.problem_statement:
        user_content += "\n\n\u95ee\u9898\u80cc\u666f: " + case.problem_statement[:500]
    if case.root_cause:
        user_content += "\n\u5df2\u786e\u8ba4\u6839\u56e0: " + case.root_cause[:500]
    if req.context:
        user_content += "\n\u8865\u5145\u8bf4\u660e: " + req.context

    messages = [{"role": "system", "content": system}, {"role": "user", "content": user_content}]

    async def generate():
        try:
            async for chunk in chat_completion_stream(messages, temperature=0.5):
                yield "data: " + json.dumps({"content": chunk}) + "\n\n"
        except Exception as e:
            yield "data: " + json.dumps({"error": str(e)}) + "\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream",
                             headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})


@router.get("/{case_id}/verifications")
async def list_verifications(case_id: int, user: User = Depends(require_user), db: Session = Depends(get_db)):
    """List all submitted verifications for a case."""
    _owned_case(case_id, user, db)
    evs = db.query(CaseEvidence).filter(
        CaseEvidence.case_id == case_id,
        CaseEvidence.related_step == "verify",
        CaseEvidence.evidence_type == "measurement",
    ).order_by(CaseEvidence.id.desc()).all()

    out = []
    for e in evs:
        try:
            data = json.loads(e.content) if e.content else {}
        except (json.JSONDecodeError, TypeError):
            data = {}
        out.append({
            "evidence_id": e.id,
            "title": e.title,
            "created_at": e.created_at.isoformat() if e.created_at else None,
            "data": data,
        })
    return out
