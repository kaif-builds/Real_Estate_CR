"""
MarketingConfig model — master configuration items for marketing module.
Matches MarketingConfigItem interface.
Stores campaign types, target audiences, partner categories, 
telemarketing purposes, call dispositions, and content types.
"""

import sqlalchemy as sa
from app.core.database import Base


class MarketingConfig(Base):
    __tablename__ = "marketing_config"

    id = sa.Column(sa.String, primary_key=True)  # e.g. cfg-ct-1
    name = sa.Column(sa.String, nullable=False)
    active = sa.Column(sa.Boolean, nullable=False, default=True)
    category = sa.Column(sa.String, nullable=True)  # e.g. 'Purpose', 'Disposition', 'Text', 'Media'
    description = sa.Column(sa.Text, nullable=True)
    is_system = sa.Column(sa.Boolean, nullable=True, default=False)
    # Discriminator: which config list this belongs to
    # e.g. 'campaign_type', 'target_audience', 'partner_category', 
    # 'telemarketing_purpose', 'call_disposition', 'content_type'
    config_type = sa.Column(sa.String, nullable=False, index=True)
    created_at = sa.Column(sa.String, nullable=True)
