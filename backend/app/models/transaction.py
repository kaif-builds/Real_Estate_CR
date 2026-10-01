"""Transaction model — closed deal and commission records."""

import sqlalchemy as sa
from app.core.database import Base, PgEnum
from app.models.enums import TransactionType, PaymentStatus, ChannelType


class Transaction(Base):
    __tablename__ = "transactions"

    id = sa.Column(sa.String, primary_key=True)
    opportunity_id = sa.Column(sa.String, sa.ForeignKey("opportunities.id"), nullable=False, index=True)
    property_id = sa.Column(sa.String, sa.ForeignKey("properties.id"), nullable=False, index=True)
    property_short_loc = sa.Column(sa.String, nullable=True)
    client_name = sa.Column(sa.String, nullable=True)
    staff_id = sa.Column(sa.String, sa.ForeignKey("users.id"), nullable=True, index=True)
    staff_name = sa.Column(sa.String, nullable=True)
    staff_role = sa.Column(sa.String, nullable=True)
    transaction_type = sa.Column(PgEnum(TransactionType, name='enum_transaction_type'), nullable=False)
    transaction_value = sa.Column(sa.Float, nullable=False)
    commission_pct = sa.Column(sa.Float, nullable=True)
    commission_amount = sa.Column(sa.Float, nullable=False)
    payment_status = sa.Column(PgEnum(PaymentStatus, name='enum_payment_status'), nullable=False, default="Pending")
    closed_date = sa.Column(sa.Date(), nullable=True)
    notes = sa.Column(sa.Text, nullable=True)
    originating_lead_id = sa.Column(sa.String, sa.ForeignKey("leads.id"), nullable=True)
    attributed_campaign_id = sa.Column(sa.String, sa.ForeignKey("campaigns.id"), nullable=True)
    attributed_campaign_name = sa.Column(sa.String, nullable=True)
    attributed_channel_type = sa.Column(PgEnum(ChannelType, name='enum_channel_type'), nullable=True)
    attributed_source = sa.Column(sa.String, nullable=True)
    marketing_executive_name = sa.Column(sa.String, nullable=True)
    first_touch_source = sa.Column(sa.String, nullable=True)
    latest_touch_source = sa.Column(sa.String, nullable=True)
    created_at = sa.Column(sa.DateTime(timezone=True), server_default=sa.func.now())
    updated_at = sa.Column(sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now())
