"""
Lead model — sales leads with attribution tracking.
Matches LeadRow from frontend mockData.ts.
"""

import sqlalchemy as sa
from app.core.database import Base


class Lead(Base):
    __tablename__ = "leads"

    id = sa.Column(sa.String, primary_key=True)  # e.g. L-1001
    party_id = sa.Column(sa.String, sa.ForeignKey("parties.id"), nullable=False, index=True)
    party_name = sa.Column(sa.String, nullable=True)  # denormalized
    # ChannelType: 'Digital' | 'Offline'
    channel_type = sa.Column(sa.String, nullable=True)
    source = sa.Column(sa.String, nullable=True)  # DigitalSourceType or OfflineSourceType
    # LeadType: 'BUYER' | 'SELLER' | 'OWNER' | 'TENANT' | 'LANDLORD' | 'INVESTOR' | 'CONSULTANT' | 'OTHER'
    lead_type = sa.Column(sa.String, nullable=False)
    # LeadStatus: 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'LOST' | 'WON' | 'STALE' | 'CLOSED'
    status = sa.Column(sa.String, nullable=False, default="NEW")
    # LeadPriority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
    priority = sa.Column(sa.String, nullable=False, default="MEDIUM")
    assigned_to_id = sa.Column(sa.String, sa.ForeignKey("users.id"), nullable=True, index=True)
    assigned_to_name = sa.Column(sa.String, nullable=True)  # denormalized
    value = sa.Column(sa.Float, nullable=True)
    remarks = sa.Column(sa.Text, nullable=True)
    last_activity_at = sa.Column(sa.String, nullable=True)  # ISO datetime
    next_follow_up_at = sa.Column(sa.String, nullable=True)  # ISO datetime
    created_at = sa.Column(sa.String, nullable=True)
    # ── Marketing Attribution ──
    campaign_id = sa.Column(sa.String, sa.ForeignKey("campaigns.id"), nullable=True, index=True)
    campaign_name = sa.Column(sa.String, nullable=True)
    referral_code = sa.Column(sa.String, nullable=True)
    ad_reference = sa.Column(sa.String, nullable=True)
    enquiry_at = sa.Column(sa.String, nullable=True)  # ISO datetime
    referral_partner_id = sa.Column(sa.String, sa.ForeignKey("referral_partners.id"), nullable=True)
    referral_partner_name = sa.Column(sa.String, nullable=True)
