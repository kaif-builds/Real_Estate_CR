"""Visit model — property site visits with full review data."""

import sqlalchemy as sa
from app.core.database import Base, PgEnum
from app.models.enums import VisitPurpose, VisitStatus


class Visit(Base):
    __tablename__ = "visits"

    id = sa.Column(sa.String, primary_key=True)
    property_id = sa.Column(sa.String, sa.ForeignKey("properties.id"), nullable=False, index=True)
    property_short_loc = sa.Column(sa.String, nullable=True)
    client_id = sa.Column(sa.String, sa.ForeignKey("parties.id"), nullable=True, index=True)
    client_name = sa.Column(sa.String, nullable=True)
    agent_id = sa.Column(sa.String, sa.ForeignKey("users.id"), nullable=False, index=True)
    agent_name = sa.Column(sa.String, nullable=True)
    purpose = sa.Column(PgEnum(VisitPurpose, name='enum_visit_purpose'), nullable=True)
    status = sa.Column(PgEnum(VisitStatus, name='enum_visit_status'), nullable=False, default="Assigned")
    scheduled_date = sa.Column(sa.DateTime(timezone=True), nullable=False)
    submitted_date = sa.Column(sa.DateTime(timezone=True), nullable=True)
    instructions = sa.Column(sa.Text, nullable=True)
    checklist_template = sa.Column(sa.String, nullable=True)
    review_data = sa.Column(sa.JSON, nullable=True)
    created_at = sa.Column(sa.DateTime(timezone=True), nullable=True)
