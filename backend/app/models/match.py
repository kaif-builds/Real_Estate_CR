"""
Match model — property-requirement matching results.
Matches MatchRow from frontend mockData.ts.
"""

import sqlalchemy as sa
from app.core.database import Base


class Match(Base):
    __tablename__ = "matches"

    id = sa.Column(sa.String, primary_key=True)  # e.g. M-3001
    requirement_id = sa.Column(sa.String, sa.ForeignKey("requirements.id"), nullable=False, index=True)
    property_id = sa.Column(sa.String, sa.ForeignKey("properties.id"), nullable=False, index=True)
    overall_score = sa.Column(sa.Float, nullable=True)
    # MatchTier: 'HIGH' | 'GOOD' | 'POSSIBLE'
    tier = sa.Column(sa.String, nullable=True)
    # MatchStatus: 'SUGGESTED' | 'SHARED' | 'VISIT_SCHEDULED' | 'REJECTED' | 'SHORTLISTED'
    status = sa.Column(sa.String, nullable=False, default="SUGGESTED")
    # JSON object with scoring breakdown
    match_factors = sa.Column(sa.JSON, nullable=True)
    created_at = sa.Column(sa.String, nullable=True)  # ISO datetime
