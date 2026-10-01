"""
Transaction model — closed deal and commission records.
Matches TransactionRow from frontend mockData.ts.
"""

import sqlalchemy as sa
from app.core.database import Base


class Transaction(Base):
    __tablename__ = "transactions"

    id = sa.Column(sa.String, primary_key=True)  # e.g. TXN-797
    opportunity_id = sa.Column(sa.String, sa.ForeignKey("opportunities.id"), nullable=False, index=True)
    property_id = sa.Column(sa.String, sa.ForeignKey("properties.id"), nullable=False, index=True)
    property_short_loc = sa.Column(sa.String, nullable=True)  # denormalized
    client_name = sa.Column(sa.String, nullable=True)  # denormalized
    staff_id = sa.Column(sa.String, sa.ForeignKey("users.id"), nullable=True, index=True)
    staff_name = sa.Column(sa.String, nullable=True)  # denormalized
    staff_role = sa.Column(sa.String, nullable=True)
    # TransactionType: 'Sale' | 'Rent' | 'Lease'
    transaction_type = sa.Column(sa.String, nullable=False)
    transaction_value = sa.Column(sa.Float, nullable=False)
    commission_pct = sa.Column(sa.Float, nullable=True)
    commission_amount = sa.Column(sa.Float, nullable=False)
    # PaymentStatus: 'Paid' | 'Partial' | 'Pending'
    payment_status = sa.Column(sa.String, nullable=False, default="Pending")
    closed_date = sa.Column(sa.String, nullable=True)  # date string
    notes = sa.Column(sa.Text, nullable=True)
    # ── Lead Attribution & Traceability ──
    originating_lead_id = sa.Column(sa.String, sa.ForeignKey("leads.id"), nullable=True)
    attributed_campaign_id = sa.Column(sa.String, sa.ForeignKey("campaigns.id"), nullable=True)
    attributed_campaign_name = sa.Column(sa.String, nullable=True)
    attributed_channel_type = sa.Column(sa.String, nullable=True)  # 'Digital' | 'Offline'
    attributed_source = sa.Column(sa.String, nullable=True)
    marketing_executive_name = sa.Column(sa.String, nullable=True)
    first_touch_source = sa.Column(sa.String, nullable=True)
    latest_touch_source = sa.Column(sa.String, nullable=True)
    created_at = sa.Column(sa.DateTime(timezone=True), server_default=sa.func.now())
    updated_at = sa.Column(
        sa.DateTime(timezone=True),
        server_default=sa.func.now(),
        onupdate=sa.func.now(),
    )
