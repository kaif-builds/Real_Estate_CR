"""User model — system user accounts."""

import sqlalchemy as sa
from app.core.database import Base, PgEnum
from app.models.enums import UserRole


class User(Base):
    __tablename__ = "users"

    id = sa.Column(sa.String, primary_key=True)
    name = sa.Column(sa.String, nullable=False)
    email = sa.Column(sa.String, nullable=False, unique=True, index=True)
    password_hash = sa.Column(sa.String, nullable=False, default="")
    role = sa.Column(PgEnum(UserRole, name='enum_user_role'), nullable=False)
    status = sa.Column(sa.String, nullable=False, default="Active")
    party_id = sa.Column(sa.String, sa.ForeignKey("parties.id"), nullable=True)
    last_login = sa.Column(sa.DateTime(timezone=True), nullable=True)
    created_at = sa.Column(sa.DateTime(timezone=True), server_default=sa.func.now())
    updated_at = sa.Column(sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now())
