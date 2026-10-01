"""
User model — system user accounts.
Matches UserOption from frontend mockData.ts.
"""

import sqlalchemy as sa
from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = sa.Column(sa.String, primary_key=True)  # e.g. u1
    name = sa.Column(sa.String, nullable=False)
    email = sa.Column(sa.String, nullable=False, unique=True, index=True)
    password_hash = sa.Column(sa.String, nullable=False, default="")
    # UserRole: 'SUPER_ADMIN' | 'OFFICE_EXECUTIVE' | 'AGENT' | 'CLIENT'
    role = sa.Column(sa.String, nullable=False)
    status = sa.Column(sa.String, nullable=False, default="Active")
    party_id = sa.Column(sa.String, sa.ForeignKey("parties.id"), nullable=True)
    last_login = sa.Column(sa.DateTime(timezone=True), nullable=True)
    created_at = sa.Column(sa.DateTime(timezone=True), server_default=sa.func.now())
    updated_at = sa.Column(
        sa.DateTime(timezone=True),
        server_default=sa.func.now(),
        onupdate=sa.func.now(),
    )
