"""
ReferralPartner model — external referral and channel partners.
Matches ReferralPartnerRow interface.
"""

import sqlalchemy as sa
from app.core.database import Base


class ReferralPartner(Base):
    __tablename__ = "referral_partners"

    id = sa.Column(sa.String, primary_key=True)  # e.g. RP-101
    name = sa.Column(sa.String, nullable=False)
    # PartnerCategory: 'Property Consultant' | 'Broker' | 'Developer' | 'Investor' |
    # 'Corporate Contact' | 'Referral Partner' | 'Other'
    category = sa.Column(sa.String, nullable=False)
    contact_person = sa.Column(sa.String, nullable=True)
    phone = sa.Column(sa.String, nullable=False)
    email = sa.Column(sa.String, nullable=False)
    referral_code = sa.Column(sa.String, nullable=False, unique=True)
    # PartnerStatus: 'Active' | 'Inactive'
    status = sa.Column(sa.String, nullable=False, default='Active')
    notes = sa.Column(sa.Text, nullable=True)
    created_at = sa.Column(sa.String, nullable=True)
