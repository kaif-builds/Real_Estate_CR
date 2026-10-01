"""Lead model — sales leads with attribution tracking."""

import sqlalchemy as sa
from app.core.database import Base, PgEnum
from app.models.enums import LeadType, LeadStatus, LeadPriority, ChannelType


class Lead(Base):
    __tablename__ = "leads"

    id = sa.Column(sa.String, primary_key=True)
    party_id = sa.Column(sa.String, sa.ForeignKey("parties.id"), nullable=False, index=True)
    party_name = sa.Column(sa.String, nullable=True)
    channel_type = sa.Column(PgEnum(ChannelType, name='enum_channel_type'), nullable=True)
    source = sa.Column(sa.String, nullable=True)
    lead_type = sa.Column(PgEnum(LeadType, name='enum_lead_type'), nullable=False)
    status = sa.Column(PgEnum(LeadStatus, name='enum_lead_status'), nullable=False, default="NEW")
    priority = sa.Column(PgEnum(LeadPriority, name='enum_lead_priority'), nullable=False, default="MEDIUM")
    assigned_to_id = sa.Column(sa.String, sa.ForeignKey("users.id"), nullable=True, index=True)
    assigned_to_name = sa.Column(sa.String, nullable=True)
    value = sa.Column(sa.Float, nullable=True)
    remarks = sa.Column(sa.Text, nullable=True)
    last_activity_at = sa.Column(sa.DateTime(timezone=True), nullable=True)
    next_follow_up_at = sa.Column(sa.DateTime(timezone=True), nullable=True)
    created_at = sa.Column(sa.DateTime(timezone=True), nullable=True)
    campaign_id = sa.Column(sa.String, sa.ForeignKey("campaigns.id"), nullable=True, index=True)
    campaign_name = sa.Column(sa.String, nullable=True)
    referral_code = sa.Column(sa.String, nullable=True)
    ad_reference = sa.Column(sa.String, nullable=True)
    enquiry_at = sa.Column(sa.DateTime(timezone=True), nullable=True)
    referral_partner_id = sa.Column(sa.String, sa.ForeignKey("referral_partners.id"), nullable=True)
    referral_partner_name = sa.Column(sa.String, nullable=True)
