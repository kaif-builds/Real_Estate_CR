"""ActivityLog model — timeline activity entries."""

import sqlalchemy as sa
from app.core.database import Base, PgEnum
from app.models.enums import ActivityType


class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = sa.Column(sa.String, primary_key=True)
    activity_type = sa.Column(PgEnum(ActivityType, name='enum_activity_type'), nullable=False)
    title = sa.Column(sa.String, nullable=True)
    description = sa.Column(sa.Text, nullable=True)
    actor_name = sa.Column(sa.String, nullable=True)
    actor_role = sa.Column(sa.String, nullable=True)
    timestamp = sa.Column(sa.DateTime(timezone=True), nullable=True)
    linked_entity_type = sa.Column(sa.String, nullable=True)
    linked_entity_id = sa.Column(sa.String, nullable=True)
    created_at = sa.Column(sa.DateTime(timezone=True), server_default=sa.func.now())
