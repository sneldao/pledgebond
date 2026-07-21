import os
import uuid
import logging
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

referrals_router = APIRouter(prefix="/referrals", tags=["referrals"])


class ReferralCode(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    code: str
    uses: int = 0
    max_uses: Optional[int] = None
    reward_type: str = "trust_score"  # trust_score, badge, discount
    reward_value: float = 1.0
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    expires_at: Optional[str] = None


class ReferralRecord(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    referrer_user_id: str
    referred_user_id: str
    referral_code: str
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    reward_granted: bool = False
    reward_type: str = "trust_score"
    reward_value: float = 1.0


class GenerateReferralCodeRequest(BaseModel):
    max_uses: Optional[int] = None
    expires_days: Optional[int] = None


class ApplyReferralCodeRequest(BaseModel):
    code: str


@referrals_router.post("/generate")
async def generate_referral_code(req: GenerateReferralCodeRequest, user: dict = Depends(require_user)):
    from server import db
    import secrets

    # Generate unique code
    code = f"PLEDGE{secrets.token_urlsafe(8).upper()}"

    # Calculate expiry
    expires_at = None
    if req.expires_days:
        from datetime import timedelta
        expires_at = (datetime.now(timezone.utc) + timedelta(days=req.expires_days)).isoformat()

    referral_code = ReferralCode(
        user_id=user["id"],
        code=code,
        max_uses=req.max_uses,
        expires_at=expires_at,
        reward_type="trust_score",
        reward_value=1.0,
    )

    await db.referral_codes.insert_one(referral_code.model_dump())

    return {
        "code": code,
        "max_uses": req.max_uses,
        "expires_at": expires_at,
        "share_url": f"{os.environ.get('FRONTEND_URL', 'http://localhost:3000')}/register?ref={code}",
    }


@referrals_router.post("/apply")
async def apply_referral_code(req: ApplyReferralCodeRequest):
    from server import db

    user = await require_user()

    # Check if user was already referred
    existing = await db.referral_records.find_one({"referred_user_id": user["id"]})
    if existing:
        raise HTTPException(400, "You have already used a referral code")

    # Find the referral code
    referral_code_doc = await db.referral_codes.find_one({"code": req.code.upper()})
    if not referral_code_doc:
        raise HTTPException(404, "Invalid referral code")

    # Check expiry
    if referral_code_doc.get("expires_at"):
        expires_at = datetime.fromisoformat(referral_code_doc["expires_at"])
        if datetime.now(timezone.utc) > expires_at:
            raise HTTPException(400, "This referral code has expired")

    # Check max uses
    if referral_code_doc.get("max_uses") and referral_code_doc["uses"] >= referral_code_doc["max_uses"]:
        raise HTTPException(400, "This referral code has reached its usage limit")

    # Check if trying to refer self
    if referral_code_doc["user_id"] == user["id"]:
        raise HTTPException(400, "You cannot use your own referral code")

    # Create referral record
    referral_record = ReferralRecord(
        referrer_user_id=referral_code_doc["user_id"],
        referred_user_id=user["id"],
        referral_code=req.code.upper(),
        reward_type=referral_code_doc["reward_type"],
        reward_value=referral_code_doc["reward_value"],
    )

    await db.referral_records.insert_one(referral_record.model_dump())

    # Update code usage count
    await db.referral_codes.update_one(
        {"_id": referral_code_doc["_id"]},
        {"$inc": {"uses": 1}}
    )

    # Grant reward to referrer
    if referral_code_doc["reward_type"] == "trust_score":
        await db.users.update_one(
            {"id": referral_code_doc["user_id"]},
            {"$inc": {"trust_score": referral_code_doc["reward_value"]}}
        )
        await db.referral_records.update_one(
            {"_id": referral_record.id},
            {"$set": {"reward_granted": True}}
        )

    # Also grant small bonus to referred user
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {"referred_by": referral_code_doc["user_id"]},
         "$inc": {"trust_score": 0.5}}
    )

    return {
        "success": True,
        "message": "Referral code applied successfully",
        "reward_granted": True,
    }


@referrals_router.get("/my-codes")
async def get_my_referral_codes(user: dict = Depends(require_user)):
    from server import db

    codes = await db.referral_codes.find(
        {"user_id": user["id"]}
    ).sort("created_at", -1).to_list(100)

    return [{"code": c["code"], "uses": c["uses"], "max_uses": c.get("max_uses"),
             "created_at": c["created_at"], "expires_at": c.get("expires_at")} for c in codes]


@referrals_router.get("/my-referrals")
async def get_my_referrals(user: dict = Depends(require_user)):
    from server import db

    referrals = await db.referral_records.find(
        {"referrer_user_id": user["id"]}
    ).sort("created_at", -1).to_list(100)

    # Get referred user details
    result = []
    for ref in referrals:
        referred_user = await db.users.find_one({"id": ref["referred_user_id"]}, {"_id": 0, "password_hash": 0})
        result.append({
            "referred_user_name": referred_user.get("display_name", "Unknown") if referred_user else "Unknown",
            "referred_user_email": referred_user.get("email", "") if referred_user else "",
            "code": ref["referral_code"],
            "created_at": ref["created_at"],
            "reward_granted": ref["reward_granted"],
        })

    return result


@referrals_router.get("/stats")
async def get_referral_stats(user: dict = Depends(require_user)):
    from server import db

    total_codes = await db.referral_codes.count_documents({"user_id": user["id"]})
    total_referrals = await db.referral_records.count_documents({"referrer_user_id": user["id"]})
    total_rewards = await db.referral_records.count_documents({
        "referrer_user_id": user["id"],
        "reward_granted": True
    })

    return {
        "total_codes": total_codes,
        "total_referrals": total_referrals,
        "total_rewards": total_rewards,
        "trust_score_earned": total_rewards * 1.0,  # Assuming 1.0 per referral
    }


async def ensure_referral_indexes(db):
    await db.referral_codes.create_index("code", unique=True)
    await db.referral_codes.create_index("user_id")
    await db.referral_records.create_index("referrer_user_id")
    await db.referral_records.create_index("referred_user_id", unique=True)
    await db.referral_records.create_index("referral_code")
