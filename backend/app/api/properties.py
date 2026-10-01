"""
Properties CRUD — real estate inventory.
Super Admin + Office Executive for write; all roles for read.
"""

import enum as _enum
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import CurrentUser, UserRole, get_current_user, require_roles
from app.core.database import get_db
from app.models.party import Party
from app.models.property import Property
from app.models.enums import PropertyCategory, PropertyStatus
from app.schemas import PropertyCreate, PropertyUpdate


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


def _parse_dt(val: str | None) -> datetime | None:
    if not val:
        return None
    try:
        return datetime.fromisoformat(val.replace("Z", "+00:00"))
    except (ValueError, TypeError):
        return None

router = APIRouter(prefix="/properties", tags=["properties"])

_OE = (UserRole.SUPER_ADMIN, UserRole.OFFICE_EXECUTIVE)
_ALL = (UserRole.SUPER_ADMIN, UserRole.OFFICE_EXECUTIVE, UserRole.AGENT, UserRole.CLIENT)


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


def _prop_dict(p: Property) -> dict:
    """Convert Property ORM object to response dict matching frontend PropertyRow."""
    return {
        "id": p.id,
        "category": _enum_val(p.category),
        "short_loc": p.short_loc,
        "address": p.address,
        "price": p.price,
        "status": _enum_val(p.status),
        "owner_id": p.owner_id,
        "owner_name": p.owner_name,
        "source": p.source,
        "availability_date": _iso(p.availability_date),
        "details_json": p.details_json,
        "last_verified_at": _iso(p.last_verified_at),
        "created_at": _iso(p.created_at),
        "lat": p.lat,
        "lng": p.lng,
    }


# ── List properties ──────────────────────────────────────────────────────────

@router.get("")
async def list_properties(
    category: str | None = None,
    status: str | None = None,
    search: str | None = None,
    limit: int = Query(default=50, le=200),
    offset: int = 0,
    user: CurrentUser = Depends(require_roles(*_ALL)),
    db: AsyncSession = Depends(get_db),
):
    conds = []
    if category:
        conds.append(Property.category == category)
    if status:
        conds.append(Property.status == status)
    if search:
        conds.append(
            Property.short_loc.ilike(f"%{search}%")
            | Property.address.ilike(f"%{search}%")
            | Property.owner_name.ilike(f"%{search}%")
        )

    q = select(Property)
    if conds:
        q = q.where(*conds)

    count_q = select(func.count(Property.id))
    if conds:
        count_q = count_q.where(*conds)

    total = (await db.execute(count_q)).scalar_one()
    rows = await db.execute(
        q.order_by(Property.created_at.desc().nullslast())
        .limit(limit).offset(offset)
    )

    items = [_prop_dict(p) for (p,) in rows]
    return {"items": items, "total": total}


# ── Get single property ─────────────────────────────────────────────────────

@router.get("/{property_id}")
async def get_property(
    property_id: str,
    user: CurrentUser = Depends(require_roles(*_ALL)),
    db: AsyncSession = Depends(get_db),
):
    prop = (await db.execute(select(Property).where(Property.id == property_id))).scalar_one_or_none()
    if not prop:
        raise HTTPException(404, "Property not found")
    return _prop_dict(prop)


# ── Create property ──────────────────────────────────────────────────────────

@router.post("", status_code=201)
async def create_property(
    body: PropertyCreate,
    user: CurrentUser = Depends(require_roles(*_OE)),
    db: AsyncSession = Depends(get_db),
):
    # Resolve owner name from FK lookup
    owner = (await db.execute(select(Party).where(Party.id == body.owner_id))).scalar_one_or_none()
    if not owner:
        raise HTTPException(400, f"Owner party '{body.owner_id}' not found")

    now = datetime.now(timezone.utc)
    prop = Property(
        id=f"P-{uuid.uuid4().hex[:4].upper()}",
        category=_to_enum(PropertyCategory, body.category),
        short_loc=body.short_loc,
        address=body.address,
        price=body.price,
        status=_to_enum(PropertyStatus, body.status),
        owner_id=body.owner_id,
        owner_name=owner.name,  # FK lookup, not from request
        source=body.source,
        availability_date=_parse_dt(body.availability_date),
        details_json=body.details_json,
        lat=body.lat,
        lng=body.lng,
        created_at=now,
    )
    db.add(prop)
    await db.flush()
    return {"id": prop.id, "message": "Property created"}


# ── Patch property ───────────────────────────────────────────────────────────

@router.patch("/{property_id}")
async def patch_property(
    property_id: str,
    body: PropertyUpdate,
    user: CurrentUser = Depends(require_roles(*_OE)),
    db: AsyncSession = Depends(get_db),
):
    prop = (await db.execute(select(Property).where(Property.id == property_id))).scalar_one_or_none()
    if not prop:
        raise HTTPException(404, "Property not found")

    updates = body.model_dump(exclude_none=True)

    # If owner_id is changing, resolve the name from FK
    if "owner_id" in updates:
        owner = (await db.execute(select(Party).where(Party.id == updates["owner_id"]))).scalar_one_or_none()
        if not owner:
            raise HTTPException(400, f"Owner party '{updates['owner_id']}' not found")
        prop.owner_name = owner.name

    # Convert enum fields
    if "category" in updates:
        updates["category"] = _to_enum(PropertyCategory, updates["category"])
    if "status" in updates:
        updates["status"] = _to_enum(PropertyStatus, updates["status"])
    if "availability_date" in updates:
        updates["availability_date"] = _parse_dt(updates["availability_date"])

    for field, value in updates.items():
        setattr(prop, field, value)

    prop.last_verified_at = datetime.now(timezone.utc)
    await db.flush()
    return {"id": prop.id, "message": "Property updated"}
