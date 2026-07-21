import os
import uuid
import hashlib
import secrets
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional

import jwt
import bcrypt
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from fastapi import APIRouter, HTTPException, Depends, Header, Request
from fastapi.responses import RedirectResponse
from motor.motor_asyncio import AsyncIOMotorClient

logger = logging.getLogger(__name__)

auth_router = APIRouter(prefix="/auth", tags=["auth"])

JWT_SECRET = os.environ.get("JWT_SECRET", "pledgebond-dev-secret-change-me")
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours
REFRESH_TOKEN_EXPIRE_DAYS = 30
MAGIC_LINK_EXPIRE_MINUTES = 15
FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:3000")


# ==================== MODELS ====================

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str = ""
    display_name: str = ""
    avatar_url: str = ""
    role: str = "fundee"
    password_hash: Optional[str] = None
    auth_method: str = "email"
    email_verified: bool = False
    referral_code: str = Field(default_factory=lambda: secrets.token_urlsafe(8))
    referred_by: Optional[str] = None
    trust_score: float = 0.0
    completion_count: int = 0
    streak: int = 0
    longest_streak: int = 0
    last_active: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class MagicLinkToken(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    token: str
    expires_at: str
    used: bool = False
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class RegisterRequest(BaseModel):
    email: str
    display_name: str = ""
    password: str
    role: str = "fundee"
    referral_code: Optional[str] = None


class LoginRequest(BaseModel):
    email: str
    password: str


class MagicLinkRequest(BaseModel):
    email: str


class RefreshRequest(BaseModel):
    refresh_token: str


class AuthResponse(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str = "bearer"
    user: dict


class UserUpdateRequest(BaseModel):
    display_name: Optional[str] = None
    role: Optional[str] = None
    avatar_url: Optional[str] = None


# ==================== HELPERS ====================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))
    except Exception:
        return False


def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "type": "access",
        "exp": datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def create_refresh_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "type": "refresh",
        "exp": datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(401, "Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(401, "Invalid token")


def _clean_user(user: dict) -> dict:
    user.pop("_id", None)
    user.pop("password_hash", None)
    return user


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


# ==================== DEPENDENCY ====================

async def get_current_user(authorization: Optional[str] = Header(None), db=None) -> Optional[dict]:
    if not authorization:
        return None
    try:
        scheme, _, token = authorization.partition(" ")
        if scheme.lower() != "bearer":
            return None
        payload = decode_token(token)
        if payload.get("type") != "access":
            return None
        user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password_hash": 0})
        if user:
            await db.users.update_one({"id": user["id"]}, {"$set": {"last_active": _now_iso()}})
        return user
    except Exception:
        return None


async def require_user(authorization: Optional[str] = Header(None)) -> dict:
    if not authorization:
        raise HTTPException(401, "Authentication required")
    try:
        scheme, _, token = authorization.partition(" ")
        if scheme.lower() != "bearer":
            raise HTTPException(401, "Invalid authorization scheme")
        payload = decode_token(token)
        if payload.get("type") != "access":
            raise HTTPException(401, "Invalid token type")
        from server import db
        user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password_hash": 0})
        if not user:
            raise HTTPException(401, "User not found")
        await db.users.update_one({"id": user["id"]}, {"$set": {"last_active": _now_iso()}})
        return user
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(401, f"Authentication failed: {str(e)}")


# ==================== ENDPOINTS ====================

@auth_router.post("/register", response_model=AuthResponse)
async def register(req: RegisterRequest):
    from server import db

    existing = await db.users.find_one({"email": req.email.lower().strip()})
    if existing:
        raise HTTPException(409, "An account with this email already exists")

    referred_by = None
    if req.referral_code:
        referrer = await db.users.find_one({"referral_code": req.referral_code})
        if referrer:
            referred_by = referrer["id"]
            await db.users.update_one(
                {"id": referrer["id"]},
                {"$inc": {"trust_score": 1}}
            )

    user = User(
        email=req.email.lower().strip(),
        display_name=req.display_name or req.email.split("@")[0],
        password_hash=hash_password(req.password),
        role=req.role,
        auth_method="email",
        referred_by=referred_by,
    )
    await db.users.insert_one(user.model_dump())

    access_token = create_access_token(user.id, user.email)
    refresh_token = create_refresh_token(user.id)

    return AuthResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=_clean_user(user.model_dump()),
    )


@auth_router.post("/login", response_model=AuthResponse)
async def login(req: LoginRequest):
    from server import db

    user = await db.users.find_one({"email": req.email.lower().strip()})
    if not user:
        raise HTTPException(401, "Invalid email or password")

    if not user.get("password_hash"):
        raise HTTPException(401, "This account uses a different login method")

    if not verify_password(req.password, user["password_hash"]):
        raise HTTPException(401, "Invalid email or password")

    access_token = create_access_token(user["id"], user["email"])
    refresh_token = create_refresh_token(user["id"])

    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {"last_active": _now_iso()}}
    )

    return AuthResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=_clean_user(user),
    )


@auth_router.post("/magic-link/send")
async def send_magic_link(req: MagicLinkRequest):
    from server import db

    email = req.email.lower().strip()
    token = secrets.token_urlsafe(32)
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=MAGIC_LINK_EXPIRE_MINUTES)

    magic_link = MagicLinkToken(
        email=email,
        token=token,
        expires_at=expires_at.isoformat(),
    )
    await db.magic_links.insert_one(magic_link.model_dump())

    link_url = f"{FRONTEND_URL}/auth/verify?token={token}&email={email}"
    logger.info(f"Magic link for {email}: {link_url}")

    return {
        "message": "Magic link sent. Check your email.",
        "dev_link": link_url,
    }


@auth_router.post("/magic-link/verify", response_model=AuthResponse)
async def verify_magic_link(token: str, email: str):
    from server import db

    magic_link = await db.magic_links.find_one({
        "token": token,
        "email": email.lower().strip(),
        "used": False,
    })
    if not magic_link:
        raise HTTPException(401, "Invalid or expired magic link")

    expires_at = datetime.fromisoformat(magic_link["expires_at"])
    if datetime.now(timezone.utc) > expires_at:
        raise HTTPException(401, "Magic link has expired")

    await db.magic_links.update_one({"_id": magic_link["_id"]}, {"$set": {"used": True}})

    user = await db.users.find_one({"email": email.lower().strip()})
    if not user:
        user = User(
            email=email.lower().strip(),
            display_name=email.split("@")[0],
            auth_method="magic_link",
            email_verified=True,
        )
        await db.users.insert_one(user.model_dump())
    else:
        await db.users.update_one(
            {"id": user["id"]},
            {"$set": {"email_verified": True, "last_active": _now_iso()}}
        )
        user = await db.users.find_one({"id": user["id"]}, {"_id": 0, "password_hash": 0})

    access_token = create_access_token(user["id"], user["email"])
    refresh_token = create_refresh_token(user["id"])

    return AuthResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=_clean_user(user),
    )


@auth_router.post("/refresh", response_model=AuthResponse)
async def refresh_token(req: RefreshRequest):
    from server import db

    payload = decode_token(req.refresh_token)
    if payload.get("type") != "refresh":
        raise HTTPException(401, "Invalid refresh token")

    user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(401, "User not found")

    access_token = create_access_token(user["id"], user["email"])
    new_refresh = create_refresh_token(user["id"])

    return AuthResponse(
        access_token=access_token,
        refresh_token=new_refresh,
        user=user,
    )


@auth_router.get("/me")
async def get_me(user: dict = Depends(require_user)):
    return _clean_user(user)


@auth_router.put("/me")
async def update_me(req: UserUpdateRequest, user: dict = Depends(require_user)):
    from server import db

    updates = {}
    if req.display_name is not None:
        updates["display_name"] = req.display_name
    if req.role is not None:
        updates["role"] = req.role
    if req.avatar_url is not None:
        updates["avatar_url"] = req.avatar_url

    if updates:
        updates["updated_at"] = _now_iso()
        await db.users.update_one({"id": user["id"]}, {"$set": updates})

    updated = await db.users.find_one({"id": user["id"]}, {"_id": 0, "password_hash": 0})
    return updated


@auth_router.get("/profile/{user_id}")
async def get_profile(user_id: str):
    from server import db

    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(404, "User not found")
    return {
        "display_name": user.get("display_name", ""),
        "avatar_url": user.get("avatar_url", ""),
        "trust_score": user.get("trust_score", 0),
        "completion_count": user.get("completion_count", 0),
        "streak": user.get("streak", 0),
        "longest_streak": user.get("longest_streak", 0),
        "role": user.get("role", "fundee"),
    }


@auth_router.post("/logout")
async def logout(user: dict = Depends(require_user)):
    return {"message": "Logged out successfully"}


@auth_router.get("/stats")
async def get_user_stats(user: dict = Depends(require_user)):
    from server import db

    user_id = user["id"]
    bonds_created = await db.bonds.count_documents({"funder_name": user.get("display_name", "")})

    total_participations = 0
    total_completions = 0
    async for bond in db.bonds.find({}):
        for p in bond.get("participants", []):
            if p.get("display_name") == user.get("display_name", ""):
                total_participations += 1
                if len(p.get("completed_tasks", [])) > 0:
                    tasks = bond.get("task_requirements", [])
                    if len(p.get("completed_tasks", [])) >= len(tasks):
                        total_completions += 1

    return {
        "bonds_created": bonds_created,
        "bonds_joined": total_participations,
        "bonds_completed": total_completions,
        "trust_score": user.get("trust_score", 0),
        "streak": user.get("streak", 0),
        "longest_streak": user.get("longest_streak", 0),
    }


# ==================== INDEX SETUP ====================

async def ensure_auth_indexes(db):
    await db.users.create_index("email", unique=True)
    await db.users.create_index("referral_code", unique=True, sparse=True)
    await db.magic_links.create_index("token", unique=True)
    await db.magic_links.create_index("expires_at", expireAfterSeconds=0)
