"""
AuditLog model — immutable record of system-wide changes.
Spec: §3.3 AuditLog. Prisma: schema.prisma L371–L383.
"""

import sqlalchemy as sa
from sqlalchemy.orm import relationship
from app.core.database import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = sa.Column(sa.String, primary_key=True)
    changed_by_id = sa.Column(sa.String, sa.ForeignKey("users.id"), nullable=False, index=True)
    action = sa.Column(sa.String, nullable=False)          # Created | Updated | Deleted | Status Changed
    entity_type = sa.Column(sa.String, nullable=False)     # e.g. "Opportunity", "Lead", "Property"
    entity_id = sa.Column(sa.String, nullable=False)
    summary = sa.Column(sa.String, nullable=False)
    # diff_json: optional before/after snapshot for detailed diffs
    diff_json = sa.Column(sa.JSON, nullable=True)
    occurred_at = sa.Column(sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now())

    # Relationships
    changed_by = relationship("User", back_populates="audit_logs", foreign_keys=[changed_by_id])
