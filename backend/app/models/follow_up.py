"""
FollowUp model — scheduled follow-up activities.
Spec: §3.3 FollowUp. Prisma: (inferred from mock data §3.3).
"""

import sqlalchemy as sa
from sqlalchemy.orm import relationship
from app.core.database import Base


class FollowUp(Base):
    __tablename__ = "follow_ups"

    id = sa.Column(sa.String, primary_key=True)
    responsible_id = sa.Column(sa.String, sa.ForeignKey("users.id"), nullable=False, index=True)
    # Linked record (at most one should be set)
    linked_party_id = sa.Column(sa.String, sa.ForeignKey("parties.id"), nullable=True)
    linked_lead_id = sa.Column(sa.String, sa.ForeignKey("leads.id"), nullable=True)
    linked_requirement_id = sa.Column(sa.String, sa.ForeignKey("requirements.id"), nullable=True)
    linked_opportunity_id = sa.Column(sa.String, sa.ForeignKey("opportunities.id"), nullable=True)
    follow_up_type = sa.Column(sa.String, nullable=True)   # e.g. "Opportunity", "Requirement"
    purpose = sa.Column(sa.String, nullable=False)
    priority = sa.Column(sa.String, nullable=False, default="MEDIUM")  # LeadPriority enum values
    status = sa.Column(sa.String, nullable=False, default="PENDING")   # FollowUpStatus enum
    scheduled_at = sa.Column(sa.DateTime(timezone=True), nullable=False)
    completed_at = sa.Column(sa.DateTime(timezone=True), nullable=True)
    expected_outcome = sa.Column(sa.Text, nullable=True)
    remarks = sa.Column(sa.Text, nullable=True)
    created_at = sa.Column(sa.DateTime(timezone=True), server_default=sa.func.now())
    updated_at = sa.Column(
        sa.DateTime(timezone=True),
        server_default=sa.func.now(),
        onupdate=sa.func.now(),
    )

    # Relationships
    responsible = relationship("User", back_populates="follow_ups", foreign_keys=[responsible_id])
    linked_party = relationship("Party", foreign_keys=[linked_party_id])
    linked_lead = relationship("Lead", foreign_keys=[linked_lead_id])
    linked_requirement = relationship("Requirement", foreign_keys=[linked_requirement_id])
    linked_opportunity = relationship("Opportunity", foreign_keys=[linked_opportunity_id])
