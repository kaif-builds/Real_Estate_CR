"""
Requirements CRUD — client property requirements.
Super Admin + Office Executive access.
"""

import enum as _enum
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import CurrentUser, UserRole, require_roles
from app.core.database import get_db
from app.models.party import Party
from app.models.requirement import Requirement
from app.models.user import User
from app.models.enums import PropertyCategory, Intent, RequirementStatus
from app.schemas import RequirementCreate, RequirementUpdate


def _to_enum(enum_cls: type[_enum.Enum], value):
    if value is None:
        return None
    if isinstance(value, enum_cls):
        return value
    for member in enum_cls:
        if member.value == value:
            return member
    try:
        return enum_cls[value]
    except KeyError:
        raise HTTPException(422, f"Invalid value '{value}' for {enum_cls.__name__}. Valid: {[m.value for m in enum_cls]}")

router = APIRouter(prefix="/requirements", tags=["requirements"])

_OE = (UserRole.SUPER_ADMIN, UserRole.OFFICE_EXECUTIVE)


def _iso(dt) -> str | None:
    if dt is None:
        return None
    if isinstance(dt, str):
        return dt
    return dt.isoformat()


def _enum_val(v) -> str | None:
    if v is None:
        return None
    return v.value if hasattr(v, "value") else str(v)


def _req_dict(r: Requirement) -> dict:
    """Convert Requirement ORM object to response dict matching frontend FullRequirementRow."""
    return {
        "id": r.id,
        "client_id": r.client_id,
        "client_name": r.client_name or "—",
        "assigned_to_id": r.assigned_to_id,
        "assigned_to_name": r.assigned_to_name,
        "category": _enum_val(r.category),
        "intent": _enum_val(r.intent),
        "preferred_short_locs": r.preferred_short_locs or [],
        "alternate_locs": r.alternate_locs or [],
        "min_budget": r.min_budget,
        "max_budget": r.max_budget,
        "min_area": r.min_area,
        "max_area": r.max_area,
        "timeline": r.timeline,
        "facilities": r.facilities or [],
        "status": _enum_val(r.status),
        "remarks": r.remarks,
        "created_at": _iso(r.created_at),
    }


# ── List requirements ─────────────────────────────────────────────────────────

@router.get("")
async def list_requirements(
    status: str | None = None,
    category: str | None = None,
    intent: str | None = None,
    client_id: str | None = None,
    search: str | None = None,
    limit: int = Query(default=50, le=200),
    offset: int = 0,
    user: CurrentUser = Depends(require_roles(*_OE)),
    db: AsyncSession = Depends(get_db),
):
    conds = []
    if status:
        conds.append(Requirement.status == status)
    if category:
        conds.append(Requirement.category == category)
    if intent:
        conds.append(Requirement.intent == intent)
    if client_id:
        conds.append(Requirement.client_id == client_id)
    if search:
        conds.append(Requirement.client_name.ilike(f"%{search}%"))

    q = select(Requirement)
    if conds:
        q = q.where(*conds)

    count_q = select(func.count(Requirement.id))
    if conds:
        count_q = count_q.where(*conds)

    total = (await db.execute(count_q)).scalar_one()
    rows = await db.execute(
        q.order_by(Requirement.created_at.desc().nullslast())
        .limit(limit).offset(offset)
    )

    items = [_req_dict(r) for (r,) in rows]
    return {"items": items, "total": total}


# ── Get single requirement ───────────────────────────────────────────────────

@router.get("/{requirement_id}")
async def get_requirement(
    requirement_id: str,
    user: CurrentUser = Depends(require_roles(*_OE)),
    db: AsyncSession = Depends(get_db),
):
    req = (await db.execute(select(Requirement).where(Requirement.id == requirement_id))).scalar_one_or_none()
    if not req:
        raise HTTPException(404, "Requirement not found")
    return _req_dict(req)


# ── Create requirement ───────────────────────────────────────────────────────

@router.post("", status_code=201)
async def create_requirement(
    body: RequirementCreate,
    user: CurrentUser = Depends(require_roles(*_OE)),
    db: AsyncSession = Depends(get_db),
):
    # Resolve client name from FK lookup
    client = (await db.execute(select(Party).where(Party.id == body.client_id))).scalar_one_or_none()
    if not client:
        raise HTTPException(400, f"Client party '{body.client_id}' not found")

    # Resolve assigned_to name from FK lookup
    assigned_name = None
    if body.assigned_to_id:
        u = (await db.execute(select(User.name).where(User.id == body.assigned_to_id))).scalar_one_or_none()
        if not u:
            raise HTTPException(400, f"User '{body.assigned_to_id}' not found")
        assigned_name = u

    now = datetime.now(timezone.utc)
    req = Requirement(
        id=f"R-{uuid.uuid4().hex[:4].upper()}",
        client_id=body.client_id,
        client_name=client.name,
        assigned_to_id=body.assigned_to_id,
        assigned_to_name=assigned_name,
        category=_to_enum(PropertyCategory, body.category),
        intent=_to_enum(Intent, body.intent),
        preferred_short_locs=body.preferred_short_locs,
        alternate_locs=body.alternate_locs,
        min_budget=body.min_budget,
        max_budget=body.max_budget,
        min_area=body.min_area,
        max_area=body.max_area,
        timeline=body.timeline,
        facilities=body.facilities,
        status=_to_enum(RequirementStatus, body.status),
        remarks=body.remarks,
        created_at=now,
    )
    db.add(req)
    await db.flush()
    return {"id": req.id, "message": "Requirement created"}


# ── Patch requirement ────────────────────────────────────────────────────────

@router.patch("/{requirement_id}")
async def patch_requirement(
    requirement_id: str,
    body: RequirementUpdate,
    user: CurrentUser = Depends(require_roles(*_OE)),
    db: AsyncSession = Depends(get_db),
):
    req = (await db.execute(select(Requirement).where(Requirement.id == requirement_id))).scalar_one_or_none()
    if not req:
        raise HTTPException(404, "Requirement not found")

    updates = body.model_dump(exclude_none=True)

    # If assigned_to_id is changing, resolve the name from FK
    if "assigned_to_id" in updates:
        new_id = updates["assigned_to_id"]
        if new_id:
            u = (await db.execute(select(User.name).where(User.id == new_id))).scalar_one_or_none()
            if not u:
                raise HTTPException(400, f"User '{new_id}' not found")
            req.assigned_to_name = u
        else:
            req.assigned_to_name = None

    # Convert enum fields
    if "category" in updates:
        updates["category"] = _to_enum(PropertyCategory, updates["category"])
    if "intent" in updates:
        updates["intent"] = _to_enum(Intent, updates["intent"])
    if "status" in updates:
        updates["status"] = _to_enum(RequirementStatus, updates["status"])

    for field, value in updates.items():
        setattr(req, field, value)

    await db.flush()
    return {"id": req.id, "message": "Requirement updated"}
