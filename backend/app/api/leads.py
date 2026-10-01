"""
Leads CRUD — filtered list, create, read, patch.
Super Admin + Office Executive access.
Denormalized name fields populated from FK lookup at write time.
"""

import enum as _enum
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import CurrentUser, UserRole, require_roles
from app.core.database import get_db
from app.models.campaign import Campaign
from app.models.lead import Lead
from app.models.party import Party
from app.models.referral_partner import ReferralPartner
from app.models.user import User
from app.models.enums import ChannelType, LeadType, LeadStatus, LeadPriority


def _to_enum(enum_cls: type[_enum.Enum], value):
    """Convert a raw string to the matching enum member (by value), or return None."""
    if value is None:
        return None
    if isinstance(value, enum_cls):
        return value
    # Try by value first (e.g. "Digital"), then by name (e.g. "DIGITAL")
    for member in enum_cls:
        if member.value == value:
            return member
    try:
        return enum_cls[value]
    except KeyError:
        raise HTTPException(422, f"Invalid value '{value}' for {enum_cls.__name__}. Valid: {[m.value for m in enum_cls]}")
from app.schemas import LeadCreate, LeadUpdate

router = APIRouter(prefix="/leads", tags=["leads"])

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


def _lead_dict(lead: Lead) -> dict:
    """Convert Lead ORM object to response dict matching frontend LeadRow."""
    return {
        "id": lead.id,
        "party_id": lead.party_id,
        "party_name": lead.party_name or "—",
        "channel_type": _enum_val(lead.channel_type),
        "source": lead.source,
        "lead_type": _enum_val(lead.lead_type),
        "status": _enum_val(lead.status),
        "priority": _enum_val(lead.priority),
        "assigned_to_id": lead.assigned_to_id,
        "assigned_to_name": lead.assigned_to_name,
        "value": lead.value,
        "remarks": lead.remarks,
        "last_activity_at": _iso(lead.last_activity_at),
        "next_follow_up_at": _iso(lead.next_follow_up_at),
        "created_at": _iso(lead.created_at),
        "campaign_id": lead.campaign_id,
        "campaign_name": lead.campaign_name,
        "referral_code": lead.referral_code,
        "ad_reference": lead.ad_reference,
        "enquiry_at": _iso(lead.enquiry_at),
        "referral_partner_id": lead.referral_partner_id,
        "referral_partner_name": lead.referral_partner_name,
    }


# ── List leads ────────────────────────────────────────────────────────────────

@router.get("")
async def list_leads(
    status: str | None = None,
    lead_type: str | None = None,
    priority: str | None = None,
    search: str | None = None,
    party_id: str | None = None,
    limit: int = Query(default=50, le=200),
    offset: int = 0,
    user: CurrentUser = Depends(require_roles(*_OE)),
    db: AsyncSession = Depends(get_db),
):
    conds = []
    if status:
        conds.append(Lead.status == status)
    if lead_type:
        conds.append(Lead.lead_type == lead_type)
    if priority:
        conds.append(Lead.priority == priority)
    if party_id:
        conds.append(Lead.party_id == party_id)
    if search:
        conds.append(Lead.party_name.ilike(f"%{search}%"))

    q = select(Lead)
    if conds:
        q = q.where(*conds)

    count_q = select(func.count(Lead.id))
    if conds:
        count_q = count_q.where(*conds)

    total = (await db.execute(count_q)).scalar_one()
    rows = await db.execute(
        q.order_by(Lead.last_activity_at.desc().nullslast(), Lead.created_at.desc())
        .limit(limit).offset(offset)
    )

    items = [_lead_dict(lead) for (lead,) in rows]
    return {"items": items, "total": total}


# ── Get single lead ──────────────────────────────────────────────────────────

@router.get("/{lead_id}")
async def get_lead(
    lead_id: str,
    user: CurrentUser = Depends(require_roles(*_OE)),
    db: AsyncSession = Depends(get_db),
):
    lead = (await db.execute(select(Lead).where(Lead.id == lead_id))).scalar_one_or_none()
    if not lead:
        raise HTTPException(404, "Lead not found")
    return _lead_dict(lead)


# ── Create lead ──────────────────────────────────────────────────────────────

@router.post("", status_code=201)
async def create_lead(
    body: LeadCreate,
    user: CurrentUser = Depends(require_roles(*_OE)),
    db: AsyncSession = Depends(get_db),
):
    # Validate party exists and get name from FK (not from request body)
    party = (await db.execute(select(Party).where(Party.id == body.party_id))).scalar_one_or_none()
    if not party:
        raise HTTPException(400, f"Party '{body.party_id}' not found")

    # Resolve assigned_to name from FK lookup
    assigned_name = None
    if body.assigned_to_id:
        u = (await db.execute(select(User.name).where(User.id == body.assigned_to_id))).scalar_one_or_none()
        if not u:
            raise HTTPException(400, f"User '{body.assigned_to_id}' not found")
        assigned_name = u

    # Resolve campaign name from FK lookup
    campaign_name = None
    if body.campaign_id:
        c = (await db.execute(select(Campaign.name).where(Campaign.id == body.campaign_id))).scalar_one_or_none()
        if c:
            campaign_name = c

    # Resolve referral partner name from FK lookup
    rp_name = None
    if body.referral_partner_id:
        rp = (await db.execute(select(ReferralPartner.name).where(ReferralPartner.id == body.referral_partner_id))).scalar_one_or_none()
        if rp:
            rp_name = rp

    now = datetime.now(timezone.utc)
    lead = Lead(
        id=f"L-{uuid.uuid4().hex[:8].upper()}",
        party_id=body.party_id,
        party_name=party.name,
        channel_type=_to_enum(ChannelType, body.channel_type),
        source=body.source,
        lead_type=_to_enum(LeadType, body.lead_type),
        status=_to_enum(LeadStatus, body.status),
        priority=_to_enum(LeadPriority, body.priority),
        assigned_to_id=body.assigned_to_id,
        assigned_to_name=assigned_name,
        value=body.value,
        remarks=body.remarks,
        campaign_id=body.campaign_id,
        campaign_name=campaign_name,
        referral_code=body.referral_code,
        ad_reference=body.ad_reference,
        referral_partner_id=body.referral_partner_id,
        referral_partner_name=rp_name,
        enquiry_at=now,
        last_activity_at=now,
        created_at=now,
    )
    db.add(lead)
    await db.flush()
    return {"id": lead.id, "message": "Lead created"}


# ── Patch lead ───────────────────────────────────────────────────────────────

@router.patch("/{lead_id}")
async def patch_lead(
    lead_id: str,
    body: LeadUpdate,
    user: CurrentUser = Depends(require_roles(*_OE)),
    db: AsyncSession = Depends(get_db),
):
    lead = (await db.execute(select(Lead).where(Lead.id == lead_id))).scalar_one_or_none()
    if not lead:
        raise HTTPException(404, "Lead not found")

    updates = body.model_dump(exclude_none=True)

    # If assigned_to_id is changing, resolve the name from FK
    if "assigned_to_id" in updates:
        new_id = updates["assigned_to_id"]
        if new_id:
            u = (await db.execute(select(User.name).where(User.id == new_id))).scalar_one_or_none()
            if not u:
                raise HTTPException(400, f"User '{new_id}' not found")
            lead.assigned_to_name = u
        else:
            lead.assigned_to_name = None

    # Convert enum fields to proper enum members
    _enum_fields = {
        "status": LeadStatus,
        "priority": LeadPriority,
        "channel_type": ChannelType,
    }
    for field, cls in _enum_fields.items():
        if field in updates:
            updates[field] = _to_enum(cls, updates[field])

    for field, value in updates.items():
        setattr(lead, field, value)

    lead.last_activity_at = datetime.now(timezone.utc)
    await db.flush()
    return {"id": lead.id, "message": "Lead updated"}
