"""
Paywall and usage tracking.
Free: 3 cases/month, 3 analyses/month
Pro: unlimited
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel

from app.database.session import get_db
from app.models.user import User, UserRole
from app.models.quality_case import QualityCase
from app.core.security import require_user

router = APIRouter()

# Free tier limits
FREE_CASES_PER_MONTH = 3
FREE_ANALYSES_PER_MONTH = 3

# Pricing (display only - actual payment TBD)
PLANS = {
    "free": {
        "name": "免费版",
        "price": 0,
        "price_label": "¥0/月",
        "cases_per_month": FREE_CASES_PER_MONTH,
        "analyses_per_month": FREE_ANALYSES_PER_MONTH,
        "features": ["基础问题分析", "基础5Why", "3个案例/月", "3次数据分析/月", "基础8D生成"],
    },
    "pro": {
        "name": "Pro 专业版",
        "price": 99,
        "price_label": "¥99/月",
        "price_annual": "¥999/年",
        "cases_per_month": -1,  # unlimited
        "analyses_per_month": -1,
        "features": ["无限质量案例", "无限数据分析", "深度根因验证", "完整8D+Word导出",
                     "历史案例库", "AI质量教练", "优先AI响应", "FMEA辅助"],
    },
    "pro_plus": {
        "name": "Pro+ 团队版",
        "price": 299,
        "price_label": "¥299/月",
        "price_annual": "¥2,999/年",
        "cases_per_month": -1,
        "analyses_per_month": -1,
        "features": ["Pro全部功能", "团队协作", "企业知识库", "批量数据分析",
                     "自定义报告模板", "优先技术支持", "API访问"],
    },
}


def get_month_start():
    """Get first day of current month."""
    now = datetime.now(timezone.utc)
    return now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)


@router.get("/plans")
async def get_plans():
    """Get available subscription plans."""
    return PLANS


@router.get("/usage")
async def get_usage(
    user: User = Depends(require_user),
    db: Session = Depends(get_db),
):
    """Get current month usage for the user."""
    month_start = get_month_start()

    # Count cases created this month
    cases_count = db.query(func.count(QualityCase.id)).filter(
        QualityCase.user_id == user.id,
        QualityCase.created_at >= month_start,
    ).scalar() or 0

    # Determine limits based on role
    is_pro = user.role in (UserRole.vip, UserRole.admin)
    case_limit = -1 if is_pro else FREE_CASES_PER_MONTH
    analysis_limit = -1 if is_pro else FREE_ANALYSES_PER_MONTH

    return {
        "plan": "pro" if is_pro else "free",
        "cases_used": cases_count,
        "cases_limit": case_limit,
        "cases_remaining": -1 if is_pro else max(0, FREE_CASES_PER_MONTH - cases_count),
        "analyses_used": 0,  # TODO: track separately
        "analyses_limit": analysis_limit,
        "can_create_case": is_pro or cases_count < FREE_CASES_PER_MONTH,
        "can_analyze": is_pro or True,  # TODO: track
    }


@router.get("/check-limit")
async def check_limit(
    action: str = "case",
    user: User = Depends(require_user),
    db: Session = Depends(get_db),
):
    """Check if user can perform an action (used before creating case/analysis)."""
    is_pro = user.role in (UserRole.vip, UserRole.admin)
    if is_pro:
        return {"allowed": True, "reason": "pro"}

    if action == "case":
        month_start = get_month_start()
        count = db.query(func.count(QualityCase.id)).filter(
            QualityCase.user_id == user.id,
            QualityCase.created_at >= month_start,
        ).scalar() or 0
        allowed = count < FREE_CASES_PER_MONTH
        return {
            "allowed": allowed,
            "used": count,
            "limit": FREE_CASES_PER_MONTH,
            "reason": "limit_reached" if not allowed else "ok",
        }

    return {"allowed": True, "reason": "ok"}
