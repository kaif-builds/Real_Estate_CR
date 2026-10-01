"""
Audit log model — unified audit trail for all actions (manual and AI-assisted).
Matches AuditLogRow and AiTrail interfaces from mockData.ts.
"""

import sqlalchemy as sa
from app.core.database import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = sa.Column(sa.String, primary_key=True)  # e.g. AUD-001 or AUD-AI-101
    timestamp = sa.Column(sa.String, nullable=False)  # formatted datetime string
    user_id = sa.Column(sa.String, sa.ForeignKey("users.id"), nullable=True, index=True)
    user_name = sa.Column(sa.String, nullable=True)
    user_role = sa.Column(sa.String, nullable=True)
    # Action: 'Created' | 'Updated' | 'Deleted' | 'Status Changed' | 'Cancelled' | 'Query' | 'Clarification' | 'Failed'
    action = sa.Column(sa.String, nullable=False)
    # EntityType: 'Property' | 'Requirement' | 'Lead' | 'Visit' | 'Opportunity' | 'User' |
    # 'Transaction' | 'Marketing Config' | 'Follow-up' | 'Task' | 'Campaign' | 'General' | 'Workflow'
    entity_type = sa.Column(sa.String, nullable=False, index=True)
    entity_id = sa.Column(sa.String, nullable=True, index=True)
    summary = sa.Column(sa.Text, nullable=True)
    # JSON object with arbitrary details
    details = sa.Column(sa.JSON, nullable=True)
    ip_address = sa.Column(sa.String, nullable=True)
    # ── AI-Assisted fields ──
    ai_assisted = sa.Column(sa.Boolean, nullable=True, default=False)
    # AiTrail JSON: {original_request, interpreted_intent, proposed_values, user_edits,
    #   final_values, workflow_steps: [{action_type, status, record_id, label, proposed_values, final_values}]}
    ai_trail = sa.Column(sa.JSON, nullable=True)
    created_at = sa.Column(sa.DateTime(timezone=True), server_default=sa.func.now())
