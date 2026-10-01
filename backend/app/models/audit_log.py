"""Audit log model — unified audit trail (manual and AI-assisted)."""

import sqlalchemy as sa
from app.core.database import Base, PgEnum
from app.models.enums import AuditAction, AuditEntityType


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = sa.Column(sa.String, primary_key=True)
    timestamp = sa.Column(sa.DateTime(timezone=True), nullable=False)
    user_id = sa.Column(sa.String, sa.ForeignKey("users.id"), nullable=True, index=True)
    user_name = sa.Column(sa.String, nullable=True)
    user_role = sa.Column(sa.String, nullable=True)
    action = sa.Column(PgEnum(AuditAction, name='enum_audit_action'), nullable=False)
    entity_type = sa.Column(PgEnum(AuditEntityType, name='enum_audit_entity_type'), nullable=False, index=True)
    entity_id = sa.Column(sa.String, nullable=True, index=True)
    summary = sa.Column(sa.Text, nullable=True)
    details = sa.Column(sa.JSON, nullable=True)
    ip_address = sa.Column(sa.String, nullable=True)
    ai_assisted = sa.Column(sa.Boolean, nullable=True, default=False)
    ai_trail = sa.Column(sa.JSON, nullable=True)
    created_at = sa.Column(sa.DateTime(timezone=True), server_default=sa.func.now())
