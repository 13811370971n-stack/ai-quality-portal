"""
Billing API (P3): orders, payment callbacks, subscription state.
Plus Feedback API for user testing.
"""
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone, timedelta

from app.database.session import get_db
from app.models.user import User, UserRole
from app.models.billing import Order, Subscription, Feedback
from app.core.security import require_user, require_role, get_current_user
from app.services import payment as pay

router = APIRouter()

PRICING = {
    "pro": {"monthly": 99.0, "annual": 999.0, "role": UserRole.vip, "name": "Pro 专业版"},
    "pro_plus": {"monthly": 299.0, "annual": 2999.0, "role": UserRole.vip, "name": "Pro+ 团队版"},
}


def _now():
    return datetime.now(timezone.utc)


def _as_utc(dt):
    if dt is None:
        return None
    return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)


# ============================================================
# Orders
# ============================================================

class CreateOrderRequest(BaseModel):
    plan_id: str                  # pro | pro_plus
    billing_cycle: str = "monthly"  # monthly | annual
    provider: str = "mock"          # alipay | wechat | mock


@router.get("/payment-status")
async def payment_status():
    """Which payment providers are usable."""
    return pay.status()


@router.post("/orders")
async def create_order(req: CreateOrderRequest, user: User = Depends(require_user), db: Session = Depends(get_db)):
    """Create an order and initiate payment."""
    if req.plan_id not in PRICING:
        raise HTTPException(status_code=400, detail="Unknown plan")
    if req.billing_cycle not in ("monthly", "annual"):
        raise HTTPException(status_code=400, detail="Unknown billing cycle")

    amount = PRICING[req.plan_id][req.billing_cycle]
    plan_name = PRICING[req.plan_id]["name"]
    cycle_label = "年付" if req.billing_cycle == "annual" else "月付"
    subject = plan_name + " (" + cycle_label + ")"

    order_no = pay.generate_order_no()
    result = await pay.create_payment(req.provider, order_no, amount, subject)

    if not result["success"]:
        raise HTTPException(status_code=502, detail=result.get("message", "Failed to create payment"))

    order = Order(
        order_no=order_no,
        user_id=user.id,
        plan_id=req.plan_id,
        billing_cycle=req.billing_cycle,
        amount=amount,
        provider=result["provider"],
        status="pending",
        pay_url=result.get("pay_url"),
        expires_at=_now() + timedelta(minutes=pay.ORDER_TTL_MINUTES),
    )
    db.add(order)
    db.commit()
    db.refresh(order)

    return {
        "order_no": order.order_no,
        "amount": order.amount,
        "subject": subject,
        "provider": order.provider,
        "pay_url": order.pay_url,
        "status": order.status,
        "expires_at": order.expires_at.isoformat() if order.expires_at else None,
        "is_mock": order.provider == "mock",
        "message": result.get("message"),
    }


@router.get("/orders")
async def list_orders(user: User = Depends(require_user), db: Session = Depends(get_db)):
    """Current user's order history."""
    orders = db.query(Order).filter(Order.user_id == user.id).order_by(Order.id.desc()).limit(50).all()
    return [
        {
            "order_no": o.order_no,
            "plan_id": o.plan_id,
            "billing_cycle": o.billing_cycle,
            "amount": o.amount,
            "provider": o.provider,
            "status": o.status,
            "created_at": o.created_at.isoformat() if o.created_at else None,
            "paid_at": o.paid_at.isoformat() if o.paid_at else None,
        }
        for o in orders
    ]


@router.get("/orders/{order_no}")
async def get_order(order_no: str, user: User = Depends(require_user), db: Session = Depends(get_db)):
    """Poll order status."""
    order = db.query(Order).filter(Order.order_no == order_no, Order.user_id == user.id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Auto-expire
    if order.status == "pending" and order.expires_at and _as_utc(order.expires_at) < _now():
        order.status = "cancelled"
        db.commit()

    return {
        "order_no": order.order_no,
        "plan_id": order.plan_id,
        "billing_cycle": order.billing_cycle,
        "amount": order.amount,
        "provider": order.provider,
        "status": order.status,
        "pay_url": order.pay_url,
        "created_at": order.created_at.isoformat() if order.created_at else None,
        "paid_at": order.paid_at.isoformat() if order.paid_at else None,
        "expires_at": order.expires_at.isoformat() if order.expires_at else None,
    }


def _activate_subscription(order: Order, db: Session) -> Subscription:
    """Mark order paid, upgrade role, create/extend subscription."""
    order.status = "paid"
    order.paid_at = _now()

    days = 365 if order.billing_cycle == "annual" else 30

    existing = db.query(Subscription).filter(
        Subscription.user_id == order.user_id, Subscription.status == "active"
    ).order_by(Subscription.id.desc()).first()

    if existing and existing.expires_at and _as_utc(existing.expires_at) > _now():
        # Extend from current expiry
        existing.expires_at = _as_utc(existing.expires_at) + timedelta(days=days)
        existing.plan_id = order.plan_id
        sub = existing
    else:
        sub = Subscription(
            user_id=order.user_id,
            plan_id=order.plan_id,
            billing_cycle=order.billing_cycle,
            status="active",
            started_at=_now(),
            expires_at=_now() + timedelta(days=days),
            order_id=order.id,
        )
        db.add(sub)

    # Upgrade role (never downgrade an admin)
    u = db.query(User).filter(User.id == order.user_id).first()
    if u and u.role != UserRole.admin:
        u.role = PRICING[order.plan_id]["role"]

    db.commit()
    return sub


class ConfirmMockRequest(BaseModel):
    order_no: str


@router.post("/orders/confirm-mock")
async def confirm_mock_payment(req: ConfirmMockRequest, user: User = Depends(require_user), db: Session = Depends(get_db)):
    """
    Simulate a successful payment. Only works for mock-provider orders,
    so it cannot be used to bypass a real payment gateway.
    """
    order = db.query(Order).filter(Order.order_no == req.order_no, Order.user_id == user.id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.provider != "mock":
        raise HTTPException(status_code=400, detail="Only mock orders can be confirmed this way")
    if order.status == "paid":
        return {"status": "already_paid", "order_no": order.order_no}

    sub = _activate_subscription(order, db)
    db.refresh(user)

    return {
        "status": "paid",
        "order_no": order.order_no,
        "new_role": user.role,
        "subscription": {
            "plan_id": sub.plan_id,
            "expires_at": sub.expires_at.isoformat() if sub.expires_at else None,
        },
    }


@router.post("/callback/{provider}")
async def payment_callback(provider: str, request: Request, db: Session = Depends(get_db)):
    """
    Asynchronous payment notification endpoint.
    Signature verification is enforced; unverified callbacks are rejected.
    """
    try:
        if request.headers.get("content-type", "").startswith("application/json"):
            payload = await request.json()
        else:
            form = await request.form()
            payload = dict(form)
    except Exception:
        raise HTTPException(status_code=400, detail="Malformed callback payload")

    verified = pay.verify_callback(provider, payload, dict(request.headers))

    if not verified["valid"]:
        # Do not trust unverified callbacks
        raise HTTPException(status_code=400, detail="Callback verification failed: " + str(verified.get("message", "")))

    order = db.query(Order).filter(Order.order_no == verified["order_no"]).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if verified["paid"] and order.status != "paid":
        order.provider_txn_id = verified.get("txn_id")
        _activate_subscription(order, db)

    return {"status": "success"}


@router.get("/my-subscription")
async def my_subscription(user: User = Depends(require_user), db: Session = Depends(get_db)):
    """Current subscription state."""
    sub = db.query(Subscription).filter(
        Subscription.user_id == user.id, Subscription.status == "active"
    ).order_by(Subscription.id.desc()).first()

    if not sub:
        return {"has_subscription": False, "plan_id": "free", "role": user.role}

    expired = sub.expires_at and _as_utc(sub.expires_at) < _now()
    if expired:
        sub.status = "expired"
        if user.role == UserRole.vip:
            user.role = UserRole.user
        db.commit()
        return {"has_subscription": False, "plan_id": "free", "role": user.role, "just_expired": True}

    days_left = (_as_utc(sub.expires_at) - _now()).days if sub.expires_at else None
    return {
        "has_subscription": True,
        "plan_id": sub.plan_id,
        "plan_name": PRICING.get(sub.plan_id, {}).get("name", sub.plan_id),
        "billing_cycle": sub.billing_cycle,
        "started_at": sub.started_at.isoformat() if sub.started_at else None,
        "expires_at": sub.expires_at.isoformat() if sub.expires_at else None,
        "days_left": days_left,
        "role": user.role,
        "auto_renew": sub.auto_renew,
    }


# ============================================================
# Feedback (user testing)
# ============================================================

class FeedbackRequest(BaseModel):
    category: str  # bug | feature | usability | content | other
    content: str
    page_url: Optional[str] = None
    rating: Optional[int] = None
    contact: Optional[str] = None


@router.post("/feedback")
async def submit_feedback(
    req: FeedbackRequest,
    request: Request,
    user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Submit feedback. Works for anonymous visitors too."""
    if req.category not in ("bug", "feature", "usability", "content", "other"):
        raise HTTPException(status_code=400, detail="Invalid category")
    if not req.content.strip():
        raise HTTPException(status_code=400, detail="Content required")

    fb = Feedback(
        user_id=user.id if user else None,
        category=req.category,
        page_url=(req.page_url or "")[:500] or None,
        rating=req.rating if (req.rating and 1 <= req.rating <= 5) else None,
        content=req.content.strip()[:5000],
        contact=(req.contact or "")[:200] or None,
        user_agent=request.headers.get("user-agent", "")[:500] or None,
    )
    db.add(fb)
    db.commit()
    db.refresh(fb)
    return {"status": "received", "id": fb.id}


@router.get("/feedback")
async def list_feedback(
    status_filter: Optional[str] = None,
    admin: User = Depends(require_role(UserRole.admin)),
    db: Session = Depends(get_db),
):
    """List all feedback (admin only)."""
    q = db.query(Feedback)
    if status_filter:
        q = q.filter(Feedback.status == status_filter)
    items = q.order_by(Feedback.id.desc()).limit(200).all()

    return [
        {
            "id": f.id,
            "user_id": f.user_id,
            "category": f.category,
            "page_url": f.page_url,
            "rating": f.rating,
            "content": f.content,
            "contact": f.contact,
            "status": f.status,
            "admin_note": f.admin_note,
            "created_at": f.created_at.isoformat() if f.created_at else None,
        }
        for f in items
    ]


class UpdateFeedbackRequest(BaseModel):
    status: Optional[str] = None
    admin_note: Optional[str] = None


@router.put("/feedback/{fb_id}")
async def update_feedback(
    fb_id: int, req: UpdateFeedbackRequest,
    admin: User = Depends(require_role(UserRole.admin)),
    db: Session = Depends(get_db),
):
    """Triage feedback (admin only)."""
    fb = db.query(Feedback).filter(Feedback.id == fb_id).first()
    if not fb:
        raise HTTPException(status_code=404, detail="Feedback not found")
    if req.status:
        if req.status not in ("new", "reviewing", "resolved", "wontfix"):
            raise HTTPException(status_code=400, detail="Invalid status")
        fb.status = req.status
    if req.admin_note is not None:
        fb.admin_note = req.admin_note
    db.commit()
    return {"status": "updated"}


@router.get("/feedback/stats")
async def feedback_stats(
    admin: User = Depends(require_role(UserRole.admin)),
    db: Session = Depends(get_db),
):
    """Feedback summary for the admin dashboard."""
    total = db.query(func.count(Feedback.id)).scalar() or 0
    by_cat = dict(db.query(Feedback.category, func.count(Feedback.id)).group_by(Feedback.category).all())
    by_status = dict(db.query(Feedback.status, func.count(Feedback.id)).group_by(Feedback.status).all())
    avg_rating = db.query(func.avg(Feedback.rating)).filter(Feedback.rating.isnot(None)).scalar()
    return {
        "total": total,
        "by_category": by_cat,
        "by_status": by_status,
        "avg_rating": round(float(avg_rating), 2) if avg_rating else None,
    }
