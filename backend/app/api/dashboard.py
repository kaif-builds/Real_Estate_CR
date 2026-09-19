"""
Dashboard API endpoints — one per dashboard type, all backed by real Postgres queries.
Spec: §1.2 (OE dashboard), §1.4 (Agent dashboard), §1.5 (Client portal)
"""

from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import CurrentUser, UserRole, require_roles
from app.core.database import get_db
from app.core.staleness import (
    TERMINAL_PROPERTY_STATUSES,
    age_days,
    stale_property_cutoff,
)
from app.models.agent_stats import AgentStats
from app.models.follow_up import FollowUp
from app.models.lead import Lead
from app.models.match import Match
from app.models.party import Party
from app.models.property import Property
from app.models.requirement import Requirement
from app.models.user import User
from app.models.visit import Visit

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


# ── Office Executive / Super Admin dashboard ──────────────────────────────────

@router.get("/office")
async def office_dashboard(
    user: CurrentUser = Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.OFFICE_EXECUTIVE)),
    db: AsyncSession = Depends(get_db),
):
    """
    Summary cards, today's follow-up queue, and stale records alert.
    Spec §1.2.1
    """
    now = datetime.now(timezone.utc)

    # ── Summary counts ──────────────────────────────────────────────────────
    active_leads = (await db.execute(
        select(func.count(Lead.id)).where(Lead.status.notin_(["LOST"]))
    )).scalar_one()

    active_requirements = (await db.execute(
        select(func.count(Requirement.id)).where(Requirement.status == "ACTIVE")
    )).scalar_one()

    active_inventory = (await db.execute(
        select(func.count(Property.id)).where(
            Property.status.in_(["AVAILABLE", "ACTIVE"])
        )
    )).scalar_one()

    pending_follow_ups = (await db.execute(
        select(func.count(FollowUp.id)).where(FollowUp.status == "PENDING")
    )).scalar_one()

    # Overdue = PENDING and scheduled_at is already in the past
    overdue_follow_ups = (await db.execute(
        select(func.count(FollowUp.id)).where(
            FollowUp.status == "PENDING",
            FollowUp.scheduled_at < now,
        )
    )).scalar_one()

    # ── Today's follow-up queue ─────────────────────────────────────────────
    # All PENDING follow-ups ordered by date (overdue first, then upcoming).
    # We surface all PENDING rather than just "today" because overdue ones
    # need equal visibility — they're already late.
    fups_q = await db.execute(
        select(FollowUp, User.name.label("responsible_name"), Party.name.label("party_name"))
        .outerjoin(User, FollowUp.responsible_id == User.id)
        .outerjoin(Party, FollowUp.linked_party_id == Party.id)
        .where(FollowUp.status == "PENDING")
        .order_by(FollowUp.scheduled_at.asc())
        .limit(25)
    )
    todays_queue = []
    for fup, resp_name, party_name in fups_q:
        is_overdue = fup.scheduled_at is not None and fup.scheduled_at < now
        todays_queue.append({
            "id": fup.id,
            "client_name": party_name or "—",
            "type": fup.follow_up_type or "General",
            "purpose": fup.purpose,
            "priority": fup.priority,
            "status": "OVERDUE" if is_overdue else fup.status,
            "scheduled_at": fup.scheduled_at.isoformat() if fup.scheduled_at else None,
            "responsible_name": resp_name or "—",
        })

    # ── Stale records ───────────────────────────────────────────────────────
    # Properties unverified for > 5 days.
    # CRITICAL: exclude TERMINAL statuses (Sold/Rented/Leased/Withdrawn/Inactive).
    # A closed property must never appear as stale — this was a real bug in the
    # original build that we're explicitly guarding against here.
    cutoff = stale_property_cutoff()
    stale_q = await db.execute(
        select(Property)
        .where(
            Property.status.notin_(list(TERMINAL_PROPERTY_STATUSES)),
            Property.last_verified_at < cutoff,
        )
        .order_by(Property.last_verified_at.asc())
    )
    stale_records = []
    for (prop,) in stale_q:
        stale_records.append({
            "id": prop.id,
            "record_type": "Property",
            "name": prop.short_loc,
            "age_days": age_days(prop.last_verified_at),
            "last_verified_at": prop.last_verified_at.isoformat() if prop.last_verified_at else None,
            "status": prop.status,
        })

    return {
        "summary": {
            "active_leads": active_leads,
            "active_requirements": active_requirements,
            "active_inventory": active_inventory,
            "pending_follow_ups": pending_follow_ups,
            "overdue_follow_ups": overdue_follow_ups,
        },
        "todays_queue": todays_queue,
        "stale_records": stale_records,
    }


# ── Field Agent dashboard ─────────────────────────────────────────────────────

@router.get("/agent")
async def agent_dashboard(
    user: CurrentUser = Depends(require_roles(UserRole.AGENT)),
    db: AsyncSession = Depends(get_db),
):
    """
    Agent stats: today's visits, week completed, pending reports.
    Spec §1.4 — the map/location data is client-side only (browser geolocation).
    """
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = today_start - timedelta(days=now.weekday())

    # Use pre-aggregated agent_stats if available; fall back to live count
    stats_row = (await db.execute(
        select(AgentStats).where(AgentStats.agent_id == user.id)
    )).scalar_one_or_none()

    if stats_row:
        today_visits = stats_row.today_visits
        week_completed = stats_row.week_completed
        availability = stats_row.status
        rating = stats_row.rating
    else:
        today_visits = (await db.execute(
            select(func.count(Visit.id)).where(
                Visit.agent_id == user.id,
                Visit.planned_date >= today_start,
                Visit.status.in_(["COMPLETED", "SUBMITTED", "APPROVED"]),
            )
        )).scalar_one()
        week_completed = (await db.execute(
            select(func.count(Visit.id)).where(
                Visit.agent_id == user.id,
                Visit.planned_date >= week_start,
                Visit.status.in_(["COMPLETED", "SUBMITTED", "APPROVED"]),
            )
        )).scalar_one()
        availability = "AVAILABLE"
        rating = None

    pending_reports = (await db.execute(
        select(func.count(Visit.id)).where(
            Visit.agent_id == user.id,
            Visit.status == "SUBMITTED",
        )
    )).scalar_one()

    return {
        "stats": {
            "today_visits": today_visits,
            "week_completed": week_completed,
            "pending_reports": pending_reports,
            "availability": availability,
            "rating": rating,
        }
    }


# ── Client portal dashboard ───────────────────────────────────────────────────

@router.get("/client")
async def client_dashboard(
    user: CurrentUser = Depends(require_roles(UserRole.CLIENT)),
    db: AsyncSession = Depends(get_db),
):
    """
    Client's requirement, shared properties (match reactions), visit history.
    Spec §1.5
    """
    # Resolve party linked to this user account
    user_row = (await db.execute(
        select(User).where(User.id == user.id)
    )).scalar_one_or_none()
    party_id = user_row.party_id if user_row else None

    # ── Active requirement ──────────────────────────────────────────────────
    req_row = None
    if party_id:
        res = await db.execute(
            select(Requirement)
            .where(
                Requirement.client_id == party_id,
                Requirement.status == "ACTIVE",
            )
            .limit(1)
        )
        req_row = res.scalar_one_or_none()

    requirement = None
    consultant = None
    if req_row:
        requirement = {
            "id": req_row.id,
            "category": req_row.category,
            "intent": req_row.intent,
            "preferred_short_locs": req_row.preferred_short_locs or [],
            "min_budget": req_row.min_budget,
            "max_budget": req_row.max_budget,
            "status": req_row.status,
        }
        if req_row.assigned_to_id:
            cons = (await db.execute(
                select(User).where(User.id == req_row.assigned_to_id)
            )).scalar_one_or_none()
            if cons:
                consultant = {"name": cons.name, "email": cons.email}

    # ── Shared properties (matches with status SHARED) ──────────────────────
    shared = []
    if req_row:
        shared_q = await db.execute(
            select(Match, Property)
            .join(Property, Match.property_id == Property.id)
            .where(
                Match.requirement_id == req_row.id,
                Match.status == "SHARED",
            )
            .order_by(Match.score.desc())
        )
        for match, prop in shared_q:
            shared.append({
                "match_id": match.id,
                "property_id": prop.id,
                "short_loc": prop.short_loc,
                "category": prop.category,
                "price": prop.price,
                "score": match.score,
                "tier": match.tier,
                "match_status": match.status,
            })

    # ── Visit history ───────────────────────────────────────────────────────
    visits = []
    if req_row:
        visits_q = await db.execute(
            select(Visit, Property, User)
            .join(Property, Visit.property_id == Property.id)
            .join(User, Visit.agent_id == User.id)
            .where(Visit.requirement_id == req_row.id)
            .order_by(Visit.planned_date.desc())
        )
        for visit, prop, agent in visits_q:
            visits.append({
                "id": visit.id,
                "property_short_loc": prop.short_loc,
                "agent_name": agent.name,
                "status": visit.status,
                "planned_date": visit.planned_date.isoformat() if visit.planned_date else None,
                "outcome_json": visit.outcome_json,
            })

    return {
        "requirement": requirement,
        "consultant": consultant,
        "shared_properties": shared,
        "visit_history": visits,
    }
