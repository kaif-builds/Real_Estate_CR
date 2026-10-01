"""
Requirement model — client property requirements.
Matches FullRequirementRow from frontend mockData.ts.
"""

import sqlalchemy as sa
from app.core.database import Base


class Requirement(Base):
    __tablename__ = "requirements"

    id = sa.Column(sa.String, primary_key=True)  # e.g. R-2001
    client_id = sa.Column(sa.String, sa.ForeignKey("parties.id"), nullable=False, index=True)
    client_name = sa.Column(sa.String, nullable=True)  # denormalized
    assigned_to_id = sa.Column(sa.String, sa.ForeignKey("users.id"), nullable=True, index=True)
    assigned_to_name = sa.Column(sa.String, nullable=True)  # denormalized
    # PropertyCategory: 'RENTAL_RESIDENTIAL' | 'RENTAL_COMMERCIAL' | 'BUY_SELL_FLAT' | 'BUY_SELL_COMMERCIAL' | 'PLOT'
    category = sa.Column(sa.String, nullable=False)
    # Intent: 'BUY' | 'RENT' | 'LEASE'
    intent = sa.Column(sa.String, nullable=False)
    # JSON array of short_loc strings
    preferred_short_locs = sa.Column(sa.JSON, nullable=True, default=[])
    alternate_locs = sa.Column(sa.JSON, nullable=True, default=[])
    min_budget = sa.Column(sa.Float, nullable=True)
    max_budget = sa.Column(sa.Float, nullable=True)
    min_area = sa.Column(sa.Float, nullable=True)
    max_area = sa.Column(sa.Float, nullable=True)
    timeline = sa.Column(sa.String, nullable=True)
    # JSON array of facility strings
    facilities = sa.Column(sa.JSON, nullable=True, default=[])
    # RequirementStatus: 'NEW' | 'ACTIVE' | 'QUALIFIED' | 'LOW_CLARITY' | 'FULFILLED' | 'DROPPED'
    status = sa.Column(sa.String, nullable=False, default="NEW")
    remarks = sa.Column(sa.Text, nullable=True)
    created_at = sa.Column(sa.String, nullable=True)  # ISO datetime
