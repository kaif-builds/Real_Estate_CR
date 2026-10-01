"""Campaign model — marketing campaigns."""

import sqlalchemy as sa
from app.core.database import Base
from app.models.enums import CampaignType, CampaignStatus


class Campaign(Base):
    __tablename__ = "campaigns"

    id = sa.Column(sa.String, primary_key=True)
    name = sa.Column(sa.String, nullable=False)
    type = sa.Column(sa.Enum(CampaignType, name='enum_campaign_type', create_type=False), nullable=False)
    status = sa.Column(sa.Enum(CampaignStatus, name='enum_campaign_status', create_type=False), nullable=False, default='Draft')
    start_date = sa.Column(sa.Date(), nullable=False)
    end_date = sa.Column(sa.Date(), nullable=False)
    owner_id = sa.Column(sa.String, sa.ForeignKey("users.id"), nullable=False, index=True)
    owner_name = sa.Column(sa.String, nullable=False)
    objective = sa.Column(sa.Text, nullable=True)
    target_audience = sa.Column(sa.JSON, nullable=True, default=[])
    geography = sa.Column(sa.String, nullable=True)
    categories = sa.Column(sa.JSON, nullable=True, default=[])
    transaction_types = sa.Column(sa.JSON, nullable=True, default=[])
    planned_budget = sa.Column(sa.Float, nullable=True, default=0)
    actual_spend = sa.Column(sa.Float, nullable=True)
    target_leads = sa.Column(sa.Integer, nullable=True, default=0)
    target_qualified_leads = sa.Column(sa.Integer, nullable=True, default=0)
    target_opportunities = sa.Column(sa.Integer, nullable=True, default=0)
    promoted_properties = sa.Column(sa.JSON, nullable=True, default=[])
    participating_partner_ids = sa.Column(sa.JSON, nullable=True, default=[])
    created_at = sa.Column(sa.DateTime(timezone=True), nullable=True)
    updated_at = sa.Column(sa.DateTime(timezone=True), nullable=True)
