"""
Parties CRUD — master contact directory.
Super Admin + Office Executive access.
"""

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import CurrentUser, UserRole, require_roles
from app.core.database import get_db
from app.models.lead import Lead
from app.models.opportunity import Opportunity
from app.models.party import Party
from app.models.requirement import Requirement
from app.models.user import User
from app.schemas import PartyCreate, PartyUpdate, PartyResponse

router = APIRouter(prefix="/parties", tags=["parties"])

_OE = (UserRole.SUPER_ADMIN, UserRole.OFFICE_EXECUTIVE)


def _iso(dt) -> str | None:
    """Safe ISO format for nullable datetimes."""
    if dt is None:
        return None
    if isinstance(dt, str):
        return dt
    return dt.isoformat()


def _enum_val(v) -> str | None:
    """Extract .value from enum or return str/None as-is."""
    if v is None:
        return None
    return v.value if hasattr(v, "value") else str(v)


# ── List parties ──────────────────────────────────────────────────────────────

@router.get("")
async def list_parties(
    search: str | None = None,
    limit: int = Query(default=50, le=200),
    offset: int = 0,
    user: CurrentUser = Depends(require_roles(*_OE)),
    db: AsyncSession = Depends(get_db),
):
    leads_sq = (
        select(func.count(Lead.id))
        .where(Lead.party_id == Party.id)
        .correlate(Party)
        .scalar_subquery()
    )
    reqs_sq = (
        select(func.count(Requirement.id))
        .where(Requirement.client_id == Party.id)
        .correlate(Party)
        .scalar_subquery()
    )
    opps_sq = (
        select(func.count(Opportunity.id))
        .where(Opportunity.client_id == Party.id)
        .correlate(Party)
        .scalar_subquery()
    )

    q = select(Party, leads_sq.label("lc"), reqs_sq.label("rc"), opps_sq.label("oc"))

    cond = None
    if search:
        cond = or_(
            Party.name.ilike(f"%{search}%"),
            Party.email.ilike(f"%{search}%"),
            Party.mobile.ilike(f"%{search}%"),
        )
        q = q.where(cond)

    count_q = select(func.count(Party.id))
    if cond is not None:
        count_q = count_q.where(cond)

    total = (await db.execute(count_q)).scalar_one()
    rows = await db.execute(q.order_by(Party.name.asc()).limit(limit).offset(offset))

    items = []
    for p, lc, rc, oc in rows:
        items.append({
            "id": p.id, "name": p.name, "email": p.email, "mobile": p.mobile,
            "city": p.city, "roles": p.roles or [], "status": p.status,
            "source": p.source,
            "leads_count": lc or 0, "requirements_count": rc or 0,
            "opportunities_count": oc or 0,
            "updated_at": _iso(p.updated_at),
        })

    return {"items": items, "total": total}


# ── Get party detail ─────────────────────────────────────────────────────────

@router.get("/{party_id}")
async def get_party(
    party_id: str,
    user: CurrentUser = Depends(require_roles(*_OE)),
    db: AsyncSession = Depends(get_db),
):
    party = (await db.execute(select(Party).where(Party.id == party_id))).scalar_one_or_none()
    if not party:
        raise HTTPException(404, "Party not found")

    # Linked leads
    leads_rows = await db.execute(
        select(Lead)
        .where(Lead.party_id == party_id)
        .order_by(Lead.last_activity_at.desc().nullslast())
    )
    leads = [
        {
            "id": l.id, "party_id": l.party_id, "party_name": l.party_name,
            "channel_type": _enum_val(l.channel_type), "source": l.source,
            "lead_type": _enum_val(l.lead_type), "status": _enum_val(l.status),
            "priority": _enum_val(l.priority),
            "assigned_to_id": l.assigned_to_id, "assigned_to_name": l.assigned_to_name,
            "value": l.value, "remarks": l.remarks,
            "last_activity_at": _iso(l.last_activity_at),
            "next_follow_up_at": _iso(l.next_follow_up_at),
            "created_at": _iso(l.created_at),
            "campaign_id": l.campaign_id, "campaign_name": l.campaign_name,
            "referral_code": l.referral_code, "ad_reference": l.ad_reference,
            "enquiry_at": _iso(l.enquiry_at),
            "referral_partner_id": l.referral_partner_id,
            "referral_partner_name": l.referral_partner_name,
        }
        for (l,) in leads_rows
    ]

    # Linked requirements
    reqs_rows = await db.execute(
        select(Requirement).where(Requirement.client_id == party_id).order_by(Requirement.id)
    )
    requirements = [
        {
            "id": r.id, "category": _enum_val(r.category), "intent": _enum_val(r.intent),
            "preferred_short_locs": r.preferred_short_locs or [],
            "min_budget": r.min_budget, "max_budget": r.max_budget,
            "status": _enum_val(r.status),
        }
        for (r,) in reqs_rows
    ]

    # Linked opportunities
    opps_rows = await db.execute(
        select(Opportunity).where(Opportunity.client_id == party_id).order_by(Opportunity.id)
    )
    opportunities = [
        {
            "id": o.id, "stage": _enum_val(o.stage),
            "expected_value": o.expected_value, "probability": o.probability,
        }
        for (o,) in opps_rows
    ]

    return {
        "party": {
            "id": party.id, "name": party.name, "email": party.email,
            "mobile": party.mobile, "city": party.city,
            "roles": party.roles or [], "status": party.status, "source": party.source,
            "created_at": _iso(party.created_at), "updated_at": _iso(party.updated_at),
        },
        "leads": leads,
        "requirements": requirements,
        "opportunities": opportunities,
    }


# ── Create party ──────────────────────────────────────────────────────────────

@router.post("", status_code=201)
async def create_party(
    body: PartyCreate,
    user: CurrentUser = Depends(require_roles(*_OE)),
    db: AsyncSession = Depends(get_db),
):
    party = Party(
        id=f"p-{uuid.uuid4().hex[:8]}",
        name=body.name,
        mobile=body.mobile,
        email=body.email,
        city=body.city,
        roles=body.roles,
        source=body.source,
        status=body.status,
        updated_at=datetime.now(timezone.utc),
    )
    db.add(party)
    await db.flush()
    return {"id": party.id, "message": "Party created"}


# ── Patch party ───────────────────────────────────────────────────────────────

@router.patch("/{party_id}")
async def patch_party(
    party_id: str,
    body: PartyUpdate,
    user: CurrentUser = Depends(require_roles(*_OE)),
    db: AsyncSession = Depends(get_db),
):
    party = (await db.execute(select(Party).where(Party.id == party_id))).scalar_one_or_none()
    if not party:
        raise HTTPException(404, "Party not found")

    for field, value in body.model_dump(exclude_none=True).items():
        setattr(party, field, value)
    party.updated_at = datetime.now(timezone.utc)
    await db.flush()
    return {"id": party.id, "message": "Party updated"}
