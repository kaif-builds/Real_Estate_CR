"""
Call model — call activity log.
Spec: §3.3 Call. Mock: mockData.ts L150–L159.
"""

import sqlalchemy as sa
from sqlalchemy.orm import relationship
from app.core.database import Base


class Call(Base):
    __tablename__ = "calls"

    id = sa.Column(sa.String, primary_key=True)
    party_id = sa.Column(sa.String, sa.ForeignKey("parties.id"), nullable=False, index=True)
    lead_id = sa.Column(sa.String, sa.ForeignKey("leads.id"), nullable=True)
    caller_id = sa.Column(sa.String, sa.ForeignKey("users.id"), nullable=False)
    call_type = sa.Column(sa.String, nullable=False)       # CallType enum: OUTBOUND | INBOUND | MISSED
    outcome = sa.Column(sa.String, nullable=False)         # CallOutcome enum
    duration_minutes = sa.Column(sa.Integer, nullable=True, default=0)
    remarks = sa.Column(sa.Text, nullable=True)
    called_at = sa.Column(sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now())
    # Optional: follow-up scheduled from this call
    follow_up_date = sa.Column(sa.DateTime(timezone=True), nullable=True)
    follow_up_purpose = sa.Column(sa.String, nullable=True)
    created_at = sa.Column(sa.DateTime(timezone=True), server_default=sa.func.now())

    # Relationships
    party = relationship("Party", foreign_keys=[party_id])
    lead = relationship("Lead", back_populates="calls", foreign_keys=[lead_id])
    caller = relationship("User", back_populates="calls_made", foreign_keys=[caller_id])
