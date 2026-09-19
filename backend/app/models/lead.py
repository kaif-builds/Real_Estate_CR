"""
Lead model — sales leads from various sources.
Spec: §3.3 Lead. Prisma: schema.prisma L168–L183.
"""

import sqlalchemy as sa
from sqlalchemy.orm import relationship
from app.core.database import Base


class Lead(Base):
    __tablename__ = "leads"

    id = sa.Column(sa.String, primary_key=True)
    party_id = sa.Column(sa.String, sa.ForeignKey("parties.id"), nullable=False)
    lead_type = sa.Column(sa.String, nullable=False)     # LeadType enum
    source = sa.Column(sa.String, nullable=True)
    priority = sa.Column(sa.String, nullable=True, default="MEDIUM")  # LeadPriority enum
    assigned_to_id = sa.Column(sa.String, sa.ForeignKey("users.id"), nullable=True)
    status = sa.Column(sa.String, nullable=False, default="NEW")      # LeadStatus enum
    value = sa.Column(sa.Float, nullable=True)
    remarks = sa.Column(sa.Text, nullable=True)
    last_activity_at = sa.Column(sa.DateTime(timezone=True), nullable=True)
    next_follow_up_at = sa.Column(sa.DateTime(timezone=True), nullable=True)
    created_at = sa.Column(sa.DateTime(timezone=True), server_default=sa.func.now())
    updated_at = sa.Column(
        sa.DateTime(timezone=True),
        server_default=sa.func.now(),
        onupdate=sa.func.now(),
    )

    # Relationships
    party = relationship("Party", back_populates="leads", foreign_keys=[party_id])
    assigned_to = relationship("User", back_populates="assigned_leads", foreign_keys=[assigned_to_id])
    activity_logs = relationship("ActivityLog", back_populates="linked_lead", foreign_keys="ActivityLog.linked_lead_id")
    calls = relationship("Call", back_populates="lead", foreign_keys="Call.lead_id")
