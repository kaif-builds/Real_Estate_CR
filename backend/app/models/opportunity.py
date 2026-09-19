"""
Opportunity model — deal pipeline management.
Spec: §3.3 Opportunity. Prisma: schema.prisma L310–L332.
"""

import sqlalchemy as sa
from sqlalchemy.orm import relationship
from app.core.database import Base


class Opportunity(Base):
    __tablename__ = "opportunities"

    id = sa.Column(sa.String, primary_key=True)
    property_id = sa.Column(sa.String, sa.ForeignKey("properties.id"), nullable=False, index=True)
    requirement_id = sa.Column(sa.String, sa.ForeignKey("requirements.id"), nullable=True)
    buyer_id = sa.Column(sa.String, sa.ForeignKey("parties.id"), nullable=True)
    seller_id = sa.Column(sa.String, sa.ForeignKey("parties.id"), nullable=True)
    responsible_id = sa.Column(sa.String, sa.ForeignKey("users.id"), nullable=False)
    stage = sa.Column(sa.String, nullable=False, default="QUALIFIED")  # OpportunityStage enum
    expected_value = sa.Column(sa.Float, nullable=True)
    expected_commission = sa.Column(sa.Float, nullable=True)
    probability = sa.Column(sa.Float, nullable=True)       # 0–100 %
    # Negotiation history: JSON array of round objects
    negotiation_history = sa.Column(sa.JSON, nullable=True, default=list)
    # Closure data (filled when Won)
    final_value = sa.Column(sa.Float, nullable=True)
    commission_pct = sa.Column(sa.Float, nullable=True)
    # Lost data
    lost_reason = sa.Column(sa.String, nullable=True)
    lost_remarks = sa.Column(sa.Text, nullable=True)
    closed_at = sa.Column(sa.DateTime(timezone=True), nullable=True)
    created_at = sa.Column(sa.DateTime(timezone=True), server_default=sa.func.now())
    updated_at = sa.Column(
        sa.DateTime(timezone=True),
        server_default=sa.func.now(),
        onupdate=sa.func.now(),
    )

    # Relationships
    property = relationship("Property", back_populates="opportunities", foreign_keys=[property_id])
    requirement = relationship("Requirement", back_populates="opportunities", foreign_keys=[requirement_id])
    buyer = relationship("Party", back_populates="opportunities_as_buyer", foreign_keys=[buyer_id])
    seller = relationship("Party", back_populates="opportunities_as_seller", foreign_keys=[seller_id])
    responsible = relationship("User", back_populates="opportunities_responsible", foreign_keys=[responsible_id])
    transactions = relationship("Transaction", back_populates="opportunity", foreign_keys="Transaction.opportunity_id")
