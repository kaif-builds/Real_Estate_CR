"""
AgentStats model — per-agent availability and performance metrics.
Spec: §3.3 AgentStats. Mock: mockData.ts L171–L175.
"""

import sqlalchemy as sa
from sqlalchemy.orm import relationship
from app.core.database import Base


class AgentStats(Base):
    __tablename__ = "agent_stats"

    id = sa.Column(sa.Integer, primary_key=True, autoincrement=True)
    agent_id = sa.Column(sa.String, sa.ForeignKey("users.id"), nullable=False, unique=True, index=True)
    status = sa.Column(sa.String, nullable=False, default="AVAILABLE")  # AgentAvailability enum
    today_visits = sa.Column(sa.Integer, nullable=False, default=0)
    week_completed = sa.Column(sa.Integer, nullable=False, default=0)
    rating = sa.Column(sa.Float, nullable=True)
    last_location = sa.Column(sa.String, nullable=True)
    last_seen_at = sa.Column(sa.DateTime(timezone=True), nullable=True)
    updated_at = sa.Column(
        sa.DateTime(timezone=True),
        server_default=sa.func.now(),
        onupdate=sa.func.now(),
    )

    # Relationships
    agent = relationship("User", back_populates="agent_stats", foreign_keys=[agent_id])
