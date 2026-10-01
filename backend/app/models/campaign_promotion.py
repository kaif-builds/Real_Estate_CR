"""
CampaignPromotion model — links properties to campaigns with marketing content.
Matches CampaignPropertyPromotion interface.
"""

import sqlalchemy as sa
from app.core.database import Base


class CampaignPromotion(Base):
    __tablename__ = "campaign_promotions"

    id = sa.Column(sa.String, primary_key=True)  # e.g. PROM-101
    campaign_id = sa.Column(sa.String, sa.ForeignKey("campaigns.id"), nullable=False, index=True)
    property_id = sa.Column(sa.String, sa.ForeignKey("properties.id"), nullable=False, index=True)
    marketing_headline = sa.Column(sa.String, nullable=True)
    marketing_description = sa.Column(sa.Text, nullable=True)
    cta_text = sa.Column(sa.String, nullable=True)
    # JSON array of file name strings
    media_attachments = sa.Column(sa.JSON, nullable=True, default=[])
    enquiries_count = sa.Column(sa.Integer, nullable=True, default=0)
    added_at = sa.Column(sa.String, nullable=True)
