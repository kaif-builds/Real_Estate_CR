"""
Campaign model — marketing campaigns.
Matches frontend CampaignRow interface from mockData.ts.
"""

import sqlalchemy as sa
from app.core.database import Base


class Campaign(Base):
    __tablename__ = "campaigns"

    id = sa.Column(sa.String, primary_key=True)  # e.g. CMP-2026-001
    name = sa.Column(sa.String, nullable=False)
    # CampaignType: 'Property Promotion' | 'Buyer Acquisition' | 'Seller Acquisition' |
    # 'Tenant Acquisition' | 'Landlord Acquisition' | 'Investor Acquisition' | 'Brand Awareness' | 'Lead Generation'
    type = sa.Column(sa.String, nullable=False)
    # CampaignStatus: 'Draft' | 'Planned' | 'Active' | 'Paused' | 'Completed' | 'Cancelled'
    status = sa.Column(sa.String, nullable=False, default='Draft')
    start_date = sa.Column(sa.String, nullable=False)  # date string
    end_date = sa.Column(sa.String, nullable=False)
    owner_id = sa.Column(sa.String, sa.ForeignKey("users.id"), nullable=False, index=True)
    owner_name = sa.Column(sa.String, nullable=False)  # denormalized
    objective = sa.Column(sa.Text, nullable=True)
    # TargetAudienceType[]: stored as JSON array
    target_audience = sa.Column(sa.JSON, nullable=True, default=[])
    geography = sa.Column(sa.String, nullable=True)
    # PropertyCategoryType[]: stored as JSON array
    categories = sa.Column(sa.JSON, nullable=True, default=[])
    # TransactionType[]: stored as JSON array
    transaction_types = sa.Column(sa.JSON, nullable=True, default=[])
    planned_budget = sa.Column(sa.Float, nullable=True, default=0)
    actual_spend = sa.Column(sa.Float, nullable=True)
    target_leads = sa.Column(sa.Integer, nullable=True, default=0)
    target_qualified_leads = sa.Column(sa.Integer, nullable=True, default=0)
    target_opportunities = sa.Column(sa.Integer, nullable=True, default=0)
    # string[] of property IDs
    promoted_properties = sa.Column(sa.JSON, nullable=True, default=[])
    # string[] of partner IDs
    participating_partner_ids = sa.Column(sa.JSON, nullable=True, default=[])
    created_at = sa.Column(sa.String, nullable=True)  # ISO string
    updated_at = sa.Column(sa.String, nullable=True)
