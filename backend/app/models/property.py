"""
Property model — real estate inventory.
Matches PropertyRow from frontend mockData.ts.
"""

import sqlalchemy as sa
from app.core.database import Base


class Property(Base):
    __tablename__ = "properties"

    id = sa.Column(sa.String, primary_key=True)  # e.g. P-1001
    # PropertyCategory: 'RENTAL_RESIDENTIAL' | 'RENTAL_COMMERCIAL' | 'BUY_SELL_FLAT' | 'BUY_SELL_COMMERCIAL' | 'PLOT'
    category = sa.Column(sa.String, nullable=False, index=True)
    short_loc = sa.Column(sa.String, nullable=True, index=True)  # micro-location code
    address = sa.Column(sa.Text, nullable=True)
    price = sa.Column(sa.Float, nullable=True)
    # PropertyStatus: 'NEW' | 'UNDER_VERIFICATION' | 'AVAILABLE' | 'ACTIVE' | 'ON_HOLD' |
    #   'RESERVED' | 'UNDER_NEGOTIATION' | 'SOLD' | 'RENTED' | 'LEASED' | 'WITHDRAWN' | 'INACTIVE'
    status = sa.Column(sa.String, nullable=False, default="NEW", index=True)
    owner_id = sa.Column(sa.String, sa.ForeignKey("parties.id"), nullable=True, index=True)
    owner_name = sa.Column(sa.String, nullable=True)  # denormalized
    # Source: 'Owner' | 'Broker' | 'Builder-Marketing' etc.
    source = sa.Column(sa.String, nullable=True)
    availability_date = sa.Column(sa.String, nullable=True)
    # JSON object with variable structure depending on category
    details_json = sa.Column(sa.JSON, nullable=True)
    last_verified_at = sa.Column(sa.String, nullable=True)  # ISO datetime
    created_at = sa.Column(sa.String, nullable=True)
    lat = sa.Column(sa.Float, nullable=True)
    lng = sa.Column(sa.Float, nullable=True)
