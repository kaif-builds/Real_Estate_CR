"""FieldAgent model — field agent roster for visit management."""

import sqlalchemy as sa
from app.core.database import Base, PgEnum
from app.models.enums import FieldAgentStatus


class FieldAgent(Base):
    __tablename__ = "field_agents"

    id = sa.Column(sa.String, primary_key=True)
    user_id = sa.Column(sa.String, sa.ForeignKey("users.id"), nullable=False, unique=True)
    name = sa.Column(sa.String, nullable=False)
    phone = sa.Column(sa.String, nullable=True)
    status = sa.Column(PgEnum(FieldAgentStatus, name='enum_field_agent_status'), nullable=False, default='Available')
    today_visit_count = sa.Column(sa.Integer, nullable=True, default=0)
    week_completed_visits = sa.Column(sa.Integer, nullable=True, default=0)
    average_rating = sa.Column(sa.Float, nullable=True, default=0.0)
    last_known_location = sa.Column(sa.String, nullable=True)
