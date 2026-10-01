"""
Call model — telecalling and call log records.
Matches CallLogRow from frontend mockData.ts.
"""

import sqlalchemy as sa
from app.core.database import Base


class Call(Base):
    __tablename__ = "calls"

    id = sa.Column(sa.String, primary_key=True)  # e.g. C-4001
    party_name = sa.Column(sa.String, nullable=True)  # denormalized
    party_id = sa.Column(sa.String, sa.ForeignKey("parties.id"), nullable=True, index=True)
    phone = sa.Column(sa.String, nullable=True)
    # CallType: 'OUTBOUND' | 'INBOUND' | 'MISSED'
    call_type = sa.Column(sa.String, nullable=True)
    duration_minutes = sa.Column(sa.Float, nullable=True)
    # CallOutcome: 'CONNECTED' | 'NO_ANSWER' | 'BUSY' | 'WRONG_NUMBER' | 'CALL_BACK_LATER'
    outcome = sa.Column(sa.String, nullable=True)
    caller_name = sa.Column(sa.String, nullable=True)  # denormalized
    caller_id = sa.Column(sa.String, sa.ForeignKey("users.id"), nullable=True, index=True)
    call_time = sa.Column(sa.String, nullable=True)  # ISO datetime
    remarks = sa.Column(sa.Text, nullable=True)
    callback_time = sa.Column(sa.String, nullable=True)  # ISO datetime
    # ── AI Call Recording Analysis ──
    recording_url = sa.Column(sa.String, nullable=True)
    ai_transcript = sa.Column(sa.Text, nullable=True)
    ai_summary = sa.Column(sa.Text, nullable=True)
    # JSON array: [{mention, amount, context}]
    ai_rates = sa.Column(sa.JSON, nullable=True)
    # 'Interested' | 'Neutral' | 'Not Interested'
    ai_sentiment = sa.Column(sa.String, nullable=True)
    ai_next_action = sa.Column(sa.Text, nullable=True)
    created_at = sa.Column(sa.DateTime(timezone=True), server_default=sa.func.now())
