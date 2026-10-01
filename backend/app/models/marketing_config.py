"""MarketingConfig model — master configuration items for marketing module."""

import sqlalchemy as sa
from app.core.database import Base


class MarketingConfig(Base):
    __tablename__ = "marketing_config"

    id = sa.Column(sa.String, primary_key=True)
    name = sa.Column(sa.String, nullable=False)
    active = sa.Column(sa.Boolean, nullable=False, default=True)
    category = sa.Column(sa.String, nullable=True)
    description = sa.Column(sa.Text, nullable=True)
    is_system = sa.Column(sa.Boolean, nullable=True, default=False)
    config_type = sa.Column(sa.String, nullable=False, index=True)
    created_at = sa.Column(sa.DateTime(timezone=True), nullable=True)
