"""Requirement model — client property requirements."""

import sqlalchemy as sa
from app.core.database import Base
from app.models.enums import PropertyCategory, Intent, RequirementStatus


class Requirement(Base):
    __tablename__ = "requirements"

    id = sa.Column(sa.String, primary_key=True)
    client_id = sa.Column(sa.String, sa.ForeignKey("parties.id"), nullable=False, index=True)
    client_name = sa.Column(sa.String, nullable=True)
    assigned_to_id = sa.Column(sa.String, sa.ForeignKey("users.id"), nullable=True, index=True)
    assigned_to_name = sa.Column(sa.String, nullable=True)
    category = sa.Column(sa.Enum(PropertyCategory, name='enum_property_category', create_type=False), nullable=False)
    intent = sa.Column(sa.Enum(Intent, name='enum_intent', create_type=False), nullable=False)
    preferred_short_locs = sa.Column(sa.JSON, nullable=True, default=[])
    alternate_locs = sa.Column(sa.JSON, nullable=True, default=[])
    min_budget = sa.Column(sa.Float, nullable=True)
    max_budget = sa.Column(sa.Float, nullable=True)
    min_area = sa.Column(sa.Float, nullable=True)
    max_area = sa.Column(sa.Float, nullable=True)
    timeline = sa.Column(sa.String, nullable=True)
    facilities = sa.Column(sa.JSON, nullable=True, default=[])
    status = sa.Column(sa.Enum(RequirementStatus, name='enum_requirement_status', create_type=False), nullable=False, default="NEW")
    remarks = sa.Column(sa.Text, nullable=True)
    created_at = sa.Column(sa.DateTime(timezone=True), nullable=True)
