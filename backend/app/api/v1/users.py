"""
User management API endpoints.
- Admin: list users, change roles, disable
- User: progress, favorites
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone
import json

from app.database.session import get_db
from app.models.user import User, UserRole, UserProgress, UserFavorite
from app.core.security import require_user, require_role

router = APIRouter()


# === Schemas ===

class UserListItem(BaseModel):
    id: int
    email: Optional[str]
    phone: Optional[str]
    nickname: Optional[str]
    role: str
    is_active: bool
    is_verified: bool
    created_at: Optional[str]
    last_login_at: Optional[str]

class ChangeRoleRequest(BaseModel):
    role: str

class ProgressRequest(BaseModel):
    tool_id: str
    page_path: Optional[str] = None
    progress_data: Optional[dict] = None

class FavoriteRequest(BaseModel):
    tool_id: str


# === Admin Endpoints ===

@router.get("/", response_model=List[UserListItem])
async def list_users(
    limit: int = 50, offset: int = 0,
    admin: User = Depends(require_role(UserRole.admin)),
    db: Session = Depends(get_db),
):
    """List all users (admin only)."""
    users = db.query(User).offset(offset).limit(limit).all()
    return [
        UserListItem(
            id=u.id, email=u.email, phone=u.phone, nickname=u.nickname,
            role=u.role, is_active=u.is_active, is_verified=u.is_verified,
            created_at=u.created_at.isoformat() if u.created_at else None,
            last_login_at=u.last_login_at.isoformat() if u.last_login_at else None,
        )
        for u in users
    ]


@router.put("/{user_id}/role")
async def change_user_role(
    user_id: int, req: ChangeRoleRequest,
    admin: User = Depends(require_role(UserRole.admin)),
    db: Session = Depends(get_db),
):
    """Change a user's role (admin only)."""
    if req.role not in [r.value for r in UserRole]:
        raise HTTPException(status_code=400, detail="Invalid role")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.role = req.role
    db.commit()
    return {"status": "updated", "user_id": user_id, "new_role": req.role}


@router.delete("/{user_id}")
async def disable_user(
    user_id: int,
    admin: User = Depends(require_role(UserRole.admin)),
    db: Session = Depends(get_db),
):
    """Disable a user account (admin only)."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.is_active = False
    db.commit()
    return {"status": "disabled", "user_id": user_id}


# === User Progress ===

@router.get("/progress")
async def get_progress(
    user: User = Depends(require_user),
    db: Session = Depends(get_db),
):
    """Get all progress for current user."""
    items = db.query(UserProgress).filter(UserProgress.user_id == user.id).all()
    return [
        {
            "tool_id": p.tool_id,
            "page_path": p.page_path,
            "progress_data": json.loads(p.progress_data) if p.progress_data else None,
            "updated_at": p.updated_at.isoformat() if p.updated_at else None,
        }
        for p in items
    ]


@router.post("/progress")
async def save_progress(
    req: ProgressRequest,
    user: User = Depends(require_user),
    db: Session = Depends(get_db),
):
    """Save or update progress for a tool."""
    existing = db.query(UserProgress).filter(
        UserProgress.user_id == user.id,
        UserProgress.tool_id == req.tool_id,
    ).first()

    data_json = json.dumps(req.progress_data) if req.progress_data else None

    if existing:
        existing.page_path = req.page_path
        existing.progress_data = data_json
        existing.updated_at = datetime.now(timezone.utc)
    else:
        progress = UserProgress(
            user_id=user.id,
            tool_id=req.tool_id,
            page_path=req.page_path,
            progress_data=data_json,
        )
        db.add(progress)

    db.commit()
    return {"status": "saved"}


# === Favorites ===

@router.get("/favorites")
async def get_favorites(
    user: User = Depends(require_user),
    db: Session = Depends(get_db),
):
    """Get user's favorite tools."""
    items = db.query(UserFavorite).filter(UserFavorite.user_id == user.id).all()
    return [{"tool_id": f.tool_id, "created_at": f.created_at.isoformat()} for f in items]


@router.post("/favorites")
async def add_favorite(
    req: FavoriteRequest,
    user: User = Depends(require_user),
    db: Session = Depends(get_db),
):
    """Add a tool to favorites."""
    existing = db.query(UserFavorite).filter(
        UserFavorite.user_id == user.id,
        UserFavorite.tool_id == req.tool_id,
    ).first()
    if existing:
        return {"status": "already_exists"}

    fav = UserFavorite(user_id=user.id, tool_id=req.tool_id)
    db.add(fav)
    db.commit()
    return {"status": "added"}


@router.delete("/favorites/{tool_id}")
async def remove_favorite(
    tool_id: str,
    user: User = Depends(require_user),
    db: Session = Depends(get_db),
):
    """Remove a tool from favorites."""
    fav = db.query(UserFavorite).filter(
        UserFavorite.user_id == user.id,
        UserFavorite.tool_id == tool_id,
    ).first()
    if not fav:
        raise HTTPException(status_code=404, detail="Favorite not found")
    
    db.delete(fav)
    db.commit()
    return {"status": "removed"}
