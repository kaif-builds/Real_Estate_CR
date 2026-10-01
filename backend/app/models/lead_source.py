"""LeadSource model — configurable lead source master list."""

import sqlalchemy as sa
from app.core.database import Base


class LeadSource(Base):
    __tablename__ = "lead_sources"

    id = sa.Column(sa.String, primary_key=True)
    name = sa.Column(sa.String, nullable=False)
    channel_type = sa.Column(sa.String, nullable=False)
    is_active = sa.Column(sa.Boolean, nullable=False, default=True)
    description = sa.Column(sa.Text, nullable=True)
    leads_count = sa.Column(sa.Integer, nullable=True, default=0)
    created_at = sa.Column(sa.DateTime(timezone=True), nullable=True)
