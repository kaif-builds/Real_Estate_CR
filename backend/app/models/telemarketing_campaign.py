"""
TelemarketingCampaign model.
Matches TelemarketingCampaignRow interface.
"""

import sqlalchemy as sa
from app.core.database import Base


class TelemarketingCampaign(Base):
    __tablename__ = "telemarketing_campaigns"

    id = sa.Column(sa.String, primary_key=True)  # e.g. TMC-2026-001
    name = sa.Column(sa.String, nullable=False)
    linked_campaign_id = sa.Column(sa.String, sa.ForeignKey("campaigns.id"), nullable=True)
    linked_campaign_name = sa.Column(sa.String, nullable=True)  # denormalized
    target_audience = sa.Column(sa.String, nullable=True)  # e.g. 'Buyer', 'Seller'
    category = sa.Column(sa.String, nullable=True)  # e.g. 'Residential', 'Commercial'
    geography = sa.Column(sa.String, nullable=True)
    start_date = sa.Column(sa.String, nullable=False)
    end_date = sa.Column(sa.String, nullable=False)
    # TelemarketingPurpose: 'Cold Calling' | 'Market Survey' | 'Owner Acquisition' |
    # 'Buyer Acquisition' | 'Lead Reactivation' | 'Other'
    purpose = sa.Column(sa.String, nullable=False)
    # JSON array of telecaller names
    assigned_telecallers = sa.Column(sa.JSON, nullable=True, default=[])
    # TelemarketingCampaignStatus: 'Draft' | 'Active' | 'Paused' | 'Completed'
    status = sa.Column(sa.String, nullable=False, default='Draft')
    created_at = sa.Column(sa.String, nullable=True)
