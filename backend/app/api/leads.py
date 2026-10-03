"""
Leads CRUD — filtered list, create, read, patch, delete.
Super Admin + Office Executive access.
Denormalized name fields populated from FK lookup at write time.
"""

import enum as _enum
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import CurrentUser, UserRole, require_roles
from app.core.database import get_db
from app.models.campaign import Campaign
from app.models.follow_up import FollowUp
from app.models.lead import Lead
from app.models.opportunity import Opportunity
from app.models.party import Party
from app.models.referral_partner import ReferralPartner
from app.models.requirement import Requirement
from app.models.telemarketing_contact import TelemarketingContact
from app.models.transaction import Transaction
from app.models.user import User
from app.models.enums import (
    ChannelType,
    FollowUpEntityType,
    LeadPriority,
    LeadStatus,
    LeadType,
    UserRole as ModelUserRole,
)
from app.schemas import LeadCreate, LeadUpdate, LeadResponse

router = APIRouter(prefix="/leads", tags=["leads"])

_OE = (UserRole.SUPER_ADMIN, UserRole.OFFICE_EXECUTIVE)


def _iso(dt) -> str | None:
    if dt is None:
        return None
    if isinstance(dt, str):
        return dt
    return dt.isoformat()


def _parse_dt(v) -> datetime | None:
    if v is None:
        return None
    if isinstance(v, datetime):
        return v
    if isinstance(v, str):
        return datetime.fromisoformat(v.replace("Z", "+00:00"))
    return None


def _enum_val(v) -> str | None:
    if v is None:
        return None
    return v.value if hasattr(v, "value") else str(v)


def _to_enum(enum_cls: type[_enum.Enum], value):
    """Convert raw string to enum member (by value or name), or raise 422."""
    if value is None:
        return None
    if isinstance(value, enum_cls):
        return value
    # Match by value first (e.g. "Digital", "NEW"), then case-insensitive name
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
    channel_type: str | None = None,
    source: str | None = None,
    assigned_to_id: str | None = None,
    party_id: str | None = None,
    search: str | None = None,
    limit: int = Query(default=50, le=200),
    offset: int = 0,
    user: CurrentUser = Depends(require_roles(*_OE)),
    db: AsyncSession = Depends(get_db),
):
    conds = []
    if status:
        conds.append(Lead.status == _to_enum(LeadStatus, status))
    if lead_type:
        conds.append(Lead.lead_type == _to_enum(LeadType, lead_type))
    if priority:
        conds.append(Lead.priority == _to_enum(LeadPriority, priority))
    if channel_type:
        conds.append(Lead.channel_type == _to_enum(ChannelType, channel_type))
    if source:
        conds.append(Lead.source == source)
    if assigned_to_id:
        conds.append(Lead.assigned_to_id == assigned_to_id)
    if party_id:
        conds.append(Lead.party_id == party_id)

    # Search against party name, mobile, lead remarks, and lead ID
    if search:
        search_filter = or_(
            Lead.party_name.ilike(f"%{search}%"),
            Party.mobile.ilike(f"%{search}%"),
            Party.email.ilike(f"%{search}%"),
            Lead.remarks.ilike(f"%{search}%"),
            Lead.id.ilike(f"%{search}%"),
        )
        conds.append(search_filter)

    q = select(Lead).outerjoin(Party, Lead.party_id == Party.id)
    count_q = select(func.count(Lead.id)).outerjoin(Party, Lead.party_id == Party.id)

    if conds:
        q = q.where(*conds)
        count_q = count_q.where(*conds)

    total = (await db.execute(count_q)).scalar_one()
    rows = await db.execute(
        q.order_by(Lead.last_activity_at.desc().nullslast(), Lead.created_at.desc())
        .limit(limit)
        .offset(offset)
    )

    items = [_lead_dict(lead) for (lead,) in rows]
    return {"items": items, "total": total}


# ── Get single lead detail ────────────────────────────────────────────────────

@router.get("/{lead_id}")
async def get_lead(
    lead_id: str,
    user: CurrentUser = Depends(require_roles(*_OE)),
    db: AsyncSession = Depends(get_db),
):
    lead = (await db.execute(select(Lead).where(Lead.id == lead_id))).scalar_one_or_none()
    if not lead:
        raise HTTPException(404, "Lead not found")

    # Linked opportunities
    opps_rows = await db.execute(
        select(Opportunity).where(Opportunity.originating_lead_id == lead_id).order_by(Opportunity.id)
    )
    opportunities = [
        {
            "id": o.id,
            "stage": _enum_val(o.stage),
            "expected_value": o.expected_value,
            "probability": o.probability,
            "client_name": o.client_name,
            "property_short_loc": o.property_short_loc,
        }
        for (o,) in opps_rows
    ]

    # Linked follow-ups
    fu_rows = await db.execute(
        select(FollowUp)
        .where(
            FollowUp.entity_type == FollowUpEntityType.LEAD,
            FollowUp.entity_id == lead_id,
        )
        .order_by(FollowUp.due_date.asc())
    )
    follow_ups = [
        {
            "id": f.id,
            "purpose": f.purpose,
            "due_date": _iso(f.due_date),
            "status": _enum_val(f.status),
            "priority": _enum_val(f.priority),
            "responsible_name": f.responsible_name,
        }
        for (f,) in fu_rows
    ]

    # Linked telemarketing contacts
    tmc_rows = await db.execute(
        select(TelemarketingContact)
        .where(TelemarketingContact.converted_lead_id == lead_id)
        .order_by(TelemarketingContact.id)
    )
    telemarketing_contacts = [
        {
            "id": c.id,
            "name": c.name,
            "phone": c.phone,
            "status": _enum_val(c.status),
            "attempts_count": c.attempts_count,
        }
        for (c,) in tmc_rows
    ]

    # Linked transactions
    tx_rows = await db.execute(
        select(Transaction)
        .where(Transaction.originating_lead_id == lead_id)
        .order_by(Transaction.id)
    )
    transactions = [
        {
            "id": t.id,
            "transaction_type": _enum_val(t.transaction_type),
            "transaction_value": t.transaction_value,
            "payment_status": _enum_val(t.payment_status),
            "closed_date": str(t.closed_date) if t.closed_date else None,
        }
        for (t,) in tx_rows
    ]

    # Linked party requirements
    reqs_rows = await db.execute(
        select(Requirement)
        .where(Requirement.client_id == lead.party_id)
        .order_by(Requirement.id)
    )
    requirements = [
        {
            "id": r.id,
            "category": _enum_val(r.category),
            "intent": _enum_val(r.intent),
            "preferred_short_locs": r.preferred_short_locs or [],
            "min_budget": r.min_budget,
            "max_budget": r.max_budget,
            "status": _enum_val(r.status),
        }
        for (r,) in reqs_rows
    ]

    lead_data = _lead_dict(lead)
    return {
        "lead": lead_data,
        "opportunities": opportunities,
        "follow_ups": follow_ups,
        "telemarketing_contacts": telemarketing_contacts,
        "transactions": transactions,
        "requirements": requirements,
        # Flattened fields for direct access compatibility
        **lead_data,
    }


# ── Create lead ───────────────────────────────────────────────────────────────

@router.post("", status_code=201)
async def create_lead(
    body: LeadCreate,
    user: CurrentUser = Depends(require_roles(*_OE)),
    db: AsyncSession = Depends(get_db),
):
    # Validate party exists and resolve party_name from FK
    party = (await db.execute(select(Party).where(Party.id == body.party_id))).scalar_one_or_none()
    if not party:
        raise HTTPException(404, f"Party '{body.party_id}' not found")

    # If assigned_to_id provided, must exist AND must have AGENT role AND must be active
    assigned_name = None
    if body.assigned_to_id:
        u = (await db.execute(select(User).where(User.id == body.assigned_to_id))).scalar_one_or_none()
        if not u:
            raise HTTPException(404, f"User '{body.assigned_to_id}' not found")
        u_role = u.role.value if hasattr(u.role, "value") else str(u.role)
        if u_role != ModelUserRole.AGENT.value:
            raise HTTPException(
                status_code=422,
                detail=f"Lead can only be assigned to a user with the AGENT role. User '{u.name}' has role '{u_role}'.",
            )
        if u.status != "Active":
            raise HTTPException(
                status_code=422,
                detail=f"Cannot assign to an inactive user. User '{u.name}' is inactive.",
            )
        assigned_name = u.name

    # Resolve campaign name from FK lookup if campaign_id provided
    campaign_name = None
    if body.campaign_id:
        c = (await db.execute(select(Campaign).where(Campaign.id == body.campaign_id))).scalar_one_or_none()
        if not c:
            raise HTTPException(404, f"Campaign '{body.campaign_id}' not found")
        campaign_name = c.name

    # Resolve referral partner name from FK lookup if referral_partner_id provided
    rp_name = None
    if body.referral_partner_id:
        rp = (await db.execute(select(ReferralPartner).where(ReferralPartner.id == body.referral_partner_id))).scalar_one_or_none()
        if not rp:
            raise HTTPException(404, f"ReferralPartner '{body.referral_partner_id}' not found")
        rp_name = rp.name

    now = datetime.now(timezone.utc)
    enquiry_dt = _parse_dt(body.enquiry_at) or now

    lead = Lead(
        id=f"L-{uuid.uuid4().hex[:8].upper()}",
        party_id=body.party_id,
        party_name=party.name,
        channel_type=_to_enum(ChannelType, body.channel_type),
        source=body.source,
        lead_type=_to_enum(LeadType, body.lead_type),
        status=_to_enum(LeadStatus, body.status) or LeadStatus.NEW,
        priority=_to_enum(LeadPriority, body.priority) or LeadPriority.MEDIUM,
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
        enquiry_at=enquiry_dt,
        last_activity_at=now,
        created_at=now,
    )
    db.add(lead)
    await db.flush()
    return {"id": lead.id, "message": "Lead created"}


# ── Patch lead ────────────────────────────────────────────────────────────────

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

    updates = body.model_dump(exclude_unset=True)

    # If party_id is changing, validate and update denormalized party_name
    if "party_id" in updates:
        new_party_id = updates["party_id"]
        if new_party_id:
            p = (await db.execute(select(Party).where(Party.id == new_party_id))).scalar_one_or_none()
            if not p:
                raise HTTPException(404, f"Party '{new_party_id}' not found")
            lead.party_id = p.id
            lead.party_name = p.name

    # If assigned_to_id is changing, validate AGENT role, active status, and resolve name
    if "assigned_to_id" in updates:
        new_uid = updates["assigned_to_id"]
        if new_uid:
            u = (await db.execute(select(User).where(User.id == new_uid))).scalar_one_or_none()
            if not u:
                raise HTTPException(404, f"User '{new_uid}' not found")
            u_role = u.role.value if hasattr(u.role, "value") else str(u.role)
            if u_role != ModelUserRole.AGENT.value:
                raise HTTPException(
                    status_code=422,
                    detail=f"Lead can only be assigned to a user with the AGENT role. User '{u.name}' has role '{u_role}'.",
                )
            if u.status != "Active":
                raise HTTPException(
                    status_code=422,
                    detail=f"Cannot assign to an inactive user. User '{u.name}' is inactive.",
                )
            lead.assigned_to_id = u.id
            lead.assigned_to_name = u.name
        else:
            lead.assigned_to_id = None
            lead.assigned_to_name = None

    # If campaign_id is changing, resolve name
    if "campaign_id" in updates:
        new_cid = updates["campaign_id"]
        if new_cid:
            c = (await db.execute(select(Campaign).where(Campaign.id == new_cid))).scalar_one_or_none()
            if not c:
                raise HTTPException(404, f"Campaign '{new_cid}' not found")
            lead.campaign_id = c.id
            lead.campaign_name = c.name
        else:
            lead.campaign_id = None
            lead.campaign_name = None

    # If referral_partner_id is changing, resolve name
    if "referral_partner_id" in updates:
        new_rpid = updates["referral_partner_id"]
        if new_rpid:
            rp = (await db.execute(select(ReferralPartner).where(ReferralPartner.id == new_rpid))).scalar_one_or_none()
            if not rp:
                raise HTTPException(404, f"ReferralPartner '{new_rpid}' not found")
            lead.referral_partner_id = rp.id
            lead.referral_partner_name = rp.name
        else:
            lead.referral_partner_id = None
            lead.referral_partner_name = None

    # Validate and set enums
    if "status" in updates and updates["status"] is not None:
        lead.status = _to_enum(LeadStatus, updates["status"])
    if "priority" in updates and updates["priority"] is not None:
        lead.priority = _to_enum(LeadPriority, updates["priority"])
    if "lead_type" in updates and updates["lead_type"] is not None:
        lead.lead_type = _to_enum(LeadType, updates["lead_type"])
    if "channel_type" in updates:
        lead.channel_type = _to_enum(ChannelType, updates["channel_type"])

    # Parse and set date fields
    if "next_follow_up_at" in updates:
        lead.next_follow_up_at = _parse_dt(updates["next_follow_up_at"])
    if "enquiry_at" in updates:
        lead.enquiry_at = _parse_dt(updates["enquiry_at"])

    # Update scalar fields
    for field in ("value", "remarks", "referral_code", "ad_reference", "source"):
        if field in updates:
            setattr(lead, field, updates[field])

    lead.last_activity_at = datetime.now(timezone.utc)
    await db.flush()
    return {"id": lead.id, "message": "Lead updated"}


# ── Delete lead ───────────────────────────────────────────────────────────────

@router.delete("/{lead_id}")
async def delete_lead(
    lead_id: str,
    user: CurrentUser = Depends(require_roles(*_OE)),
    db: AsyncSession = Depends(get_db),
):
    lead = (await db.execute(select(Lead).where(Lead.id == lead_id))).scalar_one_or_none()
    if not lead:
        raise HTTPException(404, "Lead not found")

    # Check for linked records across entities
    checks = [
        (Opportunity, Opportunity.originating_lead_id == lead_id, "opportunity", "opportunities"),
        (
            FollowUp,
            (FollowUp.entity_type == FollowUpEntityType.LEAD) & (FollowUp.entity_id == lead_id),
            "follow-up",
            "follow-ups",
        ),
        (Transaction, Transaction.originating_lead_id == lead_id, "transaction", "transactions"),
        (
            TelemarketingContact,
            TelemarketingContact.converted_lead_id == lead_id,
            "telemarketing contact",
            "telemarketing contacts",
        ),
    ]

    linked_items: list[str] = []
    for model, condition, singular, plural in checks:
        cnt = (await db.execute(select(func.count()).select_from(model).where(condition))).scalar_one()
        if cnt > 0:
            linked_items.append(f"{cnt} {singular if cnt == 1 else plural}")

    if linked_items:
        detail_msg = f"Cannot delete: this lead has {', '.join(linked_items)}. Reassign or remove these first."
        raise HTTPException(status_code=409, detail=detail_msg)

    await db.delete(lead)
    await db.flush()
    return {"id": lead_id, "message": "Lead deleted successfully"}
