"""
Requirements CRUD — client property requirements.
Super Admin + Office Executive access.
Denormalized client and assigned staff fields populated from FK lookup at write time.
"""

import enum as _enum
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
import sqlalchemy as sa
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import CurrentUser, UserRole, require_roles
from app.core.database import get_db
from app.models.enums import (
    FollowUpEntityType,
    Intent,
    LinkedRecordType,
    PropertyCategory,
    RequirementStatus,
)
from app.models.follow_up import FollowUp
from app.models.match import Match
from app.models.party import Party
from app.models.requirement import Requirement
from app.models.task import Task
from app.models.user import User
from app.schemas import RequirementCreate, RequirementUpdate

router = APIRouter(prefix="/requirements", tags=["requirements"])

_OE = (UserRole.SUPER_ADMIN, UserRole.OFFICE_EXECUTIVE)


def _to_enum(enum_cls: type[_enum.Enum], value):
    """Safely convert a string/enum value to the target Enum member, or raise 422 with valid values."""
    if value is None:
        return None
    if isinstance(value, enum_cls):
        return value
    val_upper = str(value).upper().strip().replace(" ", "_").replace("-", "_")
    for member in enum_cls:
        if member.name == val_upper or str(member.value).upper() == val_upper:
            return member
    valid_vals = [m.value for m in enum_cls]
    raise HTTPException(
        status_code=422,
        detail=f"Invalid value '{value}' for {enum_cls.__name__}. Valid: {valid_vals}",
    )


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


def _req_dict(r: Requirement, match_count: int = 0) -> dict:
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
        "match_count": match_count,
        "created_at": _iso(r.created_at),
    }


# ── List requirements ─────────────────────────────────────────────────────────

@router.get("")
async def list_requirements(
    status: str | None = None,
    category: str | None = None,
    intent: str | None = None,
    client_id: str | None = None,
    party_id: str | None = None,
    party: str | None = None,
    short_loc: str | None = None,
    search: str | None = None,
    limit: int = Query(default=50, le=200),
    offset: int = 0,
    user: CurrentUser = Depends(require_roles(*_OE)),
    db: AsyncSession = Depends(get_db),
):
    conds = []
    if status:
        conds.append(Requirement.status == _to_enum(RequirementStatus, status))
    if category:
        conds.append(Requirement.category == _to_enum(PropertyCategory, category))
    if intent:
        conds.append(Requirement.intent == _to_enum(Intent, intent))

    effective_party_id = client_id or party_id or party
    if effective_party_id:
        conds.append(Requirement.client_id == effective_party_id)

    if short_loc:
        conds.append(sa.cast(Requirement.preferred_short_locs, sa.String).ilike(f"%{short_loc}%"))

    if search:
        search_filter = or_(
            Requirement.id.ilike(f"%{search}%"),
            Requirement.client_name.ilike(f"%{search}%"),
            Party.name.ilike(f"%{search}%"),
            sa.cast(Requirement.preferred_short_locs, sa.String).ilike(f"%{search}%"),
            Requirement.remarks.ilike(f"%{search}%"),
        )
        conds.append(search_filter)

    # Subquery for live match counts
    match_count_subq = (
        select(Match.requirement_id, func.count(Match.id).label("m_count"))
        .group_by(Match.requirement_id)
        .subquery()
    )

    q = (
        select(Requirement, func.coalesce(match_count_subq.c.m_count, 0))
        .outerjoin(Party, Requirement.client_id == Party.id)
        .outerjoin(match_count_subq, Requirement.id == match_count_subq.c.requirement_id)
    )
    count_q = select(func.count(Requirement.id)).outerjoin(Party, Requirement.client_id == Party.id)

    if conds:
        q = q.where(*conds)
        count_q = count_q.where(*conds)

    total = (await db.execute(count_q)).scalar_one()
    rows = await db.execute(
        q.order_by(Requirement.created_at.desc().nullslast())
        .limit(limit).offset(offset)
    )

    items = [_req_dict(r, match_count=mc) for (r, mc) in rows]
    return {"items": items, "total": total}


# ── Get single requirement detail ───────────────────────────────────────────

@router.get("/{requirement_id}")
async def get_requirement(
    requirement_id: str,
    user: CurrentUser = Depends(require_roles(*_OE)),
    db: AsyncSession = Depends(get_db),
):
    req = (await db.execute(select(Requirement).where(Requirement.id == requirement_id))).scalar_one_or_none()
    if not req:
        raise HTTPException(404, "Requirement not found")

    # 1. Matches
    match_rows = await db.execute(
        select(Match).where(Match.requirement_id == requirement_id).order_by(Match.overall_score.desc().nullslast())
    )
    matches = [
        {
            "id": m.id,
            "property_id": m.property_id,
            "overall_score": m.overall_score,
            "tier": _enum_val(m.tier),
            "status": _enum_val(m.status),
            "match_factors": m.match_factors,
            "created_at": _iso(m.created_at),
        }
        for (m,) in match_rows
    ]

    # 2. Follow-ups
    fu_rows = await db.execute(
        select(FollowUp).where(
            (FollowUp.entity_type == FollowUpEntityType.REQUIREMENT) &
            (FollowUp.entity_id == requirement_id)
        ).order_by(FollowUp.due_date.desc())
    )
    follow_ups = [
        {
            "id": f.id,
            "purpose": f.purpose,
            "priority": _enum_val(f.priority),
            "status": _enum_val(f.status),
            "due_date": _iso(f.due_date),
            "responsible_name": f.responsible_name,
        }
        for (f,) in fu_rows
    ]

    # 3. Tasks
    task_rows = await db.execute(
        select(Task).where(
            (Task.linked_record_type == LinkedRecordType.REQUIREMENT) &
            (Task.linked_record_id == requirement_id)
        ).order_by(Task.due_date.desc())
    )
    tasks = [
        {
            "id": t.id,
            "title": t.title,
            "task_type": _enum_val(t.task_type),
            "priority": _enum_val(t.priority),
            "status": _enum_val(t.status),
            "due_date": _iso(t.due_date),
            "assigned_to_name": t.assigned_to_name,
        }
        for (t,) in task_rows
    ]

    data = _req_dict(req, match_count=len(matches))
    data["matches"] = matches
    data["follow_ups"] = follow_ups
    data["tasks"] = tasks
    return data


# ── Create requirement ───────────────────────────────────────────────────────

@router.post("", status_code=201)
async def create_requirement(
    body: RequirementCreate,
    user: CurrentUser = Depends(require_roles(*_OE)),
    db: AsyncSession = Depends(get_db),
):
    if not body.client_id or not body.client_id.strip():
        raise HTTPException(422, "client_id is required")

    # Validate client exists and resolve client_name
    party = (await db.execute(select(Party).where(Party.id == body.client_id.strip()))).scalar_one_or_none()
    if not party:
        raise HTTPException(404, f"Party '{body.client_id}' not found")

    category_enum = _to_enum(PropertyCategory, body.category)
    intent_enum = _to_enum(Intent, body.intent)
    status_enum = _to_enum(RequirementStatus, body.status) or RequirementStatus.NEW

    # Validate assigned staff if provided
    assigned_name = None
    if body.assigned_to_id:
        user_row = (await db.execute(select(User).where(User.id == body.assigned_to_id))).scalar_one_or_none()
        if not user_row:
            raise HTTPException(404, f"User '{body.assigned_to_id}' not found")
        if _enum_val(user_row.role) != "AGENT":
            raise HTTPException(422, f"Assigned staff must have the AGENT role. User '{user_row.name}' has role '{_enum_val(user_row.role)}'.")
        if user_row.status != "Active":
            raise HTTPException(422, f"Cannot assign to an inactive user. User '{user_row.name}' is inactive.")
        assigned_name = user_row.name

    now = datetime.now(timezone.utc)
    req_id = f"R-{uuid.uuid4().hex[:6].upper()}"

    req = Requirement(
        id=req_id,
        client_id=party.id,
        client_name=party.name,
        assigned_to_id=body.assigned_to_id,
        assigned_to_name=assigned_name,
        category=category_enum,
        intent=intent_enum,
        preferred_short_locs=body.preferred_short_locs or [],
        alternate_locs=body.alternate_locs or [],
        min_budget=body.min_budget,
        max_budget=body.max_budget,
        min_area=body.min_area,
        max_area=body.max_area,
        timeline=body.timeline,
        facilities=body.facilities or [],
        status=status_enum,
        remarks=body.remarks,
        created_at=now,
    )
    db.add(req)
    await db.flush()
    return {"id": req.id, "message": "Requirement created successfully"}


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

    updates = body.model_dump(exclude_unset=True)

    # If client_id is changing, validate and update client_name
    if "client_id" in updates:
        new_client_id = updates["client_id"]
        if new_client_id:
            party = (await db.execute(select(Party).where(Party.id == new_client_id))).scalar_one_or_none()
            if not party:
                raise HTTPException(404, f"Party '{new_client_id}' not found")
            req.client_id = party.id
            req.client_name = party.name
        else:
            raise HTTPException(422, "client_id cannot be blank")

    # If assigned_to_id is changing, validate user and role
    if "assigned_to_id" in updates:
        new_uid = updates["assigned_to_id"]
        if new_uid:
            user_row = (await db.execute(select(User).where(User.id == new_uid))).scalar_one_or_none()
            if not user_row:
                raise HTTPException(404, f"User '{new_uid}' not found")
            if _enum_val(user_row.role) != "AGENT":
                raise HTTPException(422, f"Assigned staff must have the AGENT role. User '{user_row.name}' has role '{_enum_val(user_row.role)}'.")
            if user_row.status != "Active":
                raise HTTPException(422, f"Cannot assign to an inactive user. User '{user_row.name}' is inactive.")
            req.assigned_to_id = user_row.id
            req.assigned_to_name = user_row.name
        else:
            req.assigned_to_id = None
            req.assigned_to_name = None

    # Validate enums if provided
    if "category" in updates and updates["category"] is not None:
        req.category = _to_enum(PropertyCategory, updates["category"])
    if "intent" in updates and updates["intent"] is not None:
        req.intent = _to_enum(Intent, updates["intent"])
    if "status" in updates and updates["status"] is not None:
        req.status = _to_enum(RequirementStatus, updates["status"])

    # Merged budget range check
    new_min = updates.get("min_budget", req.min_budget)
    new_max = updates.get("max_budget", req.max_budget)
    if new_min is not None and new_max is not None and new_min > new_max:
        raise HTTPException(
            status_code=422,
            detail="Min budget cannot be greater than max budget",
        )

    for field in (
        "preferred_short_locs",
        "alternate_locs",
        "min_budget",
        "max_budget",
        "min_area",
        "max_area",
        "timeline",
        "facilities",
        "remarks",
    ):
        if field in updates:
            setattr(req, field, updates[field])

    await db.flush()
    return {"id": req.id, "message": "Requirement updated successfully"}


# ── Delete requirement ───────────────────────────────────────────────────────

@router.delete("/{requirement_id}")
async def delete_requirement(
    requirement_id: str,
    user: CurrentUser = Depends(require_roles(*_OE)),
    db: AsyncSession = Depends(get_db),
):
    req = (await db.execute(select(Requirement).where(Requirement.id == requirement_id))).scalar_one_or_none()
    if not req:
        raise HTTPException(404, "Requirement not found")

    # Guard: check for any linked records before deleting
    checks = [
        (
            Match,
            Match.requirement_id == requirement_id,
            "match record",
            "match records",
        ),
        (
            FollowUp,
            (FollowUp.entity_type == FollowUpEntityType.REQUIREMENT)
            & (FollowUp.entity_id == requirement_id),
            "follow-up",
            "follow-ups",
        ),
        (
            Task,
            (Task.linked_record_type == LinkedRecordType.REQUIREMENT)
            & (Task.linked_record_id == requirement_id),
            "linked task",
            "linked tasks",
        ),
    ]

    linked_items: list[str] = []
    for model, condition, singular, plural in checks:
        cnt = (await db.execute(select(func.count()).select_from(model).where(condition))).scalar_one()
        if cnt > 0:
            linked_items.append(f"{cnt} {singular if cnt == 1 else plural}")

    if linked_items:
        detail_msg = f"Cannot delete: this requirement has {', '.join(linked_items)}. Reassign or remove these first."
        raise HTTPException(status_code=409, detail=detail_msg)

    await db.delete(req)
    await db.flush()
    return {"id": requirement_id, "message": "Requirement deleted successfully"}
