"""Party model — people and organizations."""

import sqlalchemy as sa
from app.core.database import Base


class Party(Base):
    __tablename__ = "parties"

    id = sa.Column(sa.String, primary_key=True)
    name = sa.Column(sa.String, nullable=False)
    email = sa.Column(sa.String, nullable=True)
    mobile = sa.Column(sa.String, nullable=True)
    city = sa.Column(sa.String, nullable=True)
    roles = sa.Column(sa.JSON, nullable=True, default=[])
    status = sa.Column(sa.String, nullable=True, default="Active")
    source = sa.Column(sa.String, nullable=True)
    leads_count = sa.Column(sa.Integer, nullable=True, default=0)
    requirements_count = sa.Column(sa.Integer, nullable=True, default=0)
    opportunities_count = sa.Column(sa.Integer, nullable=True, default=0)
    updated_at = sa.Column(sa.DateTime(timezone=True), nullable=True)
    created_at = sa.Column(sa.DateTime(timezone=True), server_default=sa.func.now())
