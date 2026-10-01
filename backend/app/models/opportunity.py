"""Opportunity model — sales pipeline opportunities."""

import sqlalchemy as sa
from app.core.database import Base
from app.models.enums import OpportunityStage, LostReason, ChannelType


class Opportunity(Base):
    __tablename__ = "opportunities"

    id = sa.Column(sa.String, primary_key=True)
    property_id = sa.Column(sa.String, sa.ForeignKey("properties.id"), nullable=False, index=True)
    property_short_loc = sa.Column(sa.String, nullable=True)
    client_id = sa.Column(sa.String, sa.ForeignKey("parties.id"), nullable=False, index=True)
    client_name = sa.Column(sa.String, nullable=True)
    stage = sa.Column(sa.Enum(OpportunityStage, name='enum_opportunity_stage', create_type=False), nullable=False, default="QUALIFIED")
    expected_value = sa.Column(sa.Float, nullable=True)
    probability = sa.Column(sa.Float, nullable=True)
    agent_id = sa.Column(sa.String, sa.ForeignKey("users.id"), nullable=True, index=True)
    agent_name = sa.Column(sa.String, nullable=True)
    lost_reason = sa.Column(sa.Enum(LostReason, name='enum_lost_reason', create_type=False), nullable=True)
    lost_remarks = sa.Column(sa.Text, nullable=True)
    negotiation_history = sa.Column(sa.JSON, nullable=True, default=[])
    created_at = sa.Column(sa.DateTime(timezone=True), nullable=True)
    closed_at = sa.Column(sa.DateTime(timezone=True), nullable=True)
    originating_lead_id = sa.Column(sa.String, sa.ForeignKey("leads.id"), nullable=True)
    attributed_campaign_id = sa.Column(sa.String, sa.ForeignKey("campaigns.id"), nullable=True)
    attributed_campaign_name = sa.Column(sa.String, nullable=True)
    attributed_channel_type = sa.Column(sa.Enum(ChannelType, name='enum_channel_type', create_type=False), nullable=True)
    attributed_source = sa.Column(sa.String, nullable=True)
    marketing_executive_name = sa.Column(sa.String, nullable=True)
    first_touch_source = sa.Column(sa.String, nullable=True)
    latest_touch_source = sa.Column(sa.String, nullable=True)
