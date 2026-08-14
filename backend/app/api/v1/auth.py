"""
Authentication API endpoints.
- Email + password registration/login
- SMS verification (Task 2)
- Current user info
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime, timezone

from app.database.session import get_db
from app.models.user import User, UserRole
from app.core.security import (
    hash_password, verify_password, create_access_token,
    get_current_user, require_user,
)

router = APIRouter()


# === Schemas ===

class RegisterRequest(BaseModel):
    email: str
    password: str
    nickname: Optional[str] = None

class LoginRequest(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

class UserResponse(BaseModel):
    id: int
    email: Optional[str]
    phone: Optional[str]
    nickname: Optional[str]
    role: str
    avatar_url: Optional[str]
    is_verified: bool
    created_at: Optional[str]

    class Config:
        from_attributes = True


# === Endpoints ===

@router.post("/register", response_model=TokenResponse)
async def register(req: RegisterRequest, db: Session = Depends(get_db)):
    """Register with email + password."""
    # Check if email already exists
    existing = db.query(User).filter(User.email == req.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    # Create user
    user = User(
        email=req.email,
        password_hash=hash_password(req.password),
        nickname=req.nickname or req.email.split("@")[0],
        role=UserRole.user,
        is_verified=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Generate token
    token = create_access_token(user.id, user.role)
    return TokenResponse(
        access_token=token,
        user={
            "id": user.id,
            "email": user.email,
            "nickname": user.nickname,
            "role": user.role,
        },
    )


@router.post("/login", response_model=TokenResponse)
async def login(req: LoginRequest, db: Session = Depends(get_db)):
    """Login with email + password."""
    user = db.query(User).filter(User.email == req.email).first()
    if not user or not user.password_hash:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not verify_password(req.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is disabled",
        )

    # Update last login
    user.last_login_at = datetime.now(timezone.utc)
    db.commit()

    token = create_access_token(user.id, user.role)
    return TokenResponse(
        access_token=token,
        user={
            "id": user.id,
            "email": user.email,
            "phone": user.phone,
            "nickname": user.nickname,
            "role": user.role,
            "avatar_url": user.avatar_url,
        },
    )


@router.get("/me", response_model=UserResponse)
async def get_me(user: User = Depends(require_user)):
    """Get current authenticated user info."""
    return UserResponse(
        id=user.id,
        email=user.email,
        phone=user.phone,
        nickname=user.nickname,
        role=user.role,
        avatar_url=user.avatar_url,
        is_verified=user.is_verified,
        created_at=user.created_at.isoformat() if user.created_at else None,
    )
