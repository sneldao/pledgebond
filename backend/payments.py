import os
import uuid
import logging
from datetime import datetime, timezone
from typing import Optional, List
from pydantic import BaseModel, Field

from fastapi import APIRouter, HTTPException, Depends

logger = logging.getLogger(__name__)

payments_router = APIRouter(prefix="/payments", tags=["payments"])

# Stripe configuration
STRIPE_SECRET_KEY = os.environ.get("STRIPE_SECRET_KEY", "")
STRIPE_WEBHOOK_SECRET = os.environ.get("STRIPE_WEBHOOK_SECRET", "")
PLATFORM_FEE_PERCENT = float(os.environ.get("PLATFORM_FEE_PERCENT", "5"))

try:
    import stripe
    if STRIPE_SECRET_KEY:
        stripe.api_key = STRIPE_SECRET_KEY
        STRIPE_AVAILABLE = True
    else:
        STRIPE_AVAILABLE = False
        logger.warning("Stripe not configured. Payment features disabled.")
except ImportError:
    STRIPE_AVAILABLE = False
    logger.warning("Stripe library not installed. Payment features disabled.")


# ==================== MODELS ====================

class PaymentIntent(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    bond_id: str
    user_id: str
    amount: float
    currency: str = "usd"
    status: str = "pending"  # pending, processing, completed, failed, refunded
    stripe_payment_intent_id: Optional[str] = None
    stripe_client_secret: Optional[str] = None
    stripe_connect_account_id: Optional[str] = None
    payout_amount: Optional[float] = None
    platform_fee: Optional[float] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    completed_at: Optional[str] = None
    refund_id: Optional[str] = None


class ConnectAccount(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    stripe_account_id: str
    email: Optional[str] = None
    country: Optional[str] = None
    charges_enabled: bool = False
    payouts_enabled: bool = False
    details_submitted: bool = False
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class BondEscrow(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    bond_id: str
    funder_user_id: str
    total_amount: float
    escrowed_amount: float
    released_amount: float = 0
    payout_split: list = []
    status: str = "pending"  # pending, funded, partially_released, fully_released, refunded
    stripe_payment_intent_id: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class CreatePaymentIntentRequest(BaseModel):
    bond_id: str
    amount: float
    currency: str = "usd"


class ConnectAccountRequest(BaseModel):
    email: Optional[str] = None
    country: str = "US"


class ReleaseEscrowRequest(BaseModel):
    bond_id: str
    payout_instructions: Optional[list] = None


class RefundRequest(BaseModel):
    bond_id: str
    reason: str = ""


# ==================== ENDPOINTS ====================

@payments_router.post("/create-intent")
async def create_payment_intent(req: CreatePaymentIntentRequest):
    from server import db
    from auth import require_user

    if not STRIPE_AVAILABLE:
        raise HTTPException(503, "Payment processing not available")

    bond = await db.bonds.find_one({"id": req.bond_id})
    if not bond:
        raise HTTPException(404, "Bond not found")

    amount_cents = int(req.amount * 100)

    try:
        intent = stripe.PaymentIntent.create(
            amount=amount_cents,
            currency=req.currency,
            metadata={
                "bond_id": req.bond_id,
                "platform": "pledgebond",
            },
        )

        payment = PaymentIntent(
            bond_id=req.bond_id,
            user_id="",
            amount=req.amount,
            currency=req.currency,
            stripe_payment_intent_id=intent.id,
            stripe_client_secret=intent.client_secret,
            status="pending",
        )
        await db.payments.insert_one(payment.model_dump())

        return {
            "client_secret": intent.client_secret,
            "payment_id": payment.id,
            "amount": req.amount,
        }
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error: {e}")
        raise HTTPException(400, f"Payment failed: {str(e)}")


@payments_router.post("/connect/account")
async def create_connect_account(req: ConnectAccountRequest):
    from server import db
    from auth import require_user

    if not STRIPE_AVAILABLE:
        raise HTTPException(503, "Stripe not available")

    user = await require_user()

    try:
        account = stripe.Account.create(
            type="express",
            country=req.country,
            email=req.email,
            capabilities={
                "card_payments": {"requested": True},
                "transfers": {"requested": True},
            },
        )

        connect_account = ConnectAccount(
            user_id=user["id"],
            stripe_account_id=account.id,
            email=req.email,
            country=req.country,
        )
        await db.connect_accounts.insert_one(connect_account.model_dump())

        account_link = stripe.AccountLink.create(
            account=account.id,
            refresh_url=f"{os.environ.get('FRONTEND_URL', 'http://localhost:3000')}/settings/connect",
            return_url=f"{os.environ.get('FRONTEND_URL', 'http://localhost:3000')}/settings/connect/success",
            type="account_onboarding",
        )

        return {
            "account_id": account.id,
            "onboarding_url": account_link.url,
        }
    except stripe.error.StripeError as e:
        logger.error(f"Stripe Connect error: {e}")
        raise HTTPException(400, f"Connect account creation failed: {str(e)}")


@payments_router.post("/escrow/fund")
async def fund_escrow(req: dict):
    from server import db

    if not STRIPE_AVAILABLE:
        raise HTTPException(503, "Payment processing not available")

    bond = await db.bonds.find_one({"id": req.get("bond_id")})
    if not bond:
        raise HTTPException(404, "Bond not found")

    amount = bond["funder_amount"]
    amount_cents = int(amount * 100)

    try:
        intent = stripe.PaymentIntent.create(
            amount=amount_cents,
            currency="usd",
            metadata={
                "bond_id": bond["id"],
                "type": "escrow",
                "platform": "pledgebond",
            },
        )

        escrow = BondEscrow(
            bond_id=bond["id"],
            funder_user_id=req.get("user_id", ""),
            total_amount=amount,
            escrowed_amount=amount,
            payout_split=bond.get("payout_split", []),
            status="funded",
            stripe_payment_intent_id=intent.id,
        )
        await db.escrows.insert_one(escrow.model_dump())

        return {
            "client_secret": intent.client_secret,
            "escrow_id": escrow.id,
            "amount": amount,
        }
    except stripe.error.StripeError as e:
        logger.error(f"Escrow funding error: {e}")
        raise HTTPException(400, f"Escrow funding failed: {str(e)}")


@payments_router.post("/escrow/release")
async def release_escrow(req: ReleaseEscrowRequest):
    from server import db

    if not STRIPE_AVAILABLE:
        raise HTTPException(503, "Payment processing not available")

    escrow = await db.escrows.find_one({"bond_id": req.bond_id, "status": "funded"})
    if not escrow:
        raise HTTPException(404, "No funded escrow found for this bond")

    bond = await db.bonds.find_one({"id": req.bond_id})
    if not bond or bond["status"] != "released":
        raise HTTPException(400, "Bond must be in released status to release escrow")

    payout_split = req.payout_instructions or bond.get("payout_split", [])

    transfers = []
    for pocket in payout_split:
        amount = escrow["escrowed_amount"] * (pocket["percent"] / 100)
        transfers.append({
            "label": pocket["label"],
            "amount": amount,
        })

    try:
        for transfer in transfers:
            amount_cents = int(transfer["amount"] * 100)
            if amount_cents > 0:
                stripe.PaymentIntent.capture(escrow["stripe_payment_intent_id"])

        escrow["status"] = "fully_released"
        escrow["released_amount"] = escrow["escrowed_amount"]
        escrow["updated_at"] = datetime.now(timezone.utc).isoformat()
        await db.escrows.replace_one({"_id": escrow["_id"]}, escrow)

        return {
            "status": "released",
            "total_released": escrow["released_amount"],
            "transfers": transfers,
        }
    except stripe.error.StripeError as e:
        logger.error(f"Escrow release error: {e}")
        raise HTTPException(400, f"Escrow release failed: {str(e)}")


@payments_router.post("/refund")
async def refund_payment(req: RefundRequest):
    from server import db

    if not STRIPE_AVAILABLE:
        raise HTTPException(503, "Payment processing not available")

    escrow = await db.escrows.find_one({"bond_id": req.bond_id})
    if not escrow:
        raise HTTPException(404, "No escrow found for this bond")

    if escrow["status"] == "fully_released":
        raise HTTPException(400, "Cannot refund a fully released escrow")

    try:
        refund = stripe.Refund.create(
            payment_intent=escrow["stripe_payment_intent_id"],
        )

        escrow["status"] = "refunded"
        escrow["refund_id"] = refund.id
        escrow["updated_at"] = datetime.now(timezone.utc).isoformat()
        await db.escrows.replace_one({"_id": escrow["_id"]}, escrow)

        return {
            "status": "refunded",
            "refund_id": refund.id,
            "amount": escrow["escrowed_amount"],
        }
    except stripe.error.StripeError as e:
        logger.error(f"Refund error: {e}")
        raise HTTPException(400, f"Refund failed: {str(e)}")


@payments_router.get("/status/{bond_id}")
async def get_payment_status(bond_id: str):
    from server import db

    escrow = await db.escrows.find_one({"bond_id": bond_id})
    if not escrow:
        return {"status": "no_escrow", "bond_id": bond_id}

    escrow.pop("_id", None)
    return escrow


@payments_router.post("/webhook")
async def stripe_webhook():
    from server import db

    if not STRIPE_AVAILABLE:
        raise HTTPException(503, "Stripe not available")

    return {"received": True}


async def ensure_payment_indexes(db):
    await db.payments.create_index("bond_id")
    await db.payments.create_index("user_id")
    await db.payments.create_index("stripe_payment_intent_id", unique=True, sparse=True)
    await db.connect_accounts.create_index("user_id", unique=True)
    await db.connect_accounts.create_index("stripe_account_id", unique=True)
    await db.escrows.create_index("bond_id", unique=True)
    await db.escrows.create_index("funder_user_id")
    await db.escrows.create_index("status")
