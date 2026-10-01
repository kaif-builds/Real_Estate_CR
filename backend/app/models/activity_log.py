"""
ActivityLog model — timeline activity entries.
Matches ActivityTimelineRow from frontend mockData.ts.
"""

import sqlalchemy as sa
from app.core.database import Base


class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = sa.Column(sa.String, primary_key=True)  # e.g. ACT-901
    # ActivityType: 'CALL' | 'FOLLOWUP' | 'WHATSAPP' | 'EMAIL' | 'MEETING' |
    #   'PROPERTY_SHARE' | 'VISIT' | 'TASK' | 'STATUS_CHANGE'
    activity_type = sa.Column(sa.String, nullable=False)
    title = sa.Column(sa.String, nullable=True)
    description = sa.Column(sa.Text, nullable=True)
    actor_name = sa.Column(sa.String, nullable=True)  # denormalized
    actor_role = sa.Column(sa.String, nullable=True)
    timestamp = sa.Column(sa.String, nullable=True)  # ISO datetime
    linked_entity_type = sa.Column(sa.String, nullable=True)
    linked_entity_id = sa.Column(sa.String, nullable=True)
    created_at = sa.Column(sa.DateTime(timezone=True), server_default=sa.func.now())
