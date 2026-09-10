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
from datetime import datetime, timezone, timedelta
import random
import re

from app.database.session import get_db
from app.models.user import User, UserRole, SMSCode
from app.services import sms as sms_service
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

# ============================================================
# SMS verification (phone login / register)
# ============================================================

PHONE_RE = re.compile(r"^1[3-9]\d{9}$")
CODE_TTL_MINUTES = 5
RESEND_COOLDOWN_SECONDS = 60
MAX_VERIFY_ATTEMPTS = 5
MAX_CODES_PER_PHONE_PER_DAY = 10


class SmsSendRequest(BaseModel):
    phone: str
    purpose: str = "login"  # login | register


class SmsVerifyRequest(BaseModel):
    phone: str
    code: str
    nickname: Optional[str] = None


def _now():
    return datetime.now(timezone.utc)


def _as_utc(dt):
    """SQLite returns naive datetimes; treat them as UTC."""
    if dt is None:
        return None
    return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)


@router.get("/sms/status")
async def sms_status():
    """Whether SMS is configured. Frontend uses this to show/hide phone login."""
    return sms_service.status()


@router.post("/sms/send")
async def send_sms_code(req: SmsSendRequest, db: Session = Depends(get_db)):
    """Send a verification code. 60s cooldown, 10/day cap per phone."""
    phone = req.phone.strip()
    if not PHONE_RE.match(phone):
        raise HTTPException(status_code=400, detail="Invalid phone number format")

    # Cooldown
    latest = db.query(SMSCode).filter(SMSCode.phone == phone).order_by(SMSCode.id.desc()).first()
    if latest and latest.created_at:
        elapsed = (_now() - _as_utc(latest.created_at)).total_seconds()
        if elapsed < RESEND_COOLDOWN_SECONDS:
            raise HTTPException(
                status_code=429,
                detail="Please wait " + str(int(RESEND_COOLDOWN_SECONDS - elapsed)) + "s before requesting a new code",
            )

    # Daily cap
    day_ago = _now() - timedelta(days=1)
    sent_today = db.query(SMSCode).filter(
        SMSCode.phone == phone, SMSCode.created_at >= day_ago
    ).count()
    if sent_today >= MAX_CODES_PER_PHONE_PER_DAY:
        raise HTTPException(status_code=429, detail="Daily SMS limit reached for this number")

    code = "".join(random.choice("0123456789") for _ in range(6))

    result = await sms_service.send_verification_code(phone, code)
    if not result["success"]:
        raise HTTPException(status_code=502, detail="Failed to send SMS: " + result.get("message", ""))

    record = SMSCode(
        phone=phone,
        code=code,
        purpose=req.purpose,
        expires_at=_now() + timedelta(minutes=CODE_TTL_MINUTES),
        used=False,
        attempts=0,
    )
    db.add(record)
    db.commit()

    resp = {
        "sent": True,
        "mode": result["mode"],
        "expires_in": CODE_TTL_MINUTES * 60,
        "cooldown": RESEND_COOLDOWN_SECONDS,
    }
    # Only surface the code in mock mode so the flow is testable pre-approval
    if result["mode"] == "mock":
        resp["mock_code"] = code
        resp["note"] = "SMS not configured - code returned for testing only"
    return resp


@router.post("/sms/verify", response_model=TokenResponse)
async def verify_sms_code(req: SmsVerifyRequest, db: Session = Depends(get_db)):
    """Verify code, then log in (existing phone) or register (new phone)."""
    phone = req.phone.strip()
    if not PHONE_RE.match(phone):
        raise HTTPException(status_code=400, detail="Invalid phone number format")

    record = db.query(SMSCode).filter(
        SMSCode.phone == phone, SMSCode.used == False
    ).order_by(SMSCode.id.desc()).first()

    if not record:
        raise HTTPException(status_code=400, detail="No pending verification code; please request one")

    if _as_utc(record.expires_at) < _now():
        raise HTTPException(status_code=400, detail="Verification code expired; please request a new one")

    if (record.attempts or 0) >= MAX_VERIFY_ATTEMPTS:
        raise HTTPException(status_code=429, detail="Too many failed attempts; please request a new code")

    if record.code != req.code.strip():
        record.attempts = (record.attempts or 0) + 1
        db.commit()
        remaining = MAX_VERIFY_ATTEMPTS - record.attempts
        raise HTTPException(
            status_code=400,
            detail="Incorrect code (" + str(max(0, remaining)) + " attempts left)",
        )

    record.used = True

    user = db.query(User).filter(User.phone == phone).first()
    created = False
    if not user:
        user = User(
            phone=phone,
            nickname=req.nickname or ("user_" + phone[-4:]),
            role=UserRole.user,
            is_verified=True,
        )
        db.add(user)
        created = True
    else:
        # Phone verification proves ownership
        user.is_verified = True

    user.last_login_at = _now()
    db.commit()
    db.refresh(user)

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
            "is_new": created,
        },
    )


class BindPhoneRequest(BaseModel):
    phone: str
    code: str


@router.post("/sms/bind")
async def bind_phone(req: BindPhoneRequest, user: User = Depends(require_user), db: Session = Depends(get_db)):
    """Bind a phone number to the currently logged-in account."""
    phone = req.phone.strip()
    if not PHONE_RE.match(phone):
        raise HTTPException(status_code=400, detail="Invalid phone number format")

    existing = db.query(User).filter(User.phone == phone, User.id != user.id).first()
    if existing:
        raise HTTPException(status_code=400, detail="This phone number is already bound to another account")

    record = db.query(SMSCode).filter(
        SMSCode.phone == phone, SMSCode.used == False
    ).order_by(SMSCode.id.desc()).first()
    if not record:
        raise HTTPException(status_code=400, detail="No pending verification code")
    if _as_utc(record.expires_at) < _now():
        raise HTTPException(status_code=400, detail="Verification code expired")
    if record.code != req.code.strip():
        record.attempts = (record.attempts or 0) + 1
        db.commit()
        raise HTTPException(status_code=400, detail="Incorrect code")

    record.used = True
    user.phone = phone
    user.is_verified = True
    db.commit()
    return {"status": "bound", "phone": phone}
