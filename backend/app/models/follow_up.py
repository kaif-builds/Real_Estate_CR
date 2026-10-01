"""FollowUp model — follow-up tasks on leads, requirements, and opportunities."""

import sqlalchemy as sa
from app.core.database import Base, PgEnum
from app.models.enums import FollowUpEntityType, FollowUpPriority, FollowUpStatus


class FollowUp(Base):
    __tablename__ = "follow_ups"

    id = sa.Column(sa.String, primary_key=True)
    client_name = sa.Column(sa.String, nullable=True)
    client_id = sa.Column(sa.String, sa.ForeignKey("parties.id"), nullable=True, index=True)
    entity_type = sa.Column(PgEnum(FollowUpEntityType, name='enum_followup_entity_type'), nullable=False)
    entity_id = sa.Column(sa.String, nullable=False)
    purpose = sa.Column(sa.Text, nullable=True)
    priority = sa.Column(PgEnum(FollowUpPriority, name='enum_followup_priority'), nullable=False, default="MEDIUM")
    due_date = sa.Column(sa.DateTime(timezone=True), nullable=False)
    status = sa.Column(PgEnum(FollowUpStatus, name='enum_followup_status'), nullable=False, default="PENDING")
    responsible_name = sa.Column(sa.String, nullable=True)
    responsible_id = sa.Column(sa.String, sa.ForeignKey("users.id"), nullable=True, index=True)
    expected_outcome = sa.Column(sa.Text, nullable=True)
    created_at = sa.Column(sa.DateTime(timezone=True), nullable=True)
