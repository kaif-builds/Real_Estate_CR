"""
User model — system user accounts with role-based access.
Spec: §3.3 User. Prisma: schema.prisma L351–L369.

NOTE: The placeholder User model from Step 1 is fully replaced here.
Step 2 migration drops and recreates the users table with all real columns.
"""

import sqlalchemy as sa
from sqlalchemy.orm import relationship
from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = sa.Column(sa.String, primary_key=True)
    name = sa.Column(sa.String, nullable=False)
    email = sa.Column(sa.String, nullable=False, unique=True, index=True)
    password_hash = sa.Column(sa.String, nullable=False, default="")
    role = sa.Column(sa.String, nullable=False)          # UserRole enum value
    status = sa.Column(sa.String, nullable=False, default="Active")
    # party_id: links CLIENT users to their Party record (spec §3.3 User)
    party_id = sa.Column(sa.String, sa.ForeignKey("parties.id"), nullable=True)
    last_login = sa.Column(sa.DateTime(timezone=True), nullable=True)
    created_at = sa.Column(sa.DateTime(timezone=True), server_default=sa.func.now())
    updated_at = sa.Column(
        sa.DateTime(timezone=True),
        server_default=sa.func.now(),
        onupdate=sa.func.now(),
    )

    # Relationships
    party = relationship("Party", foreign_keys=[party_id])
    assigned_leads = relationship("Lead", back_populates="assigned_to", foreign_keys="Lead.assigned_to_id")
    assigned_requirements = relationship("Requirement", back_populates="assigned_to", foreign_keys="Requirement.assigned_to_id")
    visits = relationship("Visit", back_populates="agent", foreign_keys="Visit.agent_id")
    opportunities_responsible = relationship("Opportunity", back_populates="responsible", foreign_keys="Opportunity.responsible_id")
    activity_logs = relationship("ActivityLog", back_populates="created_by", foreign_keys="ActivityLog.created_by_id")
    follow_ups = relationship("FollowUp", back_populates="responsible", foreign_keys="FollowUp.responsible_id")
    audit_logs = relationship("AuditLog", back_populates="changed_by", foreign_keys="AuditLog.changed_by_id")
    calls_made = relationship("Call", back_populates="caller", foreign_keys="Call.caller_id")
    tasks_assigned = relationship("Task", back_populates="assigned_to", foreign_keys="Task.assigned_to_id")
    agent_stats = relationship("AgentStats", back_populates="agent", uselist=False, foreign_keys="AgentStats.agent_id")
