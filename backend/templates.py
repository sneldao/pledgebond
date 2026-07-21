import uuid
import logging
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

templates_router = APIRouter(prefix="/templates", tags=["templates"])


class TaskTemplate(BaseModel):
    title: str
    description: Optional[str] = ""
    task_type: str = "binary"
    verification: str = "self_report"
    target: Optional[float] = None
    unit: Optional[str] = ""


class BondTemplate(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    category: str  # fitness, learning, charity, social, habit
    cover_emoji: str = "🎯"
    default_seal_style: str = "burgundy"
    suggested_funder_amount: float = 1000
    suggested_fundee_pledge: float = 25
    suggested_threshold: float = 200
    suggested_completion_percent: int = 70
    suggested_duration_days: int = 30
    task_templates: List[TaskTemplate] = []
    suggested_causes: List[str] = []
    difficulty: str = "medium"  # easy, medium, hard
    popularity: int = 0
    usage_count: int = 0
    created_by: Optional[str] = None
    is_public: bool = True
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class CreateTemplateRequest(BaseModel):
    name: str
    description: str
    category: str
    cover_emoji: str = "🎯"
    default_seal_style: str = "burgundy"
    suggested_funder_amount: float = 1000
    suggested_fundee_pledge: float = 25
    suggested_threshold: float = 200
    suggested_completion_percent: int = 70
    suggested_duration_days: int = 30
    task_templates: List[TaskTemplate] = []
    suggested_causes: List[str] = []
    difficulty: str = "medium"


@templates_router.get("/")
async def list_templates(
    category: Optional[str] = None,
    difficulty: Optional[str] = None,
    limit: int = Query(50, ge=1, le=100),
    user: dict = Depends(require_user)
):
    from server import db

    query = {"is_public": True}
    if category:
        query["category"] = category
    if difficulty:
        query["difficulty"] = difficulty

    templates = await db.templates.find(query).sort("popularity", -1).limit(limit).to_list(limit)

    # Clean up _id fields
    for t in templates:
        t.pop("_id", None)

    return {"templates": templates, "total": len(templates)}


@templates_router.get("/popular")
async def get_popular_templates(
    limit: int = Query(10, ge=1, le=50),
    user: dict = Depends(require_user)
):
    from server import db

    templates = await db.templates.find(
        {"is_public": True}
    ).sort("popularity", -1).limit(limit).to_list(limit)

    for t in templates:
        t.pop("_id", None)

    return {"templates": templates}


@templates_router.get("/{template_id}")
async def get_template(template_id: str, user: dict = Depends(require_user)):
    from server import db

    template = await db.templates.find_one({"id": template_id, "is_public": True})
    if not template:
        raise HTTPException(404, "Template not found")

    template.pop("_id", None)
    return template


@templates_router.post("/")
async def create_template(req: CreateTemplateRequest, user: dict = Depends(require_user)):
    from server import db

    template = BondTemplate(
        name=req.name,
        description=req.description,
        category=req.category,
        cover_emoji=req.cover_emoji,
        default_seal_style=req.default_seal_style,
        suggested_funder_amount=req.suggested_funder_amount,
        suggested_fundee_pledge=req.suggested_fundee_pledge,
        suggested_threshold=req.suggested_threshold,
        suggested_completion_percent=req.suggested_completion_percent,
        suggested_duration_days=req.suggested_duration_days,
        task_templates=req.task_templates,
        suggested_causes=req.suggested_causes,
        difficulty=req.difficulty,
        created_by=user["id"],
    )

    await db.templates.insert_one(template.model_dump())

    template_dict = template.model_dump()
    template_dict.pop("_id", None)
    return template_dict


@templates_router.post("/{template_id}/use")
async def use_template(template_id: str, user: dict = Depends(require_user)):
    from server import db

    template = await db.templates.find_one({"id": template_id})
    if not template:
        raise HTTPException(404, "Template not found")

    # Increment usage count and popularity
    await db.templates.update_one(
        {"id": template_id},
        {"$inc": {"usage_count": 1, "popularity": 1}}
    )

    # Return template data for bond creation
    template.pop("_id", None)
    return {
        "template": template,
        "message": "Template applied. Create your bond with these settings."
    }


@templates_router.get("/categories/list")
async def list_categories(user: dict = Depends(require_user)):
    from server import db

    categories = await db.templates.distinct("category", {"is_public": True})
    return {"categories": sorted(categories)}


async def seed_default_templates(db):
    """Seed default templates if none exist."""
    count = await db.templates.count_documents({})
    if count > 0:
        return

    logger.info("Seeding default templates...")

    default_templates = [
        BondTemplate(
            name="21-Day Habit Challenge",
            description="Build a new habit over 21 days with daily check-ins and accountability",
            category="habit",
            cover_emoji="🎯",
            suggested_funder_amount=500,
            suggested_fundee_pledge=20,
            suggested_threshold=100,
            suggested_duration_days=21,
            suggested_completion_percent=80,
            task_templates=[
                TaskTemplate(title="Daily check-in", task_type="binary", verification="self_report"),
                TaskTemplate(title="Day 7 milestone", task_type="binary", verification="self_report"),
                TaskTemplate(title="Day 14 milestone", task_type="binary", verification="photo_upload"),
                TaskTemplate(title="Final reflection", task_type="binary", verification="photo_upload"),
            ],
            difficulty="medium",
        ),
        BondTemplate(
            name="Fitness Streak",
            description="Maintain a workout streak with photo proof and progress tracking",
            category="fitness",
            cover_emoji="💪",
            suggested_funder_amount=1000,
            suggested_fundee_pledge=25,
            suggested_threshold=150,
            suggested_duration_days=30,
            suggested_completion_percent=70,
            task_templates=[
                TaskTemplate(title="Workout photo", task_type="binary", verification="photo_upload"),
                TaskTemplate(title="Duration logged", task_type="timed_ranked", verification="numeric", target=30, unit="min"),
                TaskTemplate(title="Weekly progress photo", task_type="binary", verification="photo_upload"),
            ],
            difficulty="hard",
        ),
        BondTemplate(
            name="Learning Sprint",
            description="Complete a course or learning goal with milestone checkpoints",
            category="learning",
            cover_emoji="📚",
            suggested_funder_amount=800,
            suggested_fundee_pledge=30,
            suggested_threshold=120,
            suggested_duration_days=45,
            suggested_completion_percent=75,
            task_templates=[
                TaskTemplate(title="Module 1 complete", task_type="binary", verification="self_report"),
                TaskTemplate(title="Module 2 complete", task_type="binary", verification="self_report"),
                TaskTemplate(title="Final project submitted", task_type="binary", verification="photo_upload"),
            ],
            difficulty="medium",
        ),
        BondTemplate(
            name="Charity Drive",
            description="Raise awareness and funds for a cause with community participation",
            category="charity",
            cover_emoji="❤️",
            suggested_funder_amount=2000,
            suggested_fundee_pledge=15,
            suggested_threshold=300,
            suggested_duration_days=14,
            suggested_completion_percent=60,
            task_templates=[
                TaskTemplate(title="Share campaign", task_type="binary", verification="self_report"),
                TaskTemplate(title="Recruit participant", task_type="binary", verification="self_report"),
                TaskTemplate(title="Milestone reached", task_type="threshold_percent", verification="numeric", target=50, unit="%"),
            ],
            suggested_causes=["Local Food Bank", "Animal Shelter", "Education Fund", "Medical Research"],
            difficulty="easy",
        ),
        BondTemplate(
            name="Social Accountability",
            description="Complete a social challenge with friends and track collective progress",
            category="social",
            cover_emoji="👥",
            suggested_funder_amount=600,
            suggested_fundee_pledge=20,
            suggested_threshold=80,
            suggested_duration_days=7,
            suggested_completion_percent=80,
            task_templates=[
                TaskTemplate(title="Daily participation", task_type="binary", verification="self_report"),
                TaskTemplate(title="Group check-in", task_type="binary", verification="photo_upload"),
            ],
            difficulty="easy",
        ),
    ]

    for template in default_templates:
        await db.templates.insert_one(template.model_dump())

    logger.info(f"Seeded {len(default_templates)} default templates")


async def ensure_template_indexes(db):
    await db.templates.create_index("category")
    await db.templates.create_index("popularity")
    await db.templates.create_index("is_public")
    await db.templates.create_index("created_by")
