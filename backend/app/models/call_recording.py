"""CallRecording model — uploaded call recordings with AI analysis."""

import sqlalchemy as sa
from app.core.database import Base, PgEnum
from app.models.enums import Sentiment


class CallRecording(Base):
    __tablename__ = "call_recordings"

    id = sa.Column(sa.String, primary_key=True)
    created_at = sa.Column(sa.DateTime(timezone=True), nullable=True)
    party_id = sa.Column(sa.String, sa.ForeignKey("parties.id"), nullable=True)
    party_name = sa.Column(sa.String, nullable=True)
    party_phone = sa.Column(sa.String, nullable=True)
    duration_seconds = sa.Column(sa.Integer, nullable=True)
    duration_formatted = sa.Column(sa.String, nullable=True)
    sentiment = sa.Column(PgEnum(Sentiment, name='enum_sentiment'), nullable=True, default='Neutral')
    summary = sa.Column(sa.Text, nullable=True)
    transcript = sa.Column(sa.Text, nullable=True)
    rates = sa.Column(sa.JSON, nullable=True, default=[])
    next_action = sa.Column(sa.Text, nullable=True)
    uploaded_by_id = sa.Column(sa.String, sa.ForeignKey("users.id"), nullable=False)
    uploaded_by_name = sa.Column(sa.String, nullable=True)
    recording_url = sa.Column(sa.String, nullable=True)
    file_name = sa.Column(sa.String, nullable=True)
