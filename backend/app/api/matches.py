"""
Matches — list, update status, and run matching engine.
Super Admin + Office Executive access.

The matching engine scoring logic is ported 1:1 from the frontend's
runMatchingEngine() in ai-assistant/page.tsx (Module 8 Part 3):

  Weights:
    Location  40 pts  (preferred=40, alternate=25, other=10)
    Budget    30 pts  (in range=30, ≤110% max=20, else=5, no budget=15)
    Type      20 pts  (always PASS since we pre-filter by category)
    Avail     10 pts  (AVAILABLE/NEW=10, else=5)
  Total       100 pts

  Tier thresholds:
    HIGH     ≥ 90
    GOOD     ≥ 75
    POSSIBLE ≥ 60    (below 50 is discarded)
"""

import enum as _enum
import uuid
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.orm.attributes import flag_modified
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import CurrentUser, UserRole, require_roles
from app.core.database import get_db
from app.core.staleness import TERMINAL_PROPERTY_STATUSES
from app.models.match import Match
from app.models.property import Property
from app.models.requirement import Requirement
from app.models.enums import MatchTier, MatchStatus
from app.schemas import MatchUpdate, MatchResponse, MatchRunResponse


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

router = APIRouter(prefix="/matches", tags=["matches"])

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


def _match_dict(m: Match, prop_status: Any = None) -> dict:
    """Convert Match ORM → dict matching frontend MatchRow."""
    factors = m.match_factors or {}
    status_str = _enum_val(prop_status)
    if status_str is None:
        is_unavailable = True
    else:
        is_unavailable = status_str in TERMINAL_PROPERTY_STATUSES

    return {
        "id": m.id,
        "requirement_id": m.requirement_id,
        "client_name": factors.get("client_name"),
        "property_id": m.property_id,
        "short_loc": factors.get("short_loc"),
        "property_category": factors.get("property_category"),
        "property_price": factors.get("property_price"),
        "score": m.overall_score or 0,
        "tier": _enum_val(m.tier),
        "status": _enum_val(m.status),
        "score_breakdown": factors.get("score_breakdown"),
        "property_status": status_str,
        "property_unavailable": is_unavailable,
    }


# ═══════════════════════════════════════════════════════════════════════════════
# MATCHING ENGINE — ported from frontend runMatchingEngine()
# ═══════════════════════════════════════════════════════════════════════════════

# Property statuses eligible for matching
_MATCHABLE_STATUSES = {"AVAILABLE", "NEW", "UNDER_NEGOTIATION"}


def _score_property(req: Requirement, prop: Property) -> tuple[float, dict[str, str]] | None:
    """
    Score a single property against a requirement.
    Returns (score, breakdown) or None if the property is filtered out.

    Exact port of frontend scoring logic:
      - Category must match (pre-filter)
      - Status must be AVAILABLE, NEW, or UNDER_NEGOTIATION
      - Location: preferred=40, alternate=25, other=10
      - Budget: in range=30, ≤110% max=20, else=5, unspecified=15
      - Type: always 20 (same category pre-filtered)
      - Availability: AVAILABLE/NEW=10, else=5
      - Minimum score threshold: 50
    """
    req_category = _enum_val(req.category)
    prop_category = _enum_val(prop.category)
    prop_status = _enum_val(prop.status)

    # Pre-filter: category must match
    if prop_category != req_category:
        return None

    # Pre-filter: property must be in matchable status
    if prop_status not in _MATCHABLE_STATUSES:
        return None

    breakdown: dict[str, str] = {}
    score = 0.0

    # ── Location (40 pts max) ─────────────────────────────────────────────
    preferred = req.preferred_short_locs or []
    alternates = req.alternate_locs or []

    if prop.short_loc in preferred:
        score += 40
        breakdown["location"] = "PASS"
    elif prop.short_loc in alternates:
        score += 25
        breakdown["location"] = "WARNING (alternate location)"
    else:
        score += 10
        breakdown["location"] = f"WARNING (different area: {prop.short_loc})"

    # ── Budget (30 pts max) ───────────────────────────────────────────────
    if req.min_budget is not None and req.max_budget is not None:
        if req.min_budget <= (prop.price or 0) <= req.max_budget:
            score += 30
            breakdown["budget"] = "PASS"
        elif (prop.price or 0) <= req.max_budget * 1.1:
            score += 20
            over_pct = round(((prop.price - req.max_budget) / req.max_budget) * 100)
            breakdown["budget"] = f"WARNING ({over_pct}% over max)"
        else:
            score += 5
            breakdown["budget"] = "FAIL (out of budget range)"
    else:
        score += 15
        breakdown["budget"] = "WARNING (no budget specified)"

    # ── Type (20 pts) — always PASS since we pre-filter by category ──────
    score += 20
    breakdown["type"] = "PASS"

    # ── Availability (10 pts) ─────────────────────────────────────────────
    if prop_status in ("AVAILABLE", "NEW"):
        score += 10
        breakdown["availability"] = "PASS"
    else:
        score += 5
        breakdown["availability"] = f"WARNING ({prop_status.lower()})"

    # ── Minimum threshold ─────────────────────────────────────────────────
    if score < 50:
        return None

    return (score, breakdown)


def _tier_for_score(score: float) -> str:
    """HIGH ≥ 90, GOOD ≥ 75, POSSIBLE ≥ 60."""
    if score >= 90:
        return "HIGH"
    elif score >= 75:
        return "GOOD"
    else:
        return "POSSIBLE"


# ── List matches for a requirement ───────────────────────────────────────────

@router.get("")
async def list_matches(
    requirement_id: str = Query(..., description="Requirement ID to list matches for"),
    limit: int = Query(default=50, le=200),
    offset: int = 0,
    user: CurrentUser = Depends(require_roles(*_OE)),
    db: AsyncSession = Depends(get_db),
):
    conds = [Match.requirement_id == requirement_id]

    count_q = select(func.count(Match.id)).where(*conds)
    total = (await db.execute(count_q)).scalar_one()

    rows = await db.execute(
        select(Match, Property.status)
        .outerjoin(Property, Match.property_id == Property.id)
        .where(*conds)
        .order_by(Match.overall_score.desc().nullslast())
        .limit(limit).offset(offset)
    )

    items = [_match_dict(m, prop_status) for m, prop_status in rows]
    return {"items": items, "total": total}


# ── Run matching engine ──────────────────────────────────────────────────────

@router.post("/run", status_code=200)
async def run_matching_engine(
    requirement_id: str = Query(..., description="Requirement ID to run matching for"),
    user: CurrentUser = Depends(require_roles(*_OE)),
    db: AsyncSession = Depends(get_db),
):
    """
    Run the matching engine for a requirement:
    1. Load the requirement
    2. Load all properties
    3. Score each property against the requirement
    4. Delete existing SUGGESTED matches for this requirement
    5. Persist new matches
    6. Return results with summary
    """
    # Load requirement
    req = (await db.execute(
        select(Requirement).where(Requirement.id == requirement_id)
    )).scalar_one_or_none()
    if not req:
        raise HTTPException(404, f"Requirement '{requirement_id}' not found")

    # Load all properties (the engine scores and filters them)
    props_result = await db.execute(select(Property))
    all_properties = [p for (p,) in props_result]

    # Score each property
    scored: list[tuple[Property, float, dict[str, str]]] = []
    for prop in all_properties:
        result = _score_property(req, prop)
        if result:
            score, breakdown = result
            scored.append((prop, score, breakdown))

    # Sort by score descending
    scored.sort(key=lambda x: x[1], reverse=True)

    # Delete existing SUGGESTED matches for this requirement (don't touch user-modified ones)
    existing_suggested = await db.execute(
        select(Match)
        .where(Match.requirement_id == requirement_id, Match.status == "SUGGESTED")
    )
    for (old_match,) in existing_suggested:
        await db.delete(old_match)

    # Load existing non-SUGGESTED matches for this requirement to prevent duplicates
    existing_non_suggested = await db.execute(
        select(Match)
        .where(Match.requirement_id == requirement_id, Match.status != "SUGGESTED")
    )
    existing_by_prop_id: dict[str, Match] = {
        m.property_id: m for (m,) in existing_non_suggested
    }

    # Persist new matches or refresh existing non-SUGGESTED matches
    now = datetime.now(timezone.utc)
    new_matches: list[dict] = []

    for prop, score, breakdown in scored:
        tier = _tier_for_score(score)

        if prop.id in existing_by_prop_id:
            # Refresh existing non-SUGGESTED match (update score, tier, breakdown; preserve status & user notes)
            existing_match = existing_by_prop_id[prop.id]
            existing_match.overall_score = score
            existing_match.tier = _to_enum(MatchTier, tier)
            factors = dict(existing_match.match_factors or {})
            factors["client_name"] = req.client_name
            factors["short_loc"] = prop.short_loc
            factors["property_category"] = _enum_val(prop.category)
            factors["property_price"] = prop.price
            factors["score_breakdown"] = breakdown
            existing_match.match_factors = factors
            flag_modified(existing_match, "match_factors")
            new_matches.append(_match_dict(existing_match, prop.status))
        else:
            # Insert new SUGGESTED match
            match_id = f"M-{uuid.uuid4().hex[:6].upper()}"
            match = Match(
                id=match_id,
                requirement_id=requirement_id,
                property_id=prop.id,
                overall_score=score,
                tier=_to_enum(MatchTier, tier),
                status=MatchStatus.SUGGESTED,
                match_factors={
                    "client_name": req.client_name,
                    "short_loc": prop.short_loc,
                    "property_category": _enum_val(prop.category),
                    "property_price": prop.price,
                    "score_breakdown": breakdown,
                },
                created_at=now,
            )
            db.add(match)
            new_matches.append(_match_dict(match, prop.status))

    await db.flush()

    # Build summary
    high = sum(1 for m in new_matches if m["tier"] == "HIGH")
    good = sum(1 for m in new_matches if m["tier"] == "GOOD")
    possible = sum(1 for m in new_matches if m["tier"] == "POSSIBLE")
    parts = []
    if high > 0:
        parts.append(f"{high} High")
    if good > 0:
        parts.append(f"{good} Good")
    if possible > 0:
        parts.append(f"{possible} Possible")

    total = len(new_matches)
    if total > 0:
        summary = f"Found {total} matching {'property' if total == 1 else 'properties'} — {', '.join(parts)}."
    else:
        summary = "No matching properties found."

    return {"matches": new_matches, "summary": summary, "total": total}


# ── Update match status ──────────────────────────────────────────────────────

@router.patch("/{match_id}")
async def patch_match(
    match_id: str,
    body: MatchUpdate,
    user: CurrentUser = Depends(require_roles(*_OE)),
    db: AsyncSession = Depends(get_db),
):
    match = (await db.execute(select(Match).where(Match.id == match_id))).scalar_one_or_none()
    if not match:
        raise HTTPException(404, "Match not found")

    match.status = _to_enum(MatchStatus, body.status)
    await db.flush()
    return {"id": match.id, "message": f"Match status updated to {body.status}"}
