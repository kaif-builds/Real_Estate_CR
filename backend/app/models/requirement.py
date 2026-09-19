"""
Requirement model — buyer/tenant property requirements.
Spec: §3.3 Requirement. Prisma: schema.prisma L212–L236.
"""

import sqlalchemy as sa
from sqlalchemy.orm import relationship
from app.core.database import Base


class Requirement(Base):
    __tablename__ = "requirements"

    id = sa.Column(sa.String, primary_key=True)
    client_id = sa.Column(sa.String, sa.ForeignKey("parties.id"), nullable=False)
    assigned_to_id = sa.Column(sa.String, sa.ForeignKey("users.id"), nullable=True)
    category = sa.Column(sa.String, nullable=False)      # PropertyCategory enum
    intent = sa.Column(sa.String, nullable=False)        # Intent enum
    # preferred_short_locs: JSON array of location strings
    preferred_short_locs = sa.Column(sa.JSON, nullable=False, default=list)
    min_budget = sa.Column(sa.Float, nullable=True)
    max_budget = sa.Column(sa.Float, nullable=True)
    status = sa.Column(sa.String, nullable=False, default="NEW")  # RequirementStatus enum
    remarks = sa.Column(sa.Text, nullable=True)
    created_at = sa.Column(sa.DateTime(timezone=True), server_default=sa.func.now())
    updated_at = sa.Column(
        sa.DateTime(timezone=True),
        server_default=sa.func.now(),
        onupdate=sa.func.now(),
    )

    # Relationships
    client = relationship("Party", back_populates="requirements", foreign_keys=[client_id])
    assigned_to = relationship("User", back_populates="assigned_requirements", foreign_keys=[assigned_to_id])
    matches = relationship("Match", back_populates="requirement", foreign_keys="Match.requirement_id")
    visits = relationship("Visit", back_populates="requirement", foreign_keys="Visit.requirement_id")
    opportunities = relationship("Opportunity", back_populates="requirement", foreign_keys="Opportunity.requirement_id")
    activity_logs = relationship("ActivityLog", back_populates="linked_requirement", foreign_keys="ActivityLog.linked_requirement_id")
