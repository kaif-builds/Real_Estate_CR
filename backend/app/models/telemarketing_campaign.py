"""TelemarketingCampaign model."""

import sqlalchemy as sa
from app.core.database import Base
from app.models.enums import TelemarketingPurpose, TeleCampaignStatus


class TelemarketingCampaign(Base):
    __tablename__ = "telemarketing_campaigns"

    id = sa.Column(sa.String, primary_key=True)
    name = sa.Column(sa.String, nullable=False)
    linked_campaign_id = sa.Column(sa.String, sa.ForeignKey("campaigns.id"), nullable=True)
    linked_campaign_name = sa.Column(sa.String, nullable=True)
    target_audience = sa.Column(sa.String, nullable=True)
    category = sa.Column(sa.String, nullable=True)
    geography = sa.Column(sa.String, nullable=True)
    start_date = sa.Column(sa.Date(), nullable=False)
    end_date = sa.Column(sa.Date(), nullable=False)
    purpose = sa.Column(sa.Enum(TelemarketingPurpose, name='enum_telemarketing_purpose', create_type=False), nullable=False)
    assigned_telecallers = sa.Column(sa.JSON, nullable=True, default=[])
    status = sa.Column(sa.Enum(TeleCampaignStatus, name='enum_telecampaign_status', create_type=False), nullable=False, default='Draft')
    created_at = sa.Column(sa.DateTime(timezone=True), nullable=True)
