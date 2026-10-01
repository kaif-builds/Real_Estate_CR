"""
Opportunity model — sales pipeline opportunities.
Matches PipelineOpportunityRow from frontend mockData.ts.
"""

import sqlalchemy as sa
from app.core.database import Base


class Opportunity(Base):
    __tablename__ = "opportunities"

    id = sa.Column(sa.String, primary_key=True)  # e.g. OPP-5001
    property_id = sa.Column(sa.String, sa.ForeignKey("properties.id"), nullable=False, index=True)
    property_short_loc = sa.Column(sa.String, nullable=True)  # denormalized
    client_id = sa.Column(sa.String, sa.ForeignKey("parties.id"), nullable=False, index=True)
    client_name = sa.Column(sa.String, nullable=True)  # denormalized
    # OpportunityStage: 'QUALIFIED' | 'PROPERTY_SHARED' | 'SITE_VISIT' | 'NEGOTIATION' | 'DOCUMENTATION' | 'WON' | 'LOST'
    stage = sa.Column(sa.String, nullable=False, default="QUALIFIED")
    expected_value = sa.Column(sa.Float, nullable=True)
    probability = sa.Column(sa.Float, nullable=True)
    agent_id = sa.Column(sa.String, sa.ForeignKey("users.id"), nullable=True, index=True)
    agent_name = sa.Column(sa.String, nullable=True)  # denormalized
    # LostReason: 'Price Issue' | 'Property Issue' | 'Customer Decision' | 'Timing' | 'Other'
    lost_reason = sa.Column(sa.String, nullable=True)
    lost_remarks = sa.Column(sa.Text, nullable=True)
    # JSON array: [{round, date, asking_price, offer_price, revised_offer, remarks}]
    negotiation_history = sa.Column(sa.JSON, nullable=True, default=[])
    created_at = sa.Column(sa.String, nullable=True)  # ISO datetime
    closed_at = sa.Column(sa.String, nullable=True)
    # ── Lead Attribution & Traceability ──
    originating_lead_id = sa.Column(sa.String, sa.ForeignKey("leads.id"), nullable=True)
    attributed_campaign_id = sa.Column(sa.String, sa.ForeignKey("campaigns.id"), nullable=True)
    attributed_campaign_name = sa.Column(sa.String, nullable=True)
    attributed_channel_type = sa.Column(sa.String, nullable=True)  # 'Digital' | 'Offline'
    attributed_source = sa.Column(sa.String, nullable=True)
    marketing_executive_name = sa.Column(sa.String, nullable=True)
    first_touch_source = sa.Column(sa.String, nullable=True)
    latest_touch_source = sa.Column(sa.String, nullable=True)
