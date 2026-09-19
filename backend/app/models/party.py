"""
Party model — central contact directory (owners, buyers, brokers, etc.).
Spec: §3.3 Party. Prisma: schema.prisma L143–L166.
"""

import sqlalchemy as sa
from sqlalchemy.orm import relationship
from app.core.database import Base


class Party(Base):
    __tablename__ = "parties"

    id = sa.Column(sa.String, primary_key=True)
    name = sa.Column(sa.String, nullable=False, index=True)
    mobile = sa.Column(sa.String, nullable=False)
    alt_mobile = sa.Column(sa.String, nullable=True)
    email = sa.Column(sa.String, nullable=True)
    address = sa.Column(sa.Text, nullable=True)
    city = sa.Column(sa.String, nullable=True)
    # roles: stored as comma-separated enum values (e.g. "OWNER,SELLER")
    # Using JSON column for multi-role support per spec §3.3 note
    roles = sa.Column(sa.JSON, nullable=False, default=list)
    source = sa.Column(sa.String, nullable=True)
    status = sa.Column(sa.String, nullable=True, default="Active")
    tags = sa.Column(sa.JSON, nullable=False, default=list)
    remarks = sa.Column(sa.Text, nullable=True)
    created_at = sa.Column(sa.DateTime(timezone=True), server_default=sa.func.now())
    updated_at = sa.Column(
        sa.DateTime(timezone=True),
        server_default=sa.func.now(),
        onupdate=sa.func.now(),
    )

    # Relationships
    owned_properties = relationship("Property", back_populates="owner", foreign_keys="Property.owner_id")
    leads = relationship("Lead", back_populates="party", foreign_keys="Lead.party_id")
    requirements = relationship("Requirement", back_populates="client", foreign_keys="Requirement.client_id")
    opportunities_as_buyer = relationship("Opportunity", back_populates="buyer", foreign_keys="Opportunity.buyer_id")
    opportunities_as_seller = relationship("Opportunity", back_populates="seller", foreign_keys="Opportunity.seller_id")
