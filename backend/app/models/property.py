"""Property model — real estate inventory."""

import sqlalchemy as sa
from app.core.database import Base
from app.models.enums import PropertyCategory, PropertyStatus


class Property(Base):
    __tablename__ = "properties"

    id = sa.Column(sa.String, primary_key=True)
    category = sa.Column(sa.Enum(PropertyCategory, name='enum_property_category', create_type=False), nullable=False, index=True)
    short_loc = sa.Column(sa.String, nullable=True, index=True)
    address = sa.Column(sa.Text, nullable=True)
    price = sa.Column(sa.Float, nullable=True)
    status = sa.Column(sa.Enum(PropertyStatus, name='enum_property_status', create_type=False), nullable=False, default="NEW", index=True)
    owner_id = sa.Column(sa.String, sa.ForeignKey("parties.id"), nullable=True, index=True)
    owner_name = sa.Column(sa.String, nullable=True)
    source = sa.Column(sa.String, nullable=True)
    availability_date = sa.Column(sa.DateTime(timezone=True), nullable=True)
    details_json = sa.Column(sa.JSON, nullable=True)
    last_verified_at = sa.Column(sa.DateTime(timezone=True), nullable=True)
    created_at = sa.Column(sa.DateTime(timezone=True), nullable=True)
    lat = sa.Column(sa.Float, nullable=True)
    lng = sa.Column(sa.Float, nullable=True)
