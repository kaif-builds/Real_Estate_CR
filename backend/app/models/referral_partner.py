"""ReferralPartner model — external referral and channel partners."""

import sqlalchemy as sa
from app.core.database import Base
from app.models.enums import PartnerCategory, PartnerStatus


class ReferralPartner(Base):
    __tablename__ = "referral_partners"

    id = sa.Column(sa.String, primary_key=True)
    name = sa.Column(sa.String, nullable=False)
    category = sa.Column(sa.Enum(PartnerCategory, name='enum_partner_category', create_type=False), nullable=False)
    contact_person = sa.Column(sa.String, nullable=True)
    phone = sa.Column(sa.String, nullable=False)
    email = sa.Column(sa.String, nullable=False)
    referral_code = sa.Column(sa.String, nullable=False, unique=True)
    status = sa.Column(sa.Enum(PartnerStatus, name='enum_partner_status', create_type=False), nullable=False, default='Active')
    notes = sa.Column(sa.Text, nullable=True)
    created_at = sa.Column(sa.DateTime(timezone=True), nullable=True)
