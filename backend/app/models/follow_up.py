"""
FollowUp model — follow-up tasks on leads, requirements, and opportunities.
Matches FollowUpRow from frontend mockData.ts.
"""

import sqlalchemy as sa
from app.core.database import Base


class FollowUp(Base):
    __tablename__ = "follow_ups"

    id = sa.Column(sa.String, primary_key=True)  # e.g. FU-3001
    client_name = sa.Column(sa.String, nullable=True)  # denormalized
    client_id = sa.Column(sa.String, sa.ForeignKey("parties.id"), nullable=True, index=True)
    # EntityType: 'Requirement' | 'Lead' | 'Opportunity'
    entity_type = sa.Column(sa.String, nullable=False)
    entity_id = sa.Column(sa.String, nullable=False)
    purpose = sa.Column(sa.Text, nullable=True)
    # Priority: 'LOW' | 'MEDIUM' | 'HIGH'
    priority = sa.Column(sa.String, nullable=False, default="MEDIUM")
    due_date = sa.Column(sa.String, nullable=False)  # ISO datetime
    # FollowUpStatus: 'PENDING' | 'COMPLETED' | 'RESCHEDULED' | 'CANCELLED' | 'OVERDUE' | 'NO_RESPONSE'
    status = sa.Column(sa.String, nullable=False, default="PENDING")
    responsible_name = sa.Column(sa.String, nullable=True)  # denormalized
    responsible_id = sa.Column(sa.String, sa.ForeignKey("users.id"), nullable=True, index=True)
    expected_outcome = sa.Column(sa.Text, nullable=True)
    created_at = sa.Column(sa.String, nullable=True)  # ISO datetime
