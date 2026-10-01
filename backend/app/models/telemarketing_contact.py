"""TelemarketingContact model — contacts in telemarketing calling lists."""

import sqlalchemy as sa
from app.core.database import Base
from app.models.enums import CallDisposition


class TelemarketingContact(Base):
    __tablename__ = "telemarketing_contacts"

    id = sa.Column(sa.String, primary_key=True)
    campaign_id = sa.Column(sa.String, sa.ForeignKey("telemarketing_campaigns.id"), nullable=False, index=True)
    name = sa.Column(sa.String, nullable=False)
    phone = sa.Column(sa.String, nullable=False)
    party_id = sa.Column(sa.String, sa.ForeignKey("parties.id"), nullable=True)
    status = sa.Column(sa.Enum(CallDisposition, name='enum_call_disposition', create_type=False), nullable=False, default='Not Called')
    last_attempt_at = sa.Column(sa.DateTime(timezone=True), nullable=True)
    attempts_count = sa.Column(sa.Integer, nullable=False, default=0)
    assigned_telecaller = sa.Column(sa.String, nullable=True)
    notes = sa.Column(sa.Text, nullable=True)
    next_attempt_at = sa.Column(sa.DateTime(timezone=True), nullable=True)
    converted_lead_id = sa.Column(sa.String, sa.ForeignKey("leads.id"), nullable=True)
    created_at = sa.Column(sa.DateTime(timezone=True), nullable=True)
