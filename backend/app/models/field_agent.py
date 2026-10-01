"""
FieldAgent model — field agent roster for visit management.
Matches FieldAgentRosterRow interface.
"""

import sqlalchemy as sa
from app.core.database import Base


class FieldAgent(Base):
    __tablename__ = "field_agents"

    id = sa.Column(sa.String, primary_key=True)  # e.g. FA-01
    user_id = sa.Column(sa.String, sa.ForeignKey("users.id"), nullable=False, unique=True)
    name = sa.Column(sa.String, nullable=False)  # denormalized
    phone = sa.Column(sa.String, nullable=True)
    # 'Available' | 'On Visit' | 'Off Duty'
    status = sa.Column(sa.String, nullable=False, default='Available')
    today_visit_count = sa.Column(sa.Integer, nullable=True, default=0)
    week_completed_visits = sa.Column(sa.Integer, nullable=True, default=0)
    average_rating = sa.Column(sa.Float, nullable=True, default=0.0)
    last_known_location = sa.Column(sa.String, nullable=True)
