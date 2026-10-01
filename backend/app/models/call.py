"""Call model — telecalling and call log records."""

import sqlalchemy as sa
from app.core.database import Base
from app.models.enums import CallType, CallOutcome, Sentiment


class Call(Base):
    __tablename__ = "calls"

    id = sa.Column(sa.String, primary_key=True)
    party_name = sa.Column(sa.String, nullable=True)
    party_id = sa.Column(sa.String, sa.ForeignKey("parties.id"), nullable=True, index=True)
    phone = sa.Column(sa.String, nullable=True)
    call_type = sa.Column(sa.Enum(CallType, name='enum_call_type', create_type=False), nullable=True)
    duration_minutes = sa.Column(sa.Float, nullable=True)
    outcome = sa.Column(sa.Enum(CallOutcome, name='enum_call_outcome', create_type=False), nullable=True)
    caller_name = sa.Column(sa.String, nullable=True)
    caller_id = sa.Column(sa.String, sa.ForeignKey("users.id"), nullable=True, index=True)
    call_time = sa.Column(sa.DateTime(timezone=True), nullable=True)
    remarks = sa.Column(sa.Text, nullable=True)
    callback_time = sa.Column(sa.DateTime(timezone=True), nullable=True)
    recording_url = sa.Column(sa.String, nullable=True)
    ai_transcript = sa.Column(sa.Text, nullable=True)
    ai_summary = sa.Column(sa.Text, nullable=True)
    ai_rates = sa.Column(sa.JSON, nullable=True)
    ai_sentiment = sa.Column(sa.Enum(Sentiment, name='enum_sentiment', create_type=False), nullable=True)
    ai_next_action = sa.Column(sa.Text, nullable=True)
    created_at = sa.Column(sa.DateTime(timezone=True), server_default=sa.func.now())
