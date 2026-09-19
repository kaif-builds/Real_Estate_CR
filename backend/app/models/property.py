"""
Property model — real estate listings.
Spec: §3.3 Property. Prisma: schema.prisma L185–L210.
"""

import sqlalchemy as sa
from sqlalchemy.orm import relationship
from app.core.database import Base


class Property(Base):
    __tablename__ = "properties"

    id = sa.Column(sa.String, primary_key=True)
    category = sa.Column(sa.String, nullable=False)      # PropertyCategory enum
    short_loc = sa.Column(sa.String, nullable=False, index=True)
    address = sa.Column(sa.Text, nullable=True)
    price = sa.Column(sa.Float, nullable=False)
    status = sa.Column(sa.String, nullable=False, default="NEW")  # PropertyStatus enum
    owner_id = sa.Column(sa.String, sa.ForeignKey("parties.id"), nullable=False)
    # detailsJson: flexible JSON blob for BHK, size, furnishing, etc.
    details_json = sa.Column(sa.JSON, nullable=True)
    # Expected GPS coordinates for visit geo-fencing
    expected_lat = sa.Column(sa.Float, nullable=True)
    expected_lng = sa.Column(sa.Float, nullable=True)
    last_verified_at = sa.Column(sa.DateTime(timezone=True), nullable=True)
    created_at = sa.Column(sa.DateTime(timezone=True), server_default=sa.func.now())
    updated_at = sa.Column(
        sa.DateTime(timezone=True),
        server_default=sa.func.now(),
        onupdate=sa.func.now(),
    )

    # Relationships
    owner = relationship("Party", back_populates="owned_properties", foreign_keys=[owner_id])
    matches = relationship("Match", back_populates="property", foreign_keys="Match.property_id")
    visits = relationship("Visit", back_populates="property", foreign_keys="Visit.property_id")
    opportunities = relationship("Opportunity", back_populates="property", foreign_keys="Opportunity.property_id")
    transactions = relationship("Transaction", back_populates="property", foreign_keys="Transaction.property_id")
