"""Match model — property-requirement matching results."""

import sqlalchemy as sa
from app.core.database import Base
from app.models.enums import MatchTier, MatchStatus


class Match(Base):
    __tablename__ = "matches"

    id = sa.Column(sa.String, primary_key=True)
    requirement_id = sa.Column(sa.String, sa.ForeignKey("requirements.id"), nullable=False, index=True)
    property_id = sa.Column(sa.String, sa.ForeignKey("properties.id"), nullable=False, index=True)
    overall_score = sa.Column(sa.Float, nullable=True)
    tier = sa.Column(sa.Enum(MatchTier, name='enum_match_tier', create_type=False), nullable=True)
    status = sa.Column(sa.Enum(MatchStatus, name='enum_match_status', create_type=False), nullable=False, default="SUGGESTED")
    match_factors = sa.Column(sa.JSON, nullable=True)
    created_at = sa.Column(sa.DateTime(timezone=True), nullable=True)
