"""
Leads CRUD — filtered list, create, read, patch.
Visible to SUPER_ADMIN and OFFICE_EXECUTIVE only. Spec §1.2.2, §3.3 Lead.
"""

import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import CurrentUser, UserRole, require_roles
from app.core.database import get_db
from app.models.lead import Lead
from app.models.party import Party
from app.models.user import User

router = APIRouter(prefix="/leads", tags=["leads"])

_OE_ROLES = (UserRole.SUPER_ADMIN, UserRole.OFFICE_EXECUTIVE)

# ── Request schemas ──────────────────────────────────────────────────────────

class LeadCreate(BaseModel):
    party_id: str
    lead_type: str                          # BUYER|SELLER|TENANT|LANDLORD|INVESTOR|CONSULTANT
    source: Optional[str] = None
    priority: str = "MEDIUM"               # LOW|MEDIUM|HIGH|CRITICAL
    assigned_to_id: Optional[str] = None
    value: Optional[float] = None
    status: str = "NEW"                    # NEW|CONTACTED|QUALIFIED|LOST
    remarks: Optional[str] = None


class LeadPatch(BaseModel):
    status: Optional[str] = None
    priority: Optional[str] = None
    assigned_to_id: Optional[str] = None
    value: Optional[float] = None
    next_follow_up_at: Optional[datetime] = None
    remarks: Optional[str] = None


# ── Helpers ──────────────────────────────────────────────────────────────────

def _row_to_dict(lead: Lead, party_name: str | None, assigned_name: str | None) -> dict:
    return {
        "id": lead.id,
        "party_id": lead.party_id,
        "party_name": party_name or "—",
        "source": lead.source,
        "lead_type": lead.lead_type,
        "status": lead.status,
        "priority": lead.priority,
        "assigned_to_id": lead.assigned_to_id,
        "assigned_to_name": assigned_name,
        "value": lead.value,
        "remarks": lead.remarks,
        "last_activity_at": lead.last_activity_at.isoformat() if lead.last_activity_at else None,
        "next_follow_up_at": lead.next_follow_up_at.isoformat() if lead.next_follow_up_at else None,
        "created_at": lead.created_at.isoformat() if lead.created_at else None,
        "updated_at": lead.updated_at.isoformat() if lead.updated_at else None,
    }


# ── List leads (with filters) ─────────────────────────────────────────────────

@router.get("")
async def list_leads(
    status: Optional[str] = None,
    lead_type: Optional[str] = None,
    priority: Optional[str] = None,
    search: Optional[str] = None,       # searches party name
    party_id: Optional[str] = None,     # filter by specific party (used in party detail)
    limit: int = Query(default=50, le=200),
    offset: int = 0,
    user: CurrentUser = Depends(require_roles(*_OE_ROLES)),
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

    # Base query with joins
    base_q = (
        select(Lead, Party.name.label("party_name"), User.name.label("assigned_name"))
        .join(Party, Lead.party_id == Party.id)
        .outerjoin(User, Lead.assigned_to_id == User.id)
    )
    if search:
        conds.append(Party.name.ilike(f"%{search}%"))
    if conds:
        base_q = base_q.where(*conds)

    # Total count (for pagination UI)
    count_q = select(func.count(Lead.id)).join(Party, Lead.party_id == Party.id)
    if search:
        count_q = count_q.where(Party.name.ilike(f"%{search}%"))
    if conds:
        count_q = count_q.where(*conds)

    total = (await db.execute(count_q)).scalar_one()

    rows = await db.execute(
        base_q
        .order_by(Lead.last_activity_at.desc().nullslast(), Lead.created_at.desc())
        .limit(limit)
        .offset(offset)
    )

    items = [_row_to_dict(lead, pn, an) for lead, pn, an in rows]
    return {"items": items, "total": total}


# ── Get single lead ──────────────────────────────────────────────────────────

@router.get("/{lead_id}")
async def get_lead(
    lead_id: str,
    user: CurrentUser = Depends(require_roles(*_OE_ROLES)),
    db: AsyncSession = Depends(get_db),
):
    row = (await db.execute(
        select(Lead, Party.name.label("pn"), User.name.label("an"))
        .join(Party, Lead.party_id == Party.id)
        .outerjoin(User, Lead.assigned_to_id == User.id)
        .where(Lead.id == lead_id)
    )).first()
    if not row:
        raise HTTPException(status_code=404, detail="Lead not found")
    return _row_to_dict(row[0], row[1], row[2])


# ── Create lead ──────────────────────────────────────────────────────────────

@router.post("", status_code=201)
async def create_lead(
    body: LeadCreate,
    user: CurrentUser = Depends(require_roles(*_OE_ROLES)),
    db: AsyncSession = Depends(get_db),
):
    # Validate party exists
    if not (await db.execute(select(Party.id).where(Party.id == body.party_id))).scalar_one_or_none():
        raise HTTPException(status_code=400, detail=f"Party '{body.party_id}' not found")

    lead = Lead(
        id=f"L-{uuid.uuid4().hex[:8].upper()}",
        party_id=body.party_id,
        lead_type=body.lead_type,
        source=body.source,
        priority=body.priority,
        assigned_to_id=body.assigned_to_id,
        value=body.value,
        status=body.status,
        remarks=body.remarks,
        last_activity_at=datetime.now(timezone.utc),
    )
    db.add(lead)
    await db.commit()
    await db.refresh(lead)
    return {"id": lead.id, "message": "Lead created successfully"}


# ── Patch lead ───────────────────────────────────────────────────────────────

@router.patch("/{lead_id}")
async def patch_lead(
    lead_id: str,
    body: LeadPatch,
    user: CurrentUser = Depends(require_roles(*_OE_ROLES)),
    db: AsyncSession = Depends(get_db),
):
    lead = (await db.execute(select(Lead).where(Lead.id == lead_id))).scalar_one_or_none()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    for field, value in body.model_dump(exclude_none=True).items():
        setattr(lead, field, value)
    lead.last_activity_at = datetime.now(timezone.utc)

    await db.commit()
    return {"id": lead.id, "message": "Lead updated"}
