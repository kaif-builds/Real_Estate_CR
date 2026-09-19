"""
Parties CRUD — master contact directory.
Visible to SUPER_ADMIN and OFFICE_EXECUTIVE only. Spec §3.3 Party.
"""

import uuid
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import CurrentUser, UserRole, require_roles
from app.core.database import get_db
from app.models.lead import Lead
from app.models.opportunity import Opportunity
from app.models.party import Party
from app.models.requirement import Requirement
from app.models.user import User

router = APIRouter(prefix="/parties", tags=["parties"])

_OE_ROLES = (UserRole.SUPER_ADMIN, UserRole.OFFICE_EXECUTIVE)


# ── Request schemas ──────────────────────────────────────────────────────────

class PartyCreate(BaseModel):
    name: str
    mobile: str
    email: Optional[str] = None
    city: Optional[str] = None
    roles: List[str] = []
    source: Optional[str] = None
    remarks: Optional[str] = None


class PartyPatch(BaseModel):
    name: Optional[str] = None
    mobile: Optional[str] = None
    email: Optional[str] = None
    city: Optional[str] = None
    roles: Optional[List[str]] = None
    source: Optional[str] = None
    remarks: Optional[str] = None


# ── List parties ──────────────────────────────────────────────────────────────

@router.get("")
async def list_parties(
    search: Optional[str] = None,    # matches name, email, mobile
    limit: int = Query(default=50, le=200),
    offset: int = 0,
    user: CurrentUser = Depends(require_roles(*_OE_ROLES)),
    db: AsyncSession = Depends(get_db),
):
    # Correlated subqueries for link counts
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
        .where(
            or_(Opportunity.buyer_id == Party.id, Opportunity.seller_id == Party.id)
        )
        .correlate(Party)
        .scalar_subquery()
    )

    q = select(
        Party,
        leads_sq.label("leads_count"),
        reqs_sq.label("reqs_count"),
        opps_sq.label("opps_count"),
    )

    search_cond = None
    if search:
        search_cond = or_(
            Party.name.ilike(f"%{search}%"),
            Party.email.ilike(f"%{search}%"),
            Party.mobile.ilike(f"%{search}%"),
        )
        q = q.where(search_cond)

    count_q = select(func.count(Party.id))
    if search_cond is not None:
        count_q = count_q.where(search_cond)

    total = (await db.execute(count_q)).scalar_one()

    rows = await db.execute(q.order_by(Party.name.asc()).limit(limit).offset(offset))

    items = []
    for party, lc, rc, oc in rows:
        items.append({
            "id": party.id,
            "name": party.name,
            "email": party.email,
            "mobile": party.mobile,
            "city": party.city,
            "roles": party.roles or [],
            "status": party.status,
            "source": party.source,
            "leads_count": lc or 0,
            "requirements_count": rc or 0,
            "opportunities_count": oc or 0,
            "updated_at": party.updated_at.isoformat() if party.updated_at else None,
        })

    return {"items": items, "total": total}


# ── Get party detail (with linked entities) ───────────────────────────────────

@router.get("/{party_id}")
async def get_party(
    party_id: str,
    user: CurrentUser = Depends(require_roles(*_OE_ROLES)),
    db: AsyncSession = Depends(get_db),
):
    party = (await db.execute(select(Party).where(Party.id == party_id))).scalar_one_or_none()
    if not party:
        raise HTTPException(status_code=404, detail="Party not found")

    # Linked leads
    leads_rows = await db.execute(
        select(Lead, User.name.label("an"))
        .outerjoin(User, Lead.assigned_to_id == User.id)
        .where(Lead.party_id == party_id)
        .order_by(Lead.last_activity_at.desc().nullslast())
    )
    leads = [
        {
            "id": l.id, "lead_type": l.lead_type, "source": l.source,
            "status": l.status, "priority": l.priority,
            "assigned_to_name": an, "value": l.value,
            "last_activity_at": l.last_activity_at.isoformat() if l.last_activity_at else None,
        }
        for l, an in leads_rows
    ]

    # Linked requirements
    reqs_rows = await db.execute(
        select(Requirement)
        .where(Requirement.client_id == party_id)
        .order_by(Requirement.id)
    )
    requirements = [
        {
            "id": r.id, "category": r.category, "intent": r.intent,
            "preferred_short_locs": r.preferred_short_locs or [],
            "min_budget": r.min_budget, "max_budget": r.max_budget,
            "status": r.status,
        }
        for (r,) in reqs_rows
    ]

    # Linked opportunities (as buyer or seller)
    opps_rows = await db.execute(
        select(Opportunity)
        .where(or_(Opportunity.buyer_id == party_id, Opportunity.seller_id == party_id))
        .order_by(Opportunity.id)
    )
    opportunities = [
        {
            "id": o.id, "stage": o.stage, "expected_value": o.expected_value,
            "expected_commission": o.expected_commission, "probability": o.probability,
            "role": "Buyer" if o.buyer_id == party_id else "Seller",
        }
        for (o,) in opps_rows
    ]

    return {
        "party": {
            "id": party.id, "name": party.name, "email": party.email,
            "mobile": party.mobile, "city": party.city,
            "roles": party.roles or [], "tags": party.tags or [],
            "status": party.status, "source": party.source, "remarks": party.remarks,
            "created_at": party.created_at.isoformat() if party.created_at else None,
            "updated_at": party.updated_at.isoformat() if party.updated_at else None,
        },
        "leads": leads,
        "requirements": requirements,
        "opportunities": opportunities,
    }


# ── Create party ──────────────────────────────────────────────────────────────

@router.post("", status_code=201)
async def create_party(
    body: PartyCreate,
    user: CurrentUser = Depends(require_roles(*_OE_ROLES)),
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
        remarks=body.remarks,
        tags=[],
    )
    db.add(party)
    await db.commit()
    await db.refresh(party)
    return {"id": party.id, "message": "Party created successfully"}


# ── Patch party ───────────────────────────────────────────────────────────────

@router.patch("/{party_id}")
async def patch_party(
    party_id: str,
    body: PartyPatch,
    user: CurrentUser = Depends(require_roles(*_OE_ROLES)),
    db: AsyncSession = Depends(get_db),
):
    party = (await db.execute(select(Party).where(Party.id == party_id))).scalar_one_or_none()
    if not party:
        raise HTTPException(status_code=404, detail="Party not found")

    for field, value in body.model_dump(exclude_none=True).items():
        setattr(party, field, value)
    await db.commit()
    return {"id": party.id, "message": "Party updated"}
