"""
Properties CRUD — real estate inventory.
Super Admin + Office Executive access.
Denormalized owner_name field populated from Party FK lookup at write time.
"""

import enum as _enum
import uuid
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import CurrentUser, UserRole, require_roles
from app.core.database import get_db
from app.core.staleness import (
    TERMINAL_PROPERTY_STATUSES,
    stale_property_cutoff,
)
from app.models.campaign_promotion import CampaignPromotion
from app.models.content_item import ContentItem
from app.models.match import Match
from app.models.opportunity import Opportunity
from app.models.party import Party
from app.models.property import Property
from app.models.task import Task
from app.models.transaction import Transaction
from app.models.visit import Visit
from app.models.enums import (
    LinkedRecordType,
    PropertyCategory,
    PropertyStatus,
)
from app.schemas import PropertyCreate, PropertyUpdate

router = APIRouter(prefix="/properties", tags=["properties"])

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


def _to_enum(enum_cls: type[_enum.Enum], value):
    """Convert raw string to enum member (by value or case-insensitive name), or raise 422."""
    if value is None:
        return None
    if isinstance(value, enum_cls):
        return value
    for member in enum_cls:
        if member.value == value:
            return member
    val_upper = str(value).upper()
    for member in enum_cls:
        if member.name == val_upper or str(member.value).upper() == val_upper:
            return member
    valid_vals = [m.value for m in enum_cls]
    raise HTTPException(
        status_code=422,
        detail=f"Invalid value '{value}' for {enum_cls.__name__}. Valid: {valid_vals}",
    )


def _parse_avail_date(v: str | None) -> tuple[datetime | None, str | None]:
    """
    Parse availability_date input.
    Returns (dt, label):
    - If valid ISO date/datetime string -> (datetime_obj, None)
    - If non-date text like "Immediate", "Leased", "Under Construction" -> (None, label_str)
    - If None or empty -> (None, None)
    """
    if not v:
        return None, None
    if isinstance(v, datetime):
        if v.tzinfo is None:
            v = v.replace(tzinfo=timezone.utc)
        return v, None
    if not isinstance(v, str):
        return None, None
    s = v.strip()
    if not s:
        return None, None

    # Try ISO formats (e.g. 2026-11-01T00:00:00Z or 2026-11-01)
    try:
        dt = datetime.fromisoformat(s.replace("Z", "+00:00"))
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt, None
    except (ValueError, TypeError):
        pass

    # Try YYYY-MM-DD
    try:
        dt = datetime.strptime(s, "%Y-%m-%d").replace(tzinfo=timezone.utc)
        return dt, None
    except ValueError:
        pass

    # Non-date label (e.g. "Immediate", "Under Construction", "Leased", "Sold Out")
    return None, s


def _parse_dt(v) -> datetime | None:
    if v is None:
        return None
    if isinstance(v, datetime):
        return v
    if isinstance(v, str):
        try:
            return datetime.fromisoformat(v.replace("Z", "+00:00"))
        except (ValueError, TypeError):
            return None
    return None


def _prop_dict(p: Property) -> dict[str, Any]:
    """Convert Property ORM object to response dict matching frontend PropertyRow."""
    details = p.details_json or {}
    if p.availability_date is not None:
        avail_display = _iso(p.availability_date)
    elif "availability_label" in details:
        avail_display = details["availability_label"]
    else:
        avail_display = None

    p_status_val = _enum_val(p.status)
    cutoff = stale_property_cutoff()
    is_stale = (
        p_status_val not in TERMINAL_PROPERTY_STATUSES
        and (p.last_verified_at is None or p.last_verified_at < cutoff)
    )

    return {
        "id": p.id,
        "category": _enum_val(p.category),
        "short_loc": p.short_loc,
        "address": p.address,
        "price": p.price,
        "status": p_status_val,
        "owner_id": p.owner_id,
        "owner_name": p.owner_name or "—",
        "source": p.source,
        "availability_date": avail_display,
        "details_json": p.details_json,
        "last_verified_at": _iso(p.last_verified_at),
        "created_at": _iso(p.created_at),
        "lat": p.lat,
        "lng": p.lng,
        "is_stale": is_stale,
    }


# ── List properties ──────────────────────────────────────────────────────────

@router.get("")
async def list_properties(
    category: str | None = None,
    status: str | None = None,
    short_loc: str | None = None,
    owner_id: str | None = None,
    party_id: str | None = None,
    source: str | None = None,
    is_stale: bool | None = None,
    search: str | None = None,
    limit: int = Query(default=50, le=200),
    offset: int = 0,
    user: CurrentUser = Depends(require_roles(*_OE)),
    db: AsyncSession = Depends(get_db),
):
    conds = []
    if category:
        conds.append(Property.category == _to_enum(PropertyCategory, category))
    if status:
        conds.append(Property.status == _to_enum(PropertyStatus, status))
    if short_loc:
        conds.append(Property.short_loc == short_loc)
    effective_owner_id = owner_id or party_id
    if effective_owner_id:
        conds.append(Property.owner_id == effective_owner_id)
    if source:
        conds.append(Property.source == source)

    if is_stale is not None:
        cutoff = stale_property_cutoff()
        terminal_list = list(TERMINAL_PROPERTY_STATUSES)
        if is_stale:
            # Stale properties: NOT in terminal statuses AND (last_verified_at < cutoff OR last_verified_at IS NULL)
            conds.append(Property.status.notin_(terminal_list))
            conds.append(
                or_(Property.last_verified_at < cutoff, Property.last_verified_at.is_(None))
            )
        else:
            # Not stale: either in terminal status OR last_verified_at >= cutoff
            conds.append(
                or_(
                    Property.status.in_(terminal_list),
                    (Property.last_verified_at >= cutoff) & (Property.last_verified_at.is_not(None)),
                )
            )

    if search:
        search_filter = or_(
            Property.id.ilike(f"%{search}%"),
            Property.short_loc.ilike(f"%{search}%"),
            Property.address.ilike(f"%{search}%"),
            Property.owner_name.ilike(f"%{search}%"),
            Party.name.ilike(f"%{search}%"),
        )
        conds.append(search_filter)

    q = select(Property).outerjoin(Party, Property.owner_id == Party.id)
    count_q = select(func.count(Property.id)).outerjoin(Party, Property.owner_id == Party.id)

    if conds:
        q = q.where(*conds)
        count_q = count_q.where(*conds)

    total = (await db.execute(count_q)).scalar_one()
    rows = await db.execute(
        q.order_by(Property.created_at.desc().nullslast(), Property.id.desc())
        .limit(limit)
        .offset(offset)
    )

    items = [_prop_dict(p) for (p,) in rows]
    return {"items": items, "total": total}


# ── Get single property detail ───────────────────────────────────────────────

@router.get("/{property_id}")
async def get_property(
    property_id: str,
    user: CurrentUser = Depends(require_roles(*_OE)),
    db: AsyncSession = Depends(get_db),
):
    prop = (await db.execute(select(Property).where(Property.id == property_id))).scalar_one_or_none()
    if not prop:
        raise HTTPException(404, "Property not found")

    # 1. Opportunities
    opps_rows = await db.execute(
        select(Opportunity).where(Opportunity.property_id == property_id).order_by(Opportunity.id)
    )
    opportunities = [
        {
            "id": o.id,
            "stage": _enum_val(o.stage),
            "expected_value": o.expected_value,
            "probability": o.probability,
            "client_name": o.client_name,
            "agent_name": o.agent_name,
        }
        for (o,) in opps_rows
    ]

    # 2. Transactions
    tx_rows = await db.execute(
        select(Transaction).where(Transaction.property_id == property_id).order_by(Transaction.id)
    )
    transactions = [
        {
            "id": t.id,
            "transaction_type": _enum_val(t.transaction_type),
            "transaction_value": t.transaction_value,
            "commission_amount": t.commission_amount,
            "payment_status": _enum_val(t.payment_status),
            "closed_date": str(t.closed_date) if t.closed_date else None,
        }
        for (t,) in tx_rows
    ]

    # 3. Visits
    visit_rows = await db.execute(
        select(Visit).where(Visit.property_id == property_id).order_by(Visit.scheduled_date.desc())
    )
    visits = [
        {
            "id": v.id,
            "client_name": v.client_name,
            "agent_name": v.agent_name,
            "purpose": _enum_val(v.purpose),
            "status": _enum_val(v.status),
            "scheduled_date": _iso(v.scheduled_date),
        }
        for (v,) in visit_rows
    ]

    # 4. Matches
    match_rows = await db.execute(
        select(Match).where(Match.property_id == property_id).order_by(Match.overall_score.desc().nullslast())
    )
    matches = [
        {
            "id": m.id,
            "requirement_id": m.requirement_id,
            "overall_score": m.overall_score,
            "tier": _enum_val(m.tier),
            "status": _enum_val(m.status),
        }
        for (m,) in match_rows
    ]

    # 5. Campaign Promotions
    prom_rows = await db.execute(
        select(CampaignPromotion).where(CampaignPromotion.property_id == property_id).order_by(CampaignPromotion.id)
    )
    campaign_promotions = [
        {
            "id": cp.id,
            "campaign_id": cp.campaign_id,
            "marketing_headline": cp.marketing_headline,
            "enquiries_count": cp.enquiries_count,
        }
        for (cp,) in prom_rows
    ]

    # 6. Content Items
    content_rows = await db.execute(
        select(ContentItem).where(ContentItem.linked_property_id == property_id).order_by(ContentItem.id)
    )
    content_items = [
        {
            "id": ci.id,
            "name": ci.name,
            "type": _enum_val(ci.type),
            "file_name": ci.file_name,
        }
        for (ci,) in content_rows
    ]

    # 7. Tasks
    task_rows = await db.execute(
        select(Task)
        .where(
            Task.linked_record_type == LinkedRecordType.PROPERTY,
            Task.linked_record_id == property_id,
        )
        .order_by(Task.id)
    )
    tasks = [
        {
            "id": tk.id,
            "title": tk.title,
            "task_type": _enum_val(tk.task_type),
            "status": _enum_val(tk.status),
            "priority": _enum_val(tk.priority),
            "due_date": _iso(tk.due_date),
        }
        for (tk,) in task_rows
    ]

    prop_data = _prop_dict(prop)
    return {
        "property": prop_data,
        "opportunities": opportunities,
        "transactions": transactions,
        "visits": visits,
        "matches": matches,
        "campaign_promotions": campaign_promotions,
        "content_items": content_items,
        "tasks": tasks,
        # Flattened fields for direct access compatibility
        **prop_data,
    }


# ── Create property ──────────────────────────────────────────────────────────

@router.post("", status_code=201)
async def create_property(
    body: PropertyCreate,
    user: CurrentUser = Depends(require_roles(*_OE)),
    db: AsyncSession = Depends(get_db),
):
    # Validate owner exists and resolve owner_name
    party = (await db.execute(select(Party).where(Party.id == body.owner_id))).scalar_one_or_none()
    if not party:
        raise HTTPException(404, f"Party '{body.owner_id}' not found")

    category_enum = _to_enum(PropertyCategory, body.category)
    status_enum = _to_enum(PropertyStatus, body.status) or PropertyStatus.NEW

    avail_dt, avail_label = _parse_avail_date(body.availability_date)
    details = dict(body.details_json or {})
    if avail_label:
        details["availability_label"] = avail_label
    elif "availability_label" in details:
        details.pop("availability_label", None)

    now = datetime.now(timezone.utc)
    prop_id = f"P-{uuid.uuid4().hex[:6].upper()}"

    prop = Property(
        id=prop_id,
        category=category_enum,
        short_loc=body.short_loc,
        address=body.address,
        price=body.price,
        status=status_enum,
        owner_id=party.id,
        owner_name=party.name,
        source=body.source,
        availability_date=avail_dt,
        details_json=details if details else None,
        last_verified_at=now,
        created_at=now,
        lat=body.lat,
        lng=body.lng,
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

    updates = body.model_dump(exclude_unset=True)

    # If owner_id is changing, validate and update owner_name
    if "owner_id" in updates:
        new_owner_id = updates["owner_id"]
        if new_owner_id:
            p = (await db.execute(select(Party).where(Party.id == new_owner_id))).scalar_one_or_none()
            if not p:
                raise HTTPException(404, f"Party '{new_owner_id}' not found")
            prop.owner_id = p.id
            prop.owner_name = p.name
        else:
            prop.owner_id = None
            prop.owner_name = None

    # Validate enums if provided
    if "category" in updates and updates["category"] is not None:
        prop.category = _to_enum(PropertyCategory, updates["category"])
    if "status" in updates and updates["status"] is not None:
        prop.status = _to_enum(PropertyStatus, updates["status"])

    # Availability date handling
    if "availability_date" in updates:
        raw_avail = updates["availability_date"]
        avail_dt, avail_label = _parse_avail_date(raw_avail)
        prop.availability_date = avail_dt

        details = dict(prop.details_json or {})
        if avail_label:
            details["availability_label"] = avail_label
        else:
            details.pop("availability_label", None)
        prop.details_json = details if details else None

    # Details JSON merging (if passed explicitly)
    if "details_json" in updates and updates["details_json"] is not None:
        cur_details = dict(prop.details_json or {})
        cur_details.update(updates["details_json"])
        prop.details_json = cur_details

    # Last verified date
    if "last_verified_at" in updates:
        prop.last_verified_at = _parse_dt(updates["last_verified_at"])

    # Scalar updates
    for field in ("short_loc", "address", "price", "source", "lat", "lng"):
        if field in updates:
            setattr(prop, field, updates[field])

    await db.flush()
    return {"id": prop.id, "message": "Property updated"}


# ── Delete property ──────────────────────────────────────────────────────────

@router.delete("/{property_id}")
async def delete_property(
    property_id: str,
    user: CurrentUser = Depends(require_roles(*_OE)),
    db: AsyncSession = Depends(get_db),
):
    prop = (await db.execute(select(Property).where(Property.id == property_id))).scalar_one_or_none()
    if not prop:
        raise HTTPException(404, "Property not found")

    checks = [
        (Opportunity, Opportunity.property_id == property_id, "opportunity", "opportunities"),
        (Transaction, Transaction.property_id == property_id, "transaction", "transactions"),
        (Visit, Visit.property_id == property_id, "site visit", "site visits"),
        (Match, Match.property_id == property_id, "match record", "match records"),
        (
            CampaignPromotion,
            CampaignPromotion.property_id == property_id,
            "campaign promotion",
            "campaign promotions",
        ),
        (
            ContentItem,
            ContentItem.linked_property_id == property_id,
            "marketing content item",
            "marketing content items",
        ),
        (
            Task,
            (Task.linked_record_type == LinkedRecordType.PROPERTY)
            & (Task.linked_record_id == property_id),
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
        detail_msg = f"Cannot delete: this property has {', '.join(linked_items)}. Reassign or remove these first."
        raise HTTPException(status_code=409, detail=detail_msg)

    await db.delete(prop)
    await db.flush()
    return {"id": property_id, "message": "Property deleted successfully"}
