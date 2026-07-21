from fastapi import FastAPI, APIRouter, HTTPException, WebSocket, WebSocketDisconnect, Response
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Literal
import uuid
from datetime import datetime, timezone, timedelta

from auth import auth_router, require_user, get_current_user, ensure_auth_indexes
from websocket_manager import manager, ws_endpoint, emit_bond_event as _emit_bond_event_real
from storage import storage_router
from payments import payments_router, ensure_payment_indexes
from referrals import referrals_router, ensure_referral_indexes
from leaderboards import leaderboards_router, ensure_leaderboard_indexes
from templates import templates_router, ensure_template_indexes, seed_default_templates


# ============================================================
# FEATURE FLAGS \u2014 read from env, default OFF
# ============================================================
def _flag(name: str, default: str = "0") -> bool:
    return os.environ.get(name, default).strip().lower() in ("1", "true", "yes", "on")


FEATURES = {
    "auth": _flag("ENABLE_AUTH"),
    "payments": _flag("ENABLE_PAYMENTS"),
    "websockets": _flag("ENABLE_WEBSOCKETS"),
    # Referrals + leaderboards default ON for the contest build — they're the
    # viral + engagement hooks. Flip off via ENABLE_REFERRALS=0 if needed.
    "referrals": _flag("ENABLE_REFERRALS", "1"),
    "leaderboards": _flag("ENABLE_LEADERBOARDS", "1"),
    "templates": _flag("ENABLE_TEMPLATES"),
    "storage": _flag("ENABLE_STORAGE"),
}


async def emit_bond_event(bond_id: str, event_type: str, data: dict):
    """No-op wrapper. Only broadcasts when websockets feature is enabled."""
    if not FEATURES["websockets"]:
        return
    try:
        await _emit_bond_event_real(bond_id, event_type, data)
    except Exception as e:
        # Never let ws errors break the core flow
        logging.getLogger(__name__).warning("emit_bond_event failed: %s", e)


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI(title="Pledgebond API")
api_router = APIRouter(prefix="/api")


# ==================== MODELS ====================

class PayoutPocket(BaseModel):
    label: str
    percent: int  # 0-100


class TaskRequirement(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: Optional[str] = ""
    task_type: Literal["binary", "threshold_percent", "timed_ranked"] = "binary"
    verification: Literal["self_report", "photo_upload", "numeric"] = "self_report"
    target: Optional[float] = None  # e.g. minutes for timed, count for numeric, % for threshold
    unit: Optional[str] = ""


class Participant(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    display_name: str
    initials: str = ""
    color: str = "#7B1730"
    joined_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    completed_tasks: List[str] = []  # list of task_ids completed
    score: float = 0.0  # for timed_ranked


class Proof(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    participant_id: str
    task_id: str
    kind: Literal["self", "photo", "numeric"] = "self"
    note: Optional[str] = ""
    numeric_value: Optional[float] = None
    image_data_url: Optional[str] = None  # base64 for demo
    submitted_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class Witness(BaseModel):
    """Zero-friction observer — no pledge required. The viral-growth tier."""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    display_name: str
    initials: str = ""
    color: str = "#1F6B4E"
    joined_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class Notification(BaseModel):
    """In-app notification. Keyed by demo session name (or user id when auth on)."""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    owner_key: str  # demo display name or user id — who this notification is for
    bond_id: str
    bond_title: str = ""
    kind: Literal[
        "witness_joined", "proof_submitted", "bond_activated",
        "bond_released", "bond_failed", "deadline_24h", "deadline_1h"
    ]
    message: str
    read: bool = False
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class PledgeBond(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str = ""
    category: Literal["individual", "corporate", "football"] = "individual"
    cause_name: str = ""
    cause_link: Optional[str] = ""
    funder_name: str = ""
    funder_amount: float
    activation_threshold: float  # amount of fundee pool needed
    fundee_pledge_amount: float
    deadline: str  # ISO datetime
    status: Literal["draft", "pending", "active", "failed", "released"] = "pending"
    task_requirements: List[TaskRequirement] = []
    participants: List[Participant] = []
    witnesses: List[Witness] = []
    proofs: List[Proof] = []
    payout_split: List[PayoutPocket] = []
    completion_target_percent: int = 70  # % of participants that must complete all tasks
    seal_style: Literal["burgundy", "gold", "emerald"] = "burgundy"
    cover_emoji: str = ""
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class PledgeBondCreate(BaseModel):
    title: str
    description: str = ""
    category: Literal["individual", "corporate", "football"] = "individual"
    cause_name: str = ""
    cause_link: Optional[str] = ""
    funder_name: str = ""
    funder_amount: float
    activation_threshold: float
    fundee_pledge_amount: float
    deadline: str
    task_requirements: List[TaskRequirement] = []
    payout_split: List[PayoutPocket] = []
    completion_target_percent: int = 70
    seal_style: Literal["burgundy", "gold", "emerald"] = "burgundy"
    cover_emoji: str = ""


class JoinRequest(BaseModel):
    display_name: str
    color: Optional[str] = "#7B1730"


class WitnessRequest(BaseModel):
    display_name: str
    color: Optional[str] = "#1F6B4E"


class ProofSubmit(BaseModel):
    participant_id: str
    task_id: str
    kind: Literal["self", "photo", "numeric"] = "self"
    note: Optional[str] = ""
    numeric_value: Optional[float] = None
    image_data_url: Optional[str] = None


# ==================== HELPERS ====================

def _initials(name: str) -> str:
    parts = [p for p in name.strip().split() if p]
    if not parts:
        return "?"
    if len(parts) == 1:
        return parts[0][:2].upper()
    return (parts[0][0] + parts[-1][0]).upper()


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _compute_status(bond: dict) -> str:
    """Given a bond dict, compute the current status based on rules (used for lazy transitions)."""
    status = bond.get("status", "pending")
    if status in ("released", "failed", "draft"):
        return status
    now = datetime.now(timezone.utc)
    try:
        deadline = datetime.fromisoformat(bond["deadline"].replace("Z", "+00:00"))
    except Exception:
        deadline = now + timedelta(days=7)
    total_pledged = len(bond.get("participants", [])) * bond.get("fundee_pledge_amount", 0)
    threshold = bond.get("activation_threshold", 0)
    if status == "pending":
        if total_pledged >= threshold:
            return "active"
        if now >= deadline:
            return "failed"
    elif status == "active":
        if now >= deadline:
            # check completion
            if _completion_met(bond):
                return "released"
            return "failed"
    return status


def _completion_met(bond: dict) -> bool:
    tasks = bond.get("task_requirements", [])
    parts = bond.get("participants", [])
    if not parts or not tasks:
        return False
    target_percent = bond.get("completion_target_percent", 70)
    completed_count = 0
    for p in parts:
        done = set(p.get("completed_tasks", []))
        if all(t["id"] in done for t in tasks):
            completed_count += 1
    ratio = completed_count / len(parts)
    return (ratio * 100) >= target_percent


async def _persist(bond: dict):
    bond["updated_at"] = _now_iso()
    await db.bonds.replace_one({"id": bond["id"]}, bond)


def _clean(bond: dict) -> dict:
    if "_id" in bond:
        bond.pop("_id")
    return bond


# ==================== NOTIFICATIONS ====================

async def _notify(bond: dict, kind: str, message: str, owner_key: str):
    """Create a notification for a specific owner (demo name or user id)."""
    try:
        notif = Notification(
            owner_key=owner_key,
            bond_id=bond["id"],
            bond_title=bond.get("title", ""),
            kind=kind,
            message=message,
        )
        await db.notifications.insert_one(notif.model_dump())
    except Exception as e:
        logging.getLogger(__name__).warning("notify failed: %s", e)


async def _notify_bond_actor(bond: dict, kind: str, message: str, actor_name: str):
    """Notify the bond's funder_name (creator) about an event from actor_name."""
    creator = (bond.get("funder_name") or "").strip()
    if creator and creator.lower() != (actor_name or "").lower():
        await _notify(bond, kind, message, creator)


async def _notify_witnesses(bond: dict, kind: str, message: str, exclude_name: str = ""):
    """Notify all witnesses of a bond event."""
    for w in bond.get("witnesses", []):
        name = (w.get("display_name") or "").strip()
        if name and name.lower() != (exclude_name or "").lower():
            await _notify(bond, kind, message, name)


async def _notify_participants(bond: dict, kind: str, message: str, exclude_name: str = ""):
    """Notify all participants of a bond event."""
    for p in bond.get("participants", []):
        name = (p.get("display_name") or "").strip()
        if name and name.lower() != (exclude_name or "").lower():
            await _notify(bond, kind, message, name)


# ==================== ENDPOINTS ====================

@api_router.get("/")
async def root():
    return {"message": "Pledgebond API"}


# Public config endpoint \u2014 frontend reads this at boot to know which UI to render
@api_router.get("/config")
async def get_config():
    return {
        "features": FEATURES,
        "demo_mode": not FEATURES["auth"],
    }


@api_router.get("/bonds", response_model=List[PledgeBond])
async def list_bonds(status: Optional[str] = None, category: Optional[str] = None):
    query = {}
    if status:
        query["status"] = status
    if category:
        query["category"] = category
    bonds = await db.bonds.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)
    # Lazy transition status
    updated = []
    for b in bonds:
        new_status = _compute_status(b)
        if new_status != b["status"]:
            b["status"] = new_status
            await _persist(b)
        updated.append(b)
    return updated


@api_router.get("/bonds/{bond_id}", response_model=PledgeBond)
async def get_bond(bond_id: str):
    bond = await db.bonds.find_one({"id": bond_id}, {"_id": 0})
    if not bond:
        raise HTTPException(404, "Bond not found")
    new_status = _compute_status(bond)
    if new_status != bond["status"]:
        bond["status"] = new_status
        await _persist(bond)
    return bond


@api_router.post("/bonds", response_model=PledgeBond)
async def create_bond(input: PledgeBondCreate):
    # Default payout split if empty
    payout = input.payout_split or [
        PayoutPocket(label="Cause A", percent=50),
        PayoutPocket(label="Cause B", percent=25),
        PayoutPocket(label="Top 5", percent=20),
        PayoutPocket(label="Platform", percent=5),
    ]
    bond = PledgeBond(
        title=input.title,
        description=input.description,
        category=input.category,
        cause_name=input.cause_name,
        cause_link=input.cause_link,
        funder_name=input.funder_name,
        funder_amount=input.funder_amount,
        activation_threshold=input.activation_threshold,
        fundee_pledge_amount=input.fundee_pledge_amount,
        deadline=input.deadline,
        task_requirements=input.task_requirements,
        payout_split=payout,
        completion_target_percent=input.completion_target_percent,
        seal_style=input.seal_style,
        cover_emoji=input.cover_emoji,
        status="pending",
    )
    doc = bond.model_dump()
    await db.bonds.insert_one(doc)
    return bond


@api_router.post("/bonds/{bond_id}/join", response_model=PledgeBond)
async def join_bond(bond_id: str, req: JoinRequest):
    bond = await db.bonds.find_one({"id": bond_id}, {"_id": 0})
    if not bond:
        raise HTTPException(404, "Bond not found")
    if bond["status"] not in ("pending", "active"):
        raise HTTPException(400, f"Cannot join a {bond['status']} bond")

    participant = Participant(
        display_name=req.display_name,
        initials=_initials(req.display_name),
        color=req.color or "#7B1730",
    )
    bond["participants"].append(participant.model_dump())

    # Auto-transition to active if threshold reached
    total_pledged = len(bond["participants"]) * bond["fundee_pledge_amount"]
    if bond["status"] == "pending" and total_pledged >= bond["activation_threshold"]:
        bond["status"] = "active"
        await emit_bond_event(bond_id, "bond_activated", {"bond_id": bond_id})
        btitle = bond["title"]
        await _notify_witnesses(bond, "bond_activated", f'"{btitle}" is now sealed and active!')
        await _notify_participants(bond, "bond_activated", f'"{btitle}" is now sealed and active!', exclude_name=req.display_name)

    await _persist(bond)
    await emit_bond_event(bond_id, "participant_joined", {
        "bond_id": bond_id,
        "participant": participant.model_dump(),
        "total_participants": len(bond["participants"]),
    })
    # Notify the bond creator that someone joined
    btitle = bond["title"]
    pledge_amt = bond["fundee_pledge_amount"]
    await _notify_bond_actor(bond, "witness_joined", f"{req.display_name} pledged ${pledge_amt} to \"{btitle}\"", req.display_name)
    return bond


@api_router.post("/bonds/{bond_id}/witness", response_model=PledgeBond)
async def witness_bond(bond_id: str, req: WitnessRequest):
    """Zero-friction witness tier — no pledge required. The viral-growth entry point."""
    bond = await db.bonds.find_one({"id": bond_id}, {"_id": 0})
    if not bond:
        raise HTTPException(404, "Bond not found")
    if bond["status"] not in ("pending", "active"):
        raise HTTPException(400, f"Cannot witness a {bond['status']} bond")
    # Prevent duplicate witness by display name
    existing = [w for w in bond.get("witnesses", []) if (w.get("display_name") or "").lower() == req.display_name.lower()]
    if existing:
        return bond  # idempotent — already witnessing

    witness = Witness(
        display_name=req.display_name,
        initials=_initials(req.display_name),
        color=req.color or "#1F6B4E",
    )
    bond.setdefault("witnesses", []).append(witness.model_dump())
    await _persist(bond)
    await emit_bond_event(bond_id, "witness_joined", {
        "bond_id": bond_id,
        "witness": witness.model_dump(),
        "total_witnesses": len(bond["witnesses"]),
    })
    btitle = bond["title"]
    await _notify_bond_actor(bond, "witness_joined", f'{req.display_name} is now witnessing "{btitle}"', req.display_name)
    return bond


@api_router.post("/bonds/{bond_id}/proof", response_model=PledgeBond)
async def submit_proof(bond_id: str, req: ProofSubmit):
    bond = await db.bonds.find_one({"id": bond_id}, {"_id": 0})
    if not bond:
        raise HTTPException(404, "Bond not found")
    if bond["status"] != "active":
        raise HTTPException(400, f"Can only submit proof on active bonds (current: {bond['status']})")

    # find participant
    participant = next((p for p in bond["participants"] if p["id"] == req.participant_id), None)
    if not participant:
        raise HTTPException(404, "Participant not found in this bond")

    # find task
    task = next((t for t in bond["task_requirements"] if t["id"] == req.task_id), None)
    if not task:
        raise HTTPException(404, "Task not found")

    # record proof
    proof = Proof(
        participant_id=req.participant_id,
        task_id=req.task_id,
        kind=req.kind,
        note=req.note or "",
        numeric_value=req.numeric_value,
        image_data_url=req.image_data_url,
    )
    bond["proofs"].append(proof.model_dump())

    # mark task complete for participant (auto-approve)
    if req.task_id not in participant["completed_tasks"]:
        participant["completed_tasks"].append(req.task_id)

    # add score for timed_ranked / numeric
    if req.numeric_value is not None:
        participant["score"] = float(participant.get("score", 0)) + float(req.numeric_value)

    await _persist(bond)
    await emit_bond_event(bond_id, "proof_submitted", {
        "bond_id": bond_id,
        "participant_id": req.participant_id,
        "task_id": req.task_id,
        "proof": proof.model_dump(),
    })
    # Notify creator + witnesses that proof was submitted
    actor_name = participant.get("display_name", "Someone")
    task_title = task.get("title", "a clause")
    btitle = bond["title"]
    proof_msg = f'{actor_name} logged proof for "{task_title}" on "{btitle}"'
    await _notify_bond_actor(bond, "proof_submitted", proof_msg, actor_name)
    await _notify_witnesses(bond, "proof_submitted", proof_msg, exclude_name=actor_name)
    return bond


@api_router.post("/bonds/{bond_id}/release", response_model=PledgeBond)
async def release_bond(bond_id: str):
    """Manually trigger release check. If completion is met, mark released. Else mark failed."""
    bond = await db.bonds.find_one({"id": bond_id}, {"_id": 0})
    if not bond:
        raise HTTPException(404, "Bond not found")
    if bond["status"] != "active":
        raise HTTPException(400, f"Bond is {bond['status']}, cannot release now")
    btitle = bond["title"]
    if _completion_met(bond):
        bond["status"] = "released"
        await emit_bond_event(bond_id, "bond_released", {"bond_id": bond_id})
        release_msg = f'"{btitle}" was released — the vault is open!'
        await _notify_witnesses(bond, "bond_released", release_msg)
        await _notify_participants(bond, "bond_released", release_msg)
        await _notify_bond_actor(bond, "bond_released", release_msg, "")
    else:
        bond["status"] = "failed"
        await emit_bond_event(bond_id, "bond_failed", {"bond_id": bond_id})
        fail_msg = f'"{btitle}" was broken — the bond failed.'
        await _notify_witnesses(bond, "bond_failed", fail_msg)
        await _notify_participants(bond, "bond_failed", fail_msg)
        await _notify_bond_actor(bond, "bond_failed", fail_msg, "")
    await _persist(bond)
    return bond


@api_router.post("/bonds/{bond_id}/reset", response_model=PledgeBond)
async def reset_bond(bond_id: str):
    """Demo helper: clear participants/proofs & set back to pending. Not for production."""
    bond = await db.bonds.find_one({"id": bond_id}, {"_id": 0})
    if not bond:
        raise HTTPException(404, "Bond not found")
    bond["participants"] = []
    bond["proofs"] = []
    bond["status"] = "pending"
    await _persist(bond)
    return bond


@api_router.delete("/bonds/{bond_id}")
async def delete_bond(bond_id: str):
    res = await db.bonds.delete_one({"id": bond_id})
    return {"deleted": res.deleted_count}


# ==================== NOTIFICATIONS ENDPOINTS ====================

@api_router.get("/notifications")
async def list_notifications(owner: str, limit: int = 50):
    """Get notifications for a demo session name (or user id when auth on)."""
    if not owner:
        raise HTTPException(400, "owner query param required")
    notifs = await db.notifications.find(
        {"owner_key": owner}, {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    return notifs


@api_router.post("/notifications/read")
async def mark_notifications_read(owner: str, ids: Optional[str] = None):
    """Mark notifications as read. If ids omitted, marks all for the owner."""
    if not owner:
        raise HTTPException(400, "owner query param required")
    query = {"owner_key": owner}
    if ids:
        id_list = [i.strip() for i in ids.split(",") if i.strip()]
        query["id"] = {"$in": id_list}
    await db.notifications.update_many(query, {"$set": {"read": True}})
    return {"updated": True}


@api_router.get("/notifications/unread-count")
async def unread_count(owner: str):
    """Quick poll for the bell badge."""
    if not owner:
        raise HTTPException(400, "owner query param required")
    count = await db.notifications.count_documents({"owner_key": owner, "read": False})
    return {"count": count}


# ==================== PROOF FEED ====================

@api_router.get("/proofs")
async def proof_feed(limit: int = 50):
    """Cross-bond feed of recent proof submissions — the 'content' that makes
    browsing addictive. Returns enriched proof records with bond context."""
    bonds = await db.bonds.find({"proofs.0": {"$exists": True}}, {"_id": 0}).to_list(200)
    items = []
    for b in bonds:
        for p in b.get("proofs", []):
            # find participant name
            part = next((pp for pp in b.get("participants", []) if pp["id"] == p["participant_id"]), None)
            task = next((t for t in b.get("task_requirements", []) if t["id"] == p["task_id"]), None)
            items.append({
                "id": p["id"],
                "bond_id": b["id"],
                "bond_title": b.get("title", ""),
                "seal_style": b.get("seal_style", "burgundy"),
                "bond_status": b.get("status", "pending"),
                "participant_id": p["participant_id"],
                "participant_name": part.get("display_name", "") if part else "",
                "participant_color": part.get("color", "#7B1730") if part else "#7B1730",
                "participant_initials": part.get("initials", "?") if part else "?",
                "task_id": p["task_id"],
                "task_title": task.get("title", "") if task else "",
                "kind": p.get("kind", "self"),
                "note": p.get("note", ""),
                "numeric_value": p.get("numeric_value"),
                "submitted_at": p.get("submitted_at", ""),
                "cause_name": b.get("cause_name", ""),
                "funder_amount": b.get("funder_amount", 0),
            })
    items.sort(key=lambda x: x["submitted_at"], reverse=True)
    return items[:limit]


# ==================== DEADLINE SWEEP ====================

async def _deadline_sweep():
    """Generate deadline-approaching notifications for bonds near their deadline.
    Called on startup and periodically. Idempotent — won't spam duplicates."""
    now = datetime.now(timezone.utc)
    bonds = await db.bonds.find({"status": {"$in": ["pending", "active"]}}, {"_id": 0}).to_list(500)
    for b in bonds:
        try:
            deadline = datetime.fromisoformat(b["deadline"].replace("Z", "+00:00"))
        except Exception:
            continue
        remaining = deadline - now
        hours_left = remaining.total_seconds() / 3600
        btitle = b["title"]
        # 24h warning
        if 0 < hours_left <= 24:
            # check if we already sent a 24h notification
            existing = await db.notifications.find_one({
                "bond_id": b["id"], "kind": "deadline_24h"
            })
            if not existing:
                msg = f'"{btitle}" — less than 24 hours until the deadline!'
                await _notify_witnesses(b, "deadline_24h", msg)
                await _notify_participants(b, "deadline_24h", msg)
                await _notify_bond_actor(b, "deadline_24h", msg, "")
        # 1h warning
        if 0 < hours_left <= 1:
            existing = await db.notifications.find_one({
                "bond_id": b["id"], "kind": "deadline_1h"
            })
            if not existing:
                msg = f'"{btitle}" — less than 1 hour until the deadline!'
                await _notify_witnesses(b, "deadline_1h", msg)
                await _notify_participants(b, "deadline_1h", msg)
                await _notify_bond_actor(b, "deadline_1h", msg, "")


# ==================== OG CARD ENDPOINTS ====================

@api_router.get("/bonds/{bond_id}/card.png")
async def get_bond_card_png(bond_id: str):
    """Generate and return a shareable OG card PNG for a bond."""
    bond = await db.bonds.find_one({"id": bond_id}, {"_id": 0})
    if not bond:
        raise HTTPException(404, "Bond not found")
    # Lazy status update
    new_status = _compute_status(bond)
    if new_status != bond["status"]:
        bond["status"] = new_status
        await _persist(bond)
    try:
        from og_cards import render_bond_card
        png_bytes = render_bond_card(bond)
        return Response(content=png_bytes, media_type="image/png", headers={
            "Cache-Control": "public, max-age=300",
        })
    except Exception as e:
        logger.warning("OG card render failed: %s", e)
        raise HTTPException(500, "Could not render card")


@api_router.get("/bonds/{bond_id}/og")
async def get_bond_og_meta(bond_id: str):
    """Return OG metadata for a bond — used for dynamic meta tag injection."""
    bond = await db.bonds.find_one({"id": bond_id}, {"_id": 0})
    if not bond:
        raise HTTPException(404, "Bond not found")
    new_status = _compute_status(bond)
    if new_status != bond["status"]:
        bond["status"] = new_status
        await _persist(bond)
    frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:3000")
    card_url = f"{frontend_url}/api/bonds/{bond_id}/card.png"
    bond_url = f"{frontend_url}/bond/{bond_id}"
    title = bond.get("title", "Pledgebond")
    description = bond.get("description", "A pledge is a sealed contract.")
    cause = bond.get("cause_name", "")
    og_description = f"{description}"
    if cause:
        og_description += f" In benefit of {cause}."
    participant_count = len(bond.get("participants", []))
    witness_count = len(bond.get("witnesses", []))
    og_description += f" {participant_count} pledged, {witness_count} witnessing."
    return {
        "og:title": f"{title} — Pledgebond",
        "og:description": og_description,
        "og:image": card_url,
        "og:url": bond_url,
        "og:type": "website",
        "og:image:width": 1200,
        "og:image:height": 630,
        "twitter:card": "summary_large_image",
        "twitter:title": f"{title} — Pledgebond",
        "twitter:description": og_description,
        "twitter:image": card_url,
    }


# ==================== SEED ====================

async def _seed_bonds():
    count = await db.bonds.count_documents({})
    if count > 0:
        return
    logger.info("Seeding demo bonds...")
    now = datetime.now(timezone.utc)

    def _mk_tasks(items):
        return [TaskRequirement(**t).model_dump() for t in items]

    def _mk_split(pairs):
        return [PayoutPocket(label=l, percent=p).model_dump() for l, p in pairs]

    def _mk_participants(names):
        colors = ["#7B1730", "#A77D2A", "#1F6B4E", "#2B4A66", "#B86B1E", "#8B1E2D"]
        out = []
        for i, n in enumerate(names):
            out.append(Participant(
                display_name=n,
                initials=_initials(n),
                color=colors[i % len(colors)],
            ).model_dump())
        return out

    # Bond 1 — FOOTBALL BOND: "HERE WE GO" — seal your football pledge (shown first)
    b1 = PledgeBond(
        title="HERE WE GO: 30-Day Football Fitness Pledge",
        description="Seal your vow like a transfer deal. Pledge to hit your fitness goal in 30 days — run 5K, hit the gym 3x/week, or beat your sprint time. Your crew witnesses it. Miss the deadline and everyone sees the L. HERE WE GO.",
        category="football",
        cause_name="Grassroots Football Academy",
        cause_link="",
        funder_name="Sunday League Captain",
        funder_amount=2000,
        activation_threshold=300,
        fundee_pledge_amount=15,
        deadline=(now + timedelta(days=30)).isoformat(),
        status="pending",
        task_requirements=_mk_tasks([
            {"title": "Log first training session", "task_type": "binary", "verification": "self_report"},
            {"title": "Weekly check-in (4 weeks)", "task_type": "binary", "verification": "self_report"},
            {"title": "Upload 5K run time", "task_type": "timed_ranked", "verification": "numeric", "target": 1800, "unit": "sec"},
            {"title": "Photo proof at finish line", "task_type": "binary", "verification": "photo_upload"},
        ]),
        participants=_mk_participants(["Marco R.", "Diego S.", "Luca B.", "Thiago M.", "Kofi A.", "Ravi N.", "Sam K.", "Jules T."]),
        payout_split=_mk_split([("Grassroots Academy", 60), ("Kit Fund", 25), ("Top Finishers", 10), ("Platform Fee", 5)]),
        completion_target_percent=70,
        seal_style="burgundy",
        cover_emoji="\u26BD",  # soccer ball
    ).model_dump()
    await db.bonds.insert_one(b1)

    # Bond 2 — PENDING, half-filled seal (individual challenge)
    b2 = PledgeBond(
        title="5-Hour Hula Hoop Endurance",
        description="Community endurance challenge: keep the hoop up for a full 5-hour window on livestream. Every ring drop resets your timer.",
        category="individual",
        cause_name="Children's Music Therapy Fund",
        cause_link="",
        funder_name="Anonymous Patron",
        funder_amount=5000,
        activation_threshold=800,
        fundee_pledge_amount=25,
        deadline=(now + timedelta(days=6)).isoformat(),
        status="pending",
        task_requirements=_mk_tasks([
            {"title": "Log start time", "task_type": "binary", "verification": "self_report"},
            {"title": "Upload photo mid-challenge", "task_type": "binary", "verification": "photo_upload"},
            {"title": "Record final duration (minutes)", "task_type": "timed_ranked", "verification": "numeric", "target": 300, "unit": "min"},
        ]),
        participants=_mk_participants(["Ada L.", "Marcus V.", "Priya S.", "Ivan K.", "Zoe M.", "Ben T.", "Chika O.", "Ren I.", "Kai P.", "Nia F.", "Sofia R.", "Dara K.", "Elias B.", "Mira J."]),
        payout_split=_mk_split([("Music Therapy Fund", 50), ("Local Studios", 25), ("Top 5 Hoopers", 20), ("Platform Fee", 5)]),
        completion_target_percent=70,
        seal_style="burgundy",
        cover_emoji="\U0001FA90",  # ringed planet as placeholder / neutral
    ).model_dump()
    await db.bonds.insert_one(b1)

    # Bond 2 — ACTIVE, some tasks completed already (corporate program)
    b2 = PledgeBond(
        title="Team Streak: 21-Day Habit Sprint",
        description="Our whole team pledges to hit a 21-day daily-check-in streak. If 80% of us make it, the bond releases to the cause.",
        category="corporate",
        cause_name="Ocean Cleanup Coalition",
        cause_link="",
        funder_name="Fernbrook Studio",
        funder_amount=15000,
        activation_threshold=1200,
        fundee_pledge_amount=50,
        deadline=(now + timedelta(days=3, hours=12)).isoformat(),
        status="active",
        task_requirements=_mk_tasks([
            {"title": "Day 7 check-in", "task_type": "binary", "verification": "self_report"},
            {"title": "Day 14 check-in", "task_type": "binary", "verification": "self_report"},
            {"title": "Day 21 photo proof", "task_type": "binary", "verification": "photo_upload"},
        ]),
        participants=_mk_participants(["Alex H.", "Bea R.", "Carlos M.", "Dana W.", "Emi T.", "Farid J.", "Gaia K.", "Hana Y.", "Ivo L.", "Jules P.", "Kim S.", "Leo D.", "Mona F.", "Nils B.", "Ola N.", "Pia Q.", "Quin H.", "Rex A.", "Sena C.", "Tom V.", "Uma R.", "Vera O.", "Wren G.", "Xin Z."]),
        payout_split=_mk_split([("Ocean Cleanup", 60), ("Beach Restoration", 25), ("Team Bonus", 10), ("Platform Fee", 5)]),
        completion_target_percent=80,
        seal_style="emerald",
        cover_emoji="\U0001F30A",  # wave
    ).model_dump()
    # Simulate progress: mark 12 of 24 participants as having completed all 3 tasks
    task_ids = [t["id"] for t in b2["task_requirements"]]
    for i, p in enumerate(b2["participants"]):
        if i < 12:
            p["completed_tasks"] = list(task_ids)
        elif i < 18:
            p["completed_tasks"] = task_ids[:2]
        else:
            p["completed_tasks"] = task_ids[:1]
    await db.bonds.insert_one(b2)

    # Bond 3 — ACTIVE, near-release (nearly meets completion threshold, deadline soon)
    b3 = PledgeBond(
        title="Rubik's Cube Sub-30 Solve",
        description="Ten cubers pledge to record a solve under 30 seconds. Release cracks the vault open for a scholarship fund.",
        category="individual",
        cause_name="STEM Scholarship Fund",
        cause_link="",
        funder_name="Cube Society",
        funder_amount=2500,
        activation_threshold=200,
        fundee_pledge_amount=25,
        deadline=(now + timedelta(hours=18)).isoformat(),
        status="active",
        task_requirements=_mk_tasks([
            {"title": "Record solve time (seconds)", "task_type": "timed_ranked", "verification": "numeric", "target": 30, "unit": "sec"},
            {"title": "Upload video / photo proof", "task_type": "binary", "verification": "photo_upload"},
        ]),
        participants=_mk_participants(["Yuki N.", "Sam P.", "Rani T.", "Diego C.", "Amara U.", "Kaz M.", "Beren D.", "Toma L.", "Isla V.", "Owen G."]),
        payout_split=_mk_split([("STEM Scholarships", 55), ("Cube Society", 25), ("Top 5 Cubers", 15), ("Platform Fee", 5)]),
        completion_target_percent=60,
        seal_style="gold",
        cover_emoji="\U0001F9E9",  # puzzle
    ).model_dump()
    # 8 of 10 done both tasks
    tids = [t["id"] for t in b3["task_requirements"]]
    for i, p in enumerate(b3["participants"]):
        if i < 8:
            p["completed_tasks"] = list(tids)
            p["score"] = 25.0 + i
        else:
            p["completed_tasks"] = tids[:1]
            p["score"] = 32.0 + i
    await db.bonds.insert_one(b3)

    # Bond 4 — PENDING, just launched, few pledges (corporate)
    b4 = PledgeBond(
        title="Chili Ladder: 5-Level Heat Climb",
        description="Contestants ascend a five-level chili challenge. Corporate patron unlocks the vault if the group survives level 4.",
        category="individual",
        cause_name="Community Kitchen Fund",
        cause_link="",
        funder_name="Habanero Holdings",
        funder_amount=3000,
        activation_threshold=400,
        fundee_pledge_amount=20,
        deadline=(now + timedelta(days=9)).isoformat(),
        status="pending",
        task_requirements=_mk_tasks([
            {"title": "Level 1 clear", "task_type": "binary", "verification": "self_report"},
            {"title": "Level 2 clear", "task_type": "binary", "verification": "self_report"},
            {"title": "Level 3 clear", "task_type": "binary", "verification": "photo_upload"},
            {"title": "Level 4 clear", "task_type": "binary", "verification": "photo_upload"},
        ]),
        participants=_mk_participants(["Rio P.", "Otis M.", "Lila C.", "Nate F."]),
        payout_split=_mk_split([("Community Kitchen", 55), ("Local Farmers", 25), ("Survivor Prize", 15), ("Platform Fee", 5)]),
        completion_target_percent=60,
        seal_style="burgundy",
        cover_emoji="\U0001F336",  # chili
    ).model_dump()
    await db.bonds.insert_one(b4)

    # Bond 5 — CONTEST BOND: self-referential "ship my contest entry" pledge
    b5 = PledgeBond(
        title="Ship My Contest Entry by Deadline",
        description="I pledge to ship and submit my Fabrizio Romano x Emergent Builder's Contest entry before the deadline. Witnesses hold me accountable — no last-minute excuses.",
        category="individual",
        cause_name="Builder's Contest $100K Prize Pool",
        cause_link="",
        funder_name="Contest Builder",
        funder_amount=1000,
        activation_threshold=200,
        fundee_pledge_amount=10,
        deadline=(now + timedelta(days=5)).isoformat(),
        status="pending",
        task_requirements=_mk_tasks([
            {"title": "Submit entry to contest page", "task_type": "binary", "verification": "self_report"},
            {"title": "Share entry link with 3 friends", "task_type": "binary", "verification": "self_report"},
            {"title": "Screenshot live submission", "task_type": "binary", "verification": "photo_upload"},
        ]),
        participants=_mk_participants(["Builder A.", "Dev B.", "Maker C."]),
        payout_split=_mk_split([("Prize Celebration", 70), ("Next Project Fund", 25), ("Platform Fee", 5)]),
        completion_target_percent=70,
        seal_style="gold",
        cover_emoji="\U0001F3C6",  # trophy
    ).model_dump()
    await db.bonds.insert_one(b5)

    logger.info("Seeded 6 demo bonds (incl. football + contest bonds).")


app.include_router(api_router)

# ============================================================
# Optional routers \u2014 mounted only when their feature flag is on
# ============================================================
if FEATURES["auth"]:
    app.include_router(auth_router)
if FEATURES["payments"]:
    app.include_router(payments_router)
if FEATURES["referrals"]:
    app.include_router(referrals_router)
if FEATURES["leaderboards"]:
    app.include_router(leaderboards_router)
if FEATURES["templates"]:
    app.include_router(templates_router)
if FEATURES["storage"]:
    app.include_router(storage_router)


if FEATURES["websockets"]:
    @app.websocket("/ws/bonds/{bond_id}")
    async def bond_websocket(websocket: WebSocket, bond_id: str, token: Optional[str] = None):
        user_id = None
        if token and FEATURES["auth"]:
            try:
                from auth import decode_token
                payload = decode_token(token)
                user_id = payload.get("sub")
            except Exception:
                pass
        await ws_endpoint(websocket, bond_id, db, user_id)


app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@app.on_event("startup")
async def on_startup():
    try:
        if FEATURES["auth"]:
            await ensure_auth_indexes(db)
        if FEATURES["payments"]:
            await ensure_payment_indexes(db)
        if FEATURES["referrals"]:
            await ensure_referral_indexes(db)
        if FEATURES["leaderboards"]:
            try:
                await ensure_leaderboard_indexes(db)
            except Exception as e:
                logger.warning("leaderboard indexes: %s", e)
        if FEATURES["templates"]:
            try:
                await ensure_template_indexes(db)
                await seed_default_templates(db)
            except Exception as e:
                logger.warning("template setup: %s", e)
        await _seed_bonds()
        # Run deadline sweep on startup so near-deadline bonds get notifications
        try:
            await _deadline_sweep()
        except Exception as e:
            logger.warning("deadline sweep on startup: %s", e)
        enabled = [k for k, v in FEATURES.items() if v]
        logger.info("Pledgebond ready. Enabled features: %s", enabled or ["(none \u2014 demo mode)"])
    except Exception as e:
        logger.exception("Startup failed: %s", e)


@app.on_event("startup")
async def _start_deadline_sweep_loop():
    """Periodic deadline sweep — every 10 minutes."""
    import asyncio
    async def _loop():
        while True:
            await asyncio.sleep(600)
            try:
                await _deadline_sweep()
            except Exception as e:
                logger.warning("deadline sweep: %s", e)
    asyncio.create_task(_loop())


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
