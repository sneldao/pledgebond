import os
import uuid
import logging
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel, Field

from auth import require_user

logger = logging.getLogger(__name__)

leaderboards_router = APIRouter(prefix="/leaderboards", tags=["leaderboards"])


class LeaderboardEntry(BaseModel):
    rank: int
    user_id: str
    display_name: str
    avatar_url: Optional[str] = None
    score: float
    bonds_completed: int = 0
    trust_score: float = 0.0
    streak: int = 0


class LeaderboardResponse(BaseModel):
    type: str
    entries: List[LeaderboardEntry]
    total: int
    generated_at: str


@leaderboards_router.get("/top-completers")
async def get_top_completers(
    limit: int = Query(50, ge=1, le=100),
    user: dict = Depends(require_user)
):
    from server import db

    # Aggregate completion stats from users
    pipeline = [
        {"$match": {"completion_count": {"$gt": 0}}},
        {"$project": {
            "_id": 0,
            "id": 1,
            "display_name": 1,
            "avatar_url": 1,
            "completion_count": 1,
            "trust_score": 1,
            "streak": 1,
            "score": {"$add": [
                "$completion_count",
                {"$multiply": ["$trust_score", 0.1]},
                {"$multiply": ["$streak", 0.5]}
            ]}
        }},
        {"$sort": {"score": -1}},
        {"$limit": limit}
    ]

    results = await db.users.aggregate(pipeline).to_list(limit)

    entries = []
    for idx, user_doc in enumerate(results, 1):
        entries.append(LeaderboardEntry(
            rank=idx,
            user_id=user_doc["id"],
            display_name=user_doc.get("display_name", "Anonymous"),
            avatar_url=user_doc.get("avatar_url"),
            score=round(user_doc["score"], 2),
            bonds_completed=user_doc.get("completion_count", 0),
            trust_score=round(user_doc.get("trust_score", 0), 2),
            streak=user_doc.get("streak", 0)
        ))

    return LeaderboardResponse(
        type="top_completers",
        entries=entries,
        total=len(entries),
        generated_at=datetime.now(timezone.utc).isoformat()
    )


@leaderboards_router.get("/top-funders")
async def get_top_funders(
    limit: int = Query(50, ge=1, le=100),
    user: dict = Depends(require_user)
):
    from server import db

    # Find users who created bonds and sum their funding
    pipeline = [
        {"$match": {"status": {"$in": ["released", "active", "pending"]}}},
        {"$group": {
            "_id": "$funder_user_id",
            "total_funded": {"$sum": "$funder_amount"},
            "bonds_created": {"$sum": 1},
            "successful_releases": {"$sum": {"$cond": [{"$eq": ["$status", "released"]}, 1, 0]}}
        }},
        {"$lookup": {
            "from": "users",
            "localField": "_id",
            "foreignField": "id",
            "as": "user_info"
        }},
        {"$unwind": "$user_info"},
        {"$project": {
            "_id": 0,
            "user_id": "$_id",
            "display_name": "$user_info.display_name",
            "avatar_url": "$user_info.avatar_url",
            "total_funded": 1,
            "bonds_created": 1,
            "successful_releases": 1,
            "trust_score": "$user_info.trust_score",
            "score": {"$add": [
                {"$divide": ["$total_funded", 100]},
                {"$multiply": ["$successful_releases", 10]},
                "$user_info.trust_score"
            ]}
        }},
        {"$sort": {"score": -1}},
        {"$limit": limit}
    ]

    results = await db.bonds.aggregate(pipeline).to_list(limit)

    entries = []
    for idx, doc in enumerate(results, 1):
        entries.append(LeaderboardEntry(
            rank=idx,
            user_id=doc["user_id"],
            display_name=doc.get("display_name", "Anonymous"),
            avatar_url=doc.get("avatar_url"),
            score=round(doc["score"], 2),
            bonds_completed=doc.get("bonds_created", 0),
            trust_score=round(doc.get("trust_score", 0), 2)
        ))

    return LeaderboardResponse(
        type="top_funders",
        entries=entries,
        total=len(entries),
        generated_at=datetime.now(timezone.utc).isoformat()
    )


@leaderboards_router.get("/trending-bonds")
async def get_trending_bonds(
    limit: int = Query(20, ge=1, le=50),
    user: dict = Depends(require_user)
):
    from server import db

    # Calculate trending score based on recent activity
    pipeline = [
        {"$match": {"status": {"$in": ["pending", "active"]}}},
        {"$project": {
            "_id": 0,
            "id": 1,
            "title": 1,
            "description": 1,
            "status": 1,
            "seal_style": 1,
            "cover_emoji": 1,
            "category": 1,
            "cause_name": 1,
            "funder_amount": 1,
            "fundee_pledge_amount": 1,
            "activation_threshold": 1,
            "deadline": 1,
            "participant_count": {"$size": "$participants"},
            "proof_count": {"$size": "$proofs"},
            "days_remaining": {
                "$divide": [
                    {"$subtract": [
                        {"$toDate": "$deadline"},
                        datetime.now(timezone.utc)
                    ]},
                    86400000  # milliseconds per day
                ]
            },
            "created_at": 1
        }},
        {"$match": {"days_remaining": {"$gt": 0}}},
        {"$project": {
            "id": 1,
            "title": 1,
            "description": 1,
            "status": 1,
            "seal_style": 1,
            "cover_emoji": 1,
            "category": 1,
            "cause_name": 1,
            "funder_amount": 1,
            "fundee_pledge_amount": 1,
            "activation_threshold": 1,
            "deadline": 1,
            "participant_count": 1,
            "proof_count": 1,
            "days_remaining": 1,
            "created_at": 1,
            "trending_score": {
                "$add": [
                    {"$multiply": ["$participant_count", 10]},
                    {"$multiply": ["$proof_count", 5]},
                    {"$divide": [100, {"$max": ["$days_remaining", 1]}]}
                ]
            }
        }},
        {"$sort": {"trending_score": -1}},
        {"$limit": limit}
    ]

    results = await db.bonds.aggregate(pipeline).to_list(limit)

    return {
        "bonds": results,
        "generated_at": datetime.now(timezone.utc).isoformat()
    }


@leaderboards_router.get("/active-streaks")
async def get_active_streaks(
    limit: int = Query(50, ge=1, le=100),
    user: dict = Depends(require_user)
):
    from server import db

    pipeline = [
        {"$match": {"streak": {"$gt": 0}}},
        {"$project": {
            "_id": 0,
            "id": 1,
            "display_name": 1,
            "avatar_url": 1,
            "streak": 1,
            "longest_streak": 1,
            "completion_count": 1,
            "trust_score": 1,
            "score": {"$add": [
                {"$multiply": ["$streak", 2]},
                {"$multiply": ["$longest_streak", 0.5]},
                {"$multiply": ["$trust_score", 0.1]}
            ]}
        }},
        {"$sort": {"score": -1}},
        {"$limit": limit}
    ]

    results = await db.users.aggregate(pipeline).to_list(limit)

    entries = []
    for idx, user_doc in enumerate(results, 1):
        entries.append(LeaderboardEntry(
            rank=idx,
            user_id=user_doc["id"],
            display_name=user_doc.get("display_name", "Anonymous"),
            avatar_url=user_doc.get("avatar_url"),
            score=round(user_doc["score"], 2),
            bonds_completed=user_doc.get("completion_count", 0),
            trust_score=round(user_doc.get("trust_score", 0), 2),
            streak=user_doc.get("streak", 0)
        ))

    return LeaderboardResponse(
        type="active_streaks",
        entries=entries,
        total=len(entries),
        generated_at=datetime.now(timezone.utc).isoformat()
    )


@leaderboards_router.get("/my-rank")
async def get_my_rank(user: dict = Depends(require_user)):
    from server import db

    user_id = user["id"]

    # Get completer rank
    all_completers = await db.users.find(
        {"completion_count": {"$gt": 0}}
    ).sort("completion_count", -1).to_list(1000)

    completer_rank = None
    for idx, u in enumerate(all_completers, 1):
        if u["id"] == user_id:
            completer_rank = idx
            break

    # Get streak rank
    all_streaks = await db.users.find(
        {"streak": {"$gt": 0}}
    ).sort("streak", -1).to_list(1000)

    streak_rank = None
    for idx, u in enumerate(all_streaks, 1):
        if u["id"] == user_id:
            streak_rank = idx
            break

    return {
        "completer_rank": completer_rank,
        "streak_rank": streak_rank,
        "my_stats": {
            "completion_count": user.get("completion_count", 0),
            "streak": user.get("streak", 0),
            "trust_score": user.get("trust_score", 0),
        }
    }


async def ensure_leaderboard_indexes(db):
    await db.users.create_index("completion_count")
    await db.users.create_index("streak")
    await db.users.create_index("trust_score")
    await db.bonds.create_index("status")
    await db.bonds.create_index("created_at")
