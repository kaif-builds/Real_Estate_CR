"""
ContentItem model — marketing content library.
Matches MarketingContentItem interface.
"""

import sqlalchemy as sa
from app.core.database import Base


class ContentItem(Base):
    __tablename__ = "content_items"

    id = sa.Column(sa.String, primary_key=True)  # e.g. CNT-101
    name = sa.Column(sa.String, nullable=False)
    # MarketingContentType: 'Property Description' | 'Ad Copy' | 'Image' | 'Video' |
    # 'Brochure' | 'Flyer' | 'Social Media Creative' | 'Campaign Message' | 'Call Script' | 'Other'
    type = sa.Column(sa.String, nullable=False)
    # JSON array of campaign ID strings
    linked_campaign_ids = sa.Column(sa.JSON, nullable=True, default=[])
    linked_property_id = sa.Column(sa.String, sa.ForeignKey("properties.id"), nullable=True)
    uploaded_by = sa.Column(sa.String, nullable=True)  # name string
    date_added = sa.Column(sa.String, nullable=True)
    file_name = sa.Column(sa.String, nullable=True)
    file_url = sa.Column(sa.String, nullable=True)
    text_content = sa.Column(sa.Text, nullable=True)
    # JSON array of tag strings
    tags = sa.Column(sa.JSON, nullable=True, default=[])
