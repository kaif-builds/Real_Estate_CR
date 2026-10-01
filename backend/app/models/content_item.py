"""ContentItem model — marketing content library."""

import sqlalchemy as sa
from app.core.database import Base
from app.models.enums import ContentType


class ContentItem(Base):
    __tablename__ = "content_items"

    id = sa.Column(sa.String, primary_key=True)
    name = sa.Column(sa.String, nullable=False)
    type = sa.Column(sa.Enum(ContentType, name='enum_content_type', create_type=False), nullable=False)
    linked_campaign_ids = sa.Column(sa.JSON, nullable=True, default=[])
    linked_property_id = sa.Column(sa.String, sa.ForeignKey("properties.id"), nullable=True)
    uploaded_by = sa.Column(sa.String, nullable=True)
    date_added = sa.Column(sa.DateTime(timezone=True), nullable=True)
    file_name = sa.Column(sa.String, nullable=True)
    file_url = sa.Column(sa.String, nullable=True)
    text_content = sa.Column(sa.Text, nullable=True)
    tags = sa.Column(sa.JSON, nullable=True, default=[])
