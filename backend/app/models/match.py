"""Match model — property-requirement matching results."""

import sqlalchemy as sa
from app.core.database import Base, PgEnum
from app.models.enums import MatchTier, MatchStatus


class Match(Base):
    __tablename__ = "matches"

    id = sa.Column(sa.String, primary_key=True)
    requirement_id = sa.Column(sa.String, sa.ForeignKey("requirements.id"), nullable=False, index=True)
    property_id = sa.Column(sa.String, sa.ForeignKey("properties.id"), nullable=False, index=True)
    overall_score = sa.Column(sa.Float, nullable=True)
    tier = sa.Column(PgEnum(MatchTier, name='enum_match_tier'), nullable=True)
    status = sa.Column(PgEnum(MatchStatus, name='enum_match_status'), nullable=False, default="SUGGESTED")
    match_factors = sa.Column(sa.JSON, nullable=True)
    created_at = sa.Column(sa.DateTime(timezone=True), nullable=True)
