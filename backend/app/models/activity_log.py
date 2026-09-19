"""
ActivityLog model — chronological feed of all system activities.
Spec: §3.3 ActivityLog. Prisma: schema.prisma L254–L269.
"""

import sqlalchemy as sa
from sqlalchemy.orm import relationship
from app.core.database import Base


class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = sa.Column(sa.String, primary_key=True)
    type = sa.Column(sa.String, nullable=False)            # ActivityType enum
    notes = sa.Column(sa.Text, nullable=True)
    created_by_id = sa.Column(sa.String, sa.ForeignKey("users.id"), nullable=False)
    occurred_at = sa.Column(sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now())
    created_at = sa.Column(sa.DateTime(timezone=True), server_default=sa.func.now())

    # Polymorphic FK links (all optional — at least one should be set)
    linked_party_id = sa.Column(sa.String, sa.ForeignKey("parties.id"), nullable=True)
    linked_lead_id = sa.Column(sa.String, sa.ForeignKey("leads.id"), nullable=True)
    linked_requirement_id = sa.Column(sa.String, sa.ForeignKey("requirements.id"), nullable=True)
    linked_property_id = sa.Column(sa.String, sa.ForeignKey("properties.id"), nullable=True)
    linked_opportunity_id = sa.Column(sa.String, sa.ForeignKey("opportunities.id"), nullable=True)

    # Relationships
    created_by = relationship("User", back_populates="activity_logs", foreign_keys=[created_by_id])
    linked_party = relationship("Party", foreign_keys=[linked_party_id])
    linked_lead = relationship("Lead", back_populates="activity_logs", foreign_keys=[linked_lead_id])
    linked_requirement = relationship("Requirement", back_populates="activity_logs", foreign_keys=[linked_requirement_id])
    linked_property = relationship("Property", foreign_keys=[linked_property_id])
    linked_opportunity = relationship("Opportunity", foreign_keys=[linked_opportunity_id])
