"""
TelemarketingContact model — contacts in telemarketing calling lists.
Matches TelemarketingContact interface.
"""

import sqlalchemy as sa
from app.core.database import Base


class TelemarketingContact(Base):
    __tablename__ = "telemarketing_contacts"

    id = sa.Column(sa.String, primary_key=True)  # e.g. tmc-c-001
    campaign_id = sa.Column(sa.String, sa.ForeignKey("telemarketing_campaigns.id"), nullable=False, index=True)
    name = sa.Column(sa.String, nullable=False)
    phone = sa.Column(sa.String, nullable=False)
    party_id = sa.Column(sa.String, sa.ForeignKey("parties.id"), nullable=True)
    # CallDisposition: 'Not Called' | 'Connected' | 'Busy' | 'Call Later' | 'Interested' |
    # 'Not Interested' | 'Wrong Number' | 'Do Not Contact' | 'Converted to Lead'
    status = sa.Column(sa.String, nullable=False, default='Not Called')
    last_attempt_at = sa.Column(sa.String, nullable=True)
    attempts_count = sa.Column(sa.Integer, nullable=False, default=0)
    assigned_telecaller = sa.Column(sa.String, nullable=True)
    notes = sa.Column(sa.Text, nullable=True)
    next_attempt_at = sa.Column(sa.String, nullable=True)
    converted_lead_id = sa.Column(sa.String, sa.ForeignKey("leads.id"), nullable=True)
    created_at = sa.Column(sa.String, nullable=True)
