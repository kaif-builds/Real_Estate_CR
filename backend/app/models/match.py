"""
Match model — links requirements to properties with scoring.
Spec: §3.3 Match. Prisma: schema.prisma L238–L252.
"""

import sqlalchemy as sa
from sqlalchemy.orm import relationship
from app.core.database import Base


class Match(Base):
    __tablename__ = "matches"

    id = sa.Column(sa.String, primary_key=True)
    requirement_id = sa.Column(sa.String, sa.ForeignKey("requirements.id"), nullable=False, index=True)
    property_id = sa.Column(sa.String, sa.ForeignKey("properties.id"), nullable=False, index=True)
    score = sa.Column(sa.Float, nullable=False)           # 0–100
    tier = sa.Column(sa.String, nullable=False)           # MatchTier enum
    # score_breakdown: JSON object e.g. {"location": "PASS", "budget": "WARNING (...)"}
    score_breakdown = sa.Column(sa.JSON, nullable=True)
    status = sa.Column(sa.String, nullable=False, default="SUGGESTED")  # MatchStatus enum
    reject_reason = sa.Column(sa.Text, nullable=True)
    created_at = sa.Column(sa.DateTime(timezone=True), server_default=sa.func.now())
    updated_at = sa.Column(
        sa.DateTime(timezone=True),
        server_default=sa.func.now(),
        onupdate=sa.func.now(),
    )

    # Relationships
    requirement = relationship("Requirement", back_populates="matches", foreign_keys=[requirement_id])
    property = relationship("Property", back_populates="matches", foreign_keys=[property_id])
