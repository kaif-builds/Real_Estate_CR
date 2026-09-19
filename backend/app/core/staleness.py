"""
Staleness detection — reusable across dashboard, reports, demand-supply.
Spec: §4.2

KEY INVARIANT: Properties with status in TERMINAL_PROPERTY_STATUSES are NEVER
flagged as stale, regardless of last_verified_at age. A closed-out property
(Sold/Rented/Leased/Withdrawn) must never appear in stale records — this was
a real bug fixed in the original build.
"""

from datetime import datetime, timezone, timedelta

# ── Terminal statuses — NEVER flag these as stale ─────────────────────────────
TERMINAL_PROPERTY_STATUSES = frozenset({
    "SOLD", "RENTED", "LEASED", "WITHDRAWN", "INACTIVE",
})

TERMINAL_LEAD_STATUSES = frozenset({"LOST"})
TERMINAL_OPPORTUNITY_STAGES = frozenset({"WON", "LOST"})

STALE_PROPERTY_DAYS = 5   # spec §4.2 default threshold


def age_days(dt: datetime | None) -> int:
    """Integer age in full days from a datetime to now. None → 0."""
    if dt is None:
        return 0
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return max(0, (datetime.now(timezone.utc) - dt).days)


def stale_property_cutoff(threshold_days: int = STALE_PROPERTY_DAYS) -> datetime:
    """Return the cutoff datetime: properties with last_verified_at before this are stale."""
    return datetime.now(timezone.utc) - timedelta(days=threshold_days)
