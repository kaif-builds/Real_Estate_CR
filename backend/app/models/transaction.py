"""
Transaction model — closed deal and commission records.
Spec: §3.3 Transaction. Prisma: schema.prisma L334–L349.
"""

import sqlalchemy as sa
from sqlalchemy.orm import relationship
from app.core.database import Base


class Transaction(Base):
    __tablename__ = "transactions"

    id = sa.Column(sa.String, primary_key=True)
    opportunity_id = sa.Column(sa.String, sa.ForeignKey("opportunities.id"), nullable=False, index=True)
    property_id = sa.Column(sa.String, sa.ForeignKey("properties.id"), nullable=False)
    transaction_type = sa.Column(sa.String, nullable=False)  # TransactionType enum: SALE | RENT
    transaction_value = sa.Column(sa.Float, nullable=False)
    commission_amount = sa.Column(sa.Float, nullable=False)
    commission_percent = sa.Column(sa.Float, nullable=False)
    payment_status = sa.Column(sa.String, nullable=False, default="PENDING")  # PaymentStatus enum
    closed_at = sa.Column(sa.DateTime(timezone=True), nullable=False)
    created_at = sa.Column(sa.DateTime(timezone=True), server_default=sa.func.now())
    updated_at = sa.Column(
        sa.DateTime(timezone=True),
        server_default=sa.func.now(),
        onupdate=sa.func.now(),
    )

    # Relationships
    opportunity = relationship("Opportunity", back_populates="transactions", foreign_keys=[opportunity_id])
    property = relationship("Property", back_populates="transactions", foreign_keys=[property_id])
