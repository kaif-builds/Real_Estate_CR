"""
Bootstrap script — creates the single Super Admin account for production.

═══════════════════════════════════════════════════════════════
  This is the ONLY seed that should run on a fresh production
  database. It creates one Super Admin account so an operator
  can log in and begin configuring the system.

  Run once on a fresh database AFTER migrations:

    cd backend
    python seed_bootstrap.py

  The password is printed to stdout on first run. Store it in
  your password manager immediately — it cannot be retrieved.

  NEVER run seed_dev.py in production. That script is for
  local development only and loads mock test data.
═══════════════════════════════════════════════════════════════
"""

import asyncio
import secrets
import string
import hashlib
from datetime import datetime, timezone

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings

BOOTSTRAP_USER_ID = "u-bootstrap-admin"
BOOTSTRAP_EMAIL = "admin@propdesk.in"
BOOTSTRAP_NAME = "System Administrator"


def generate_password(length: int = 16) -> str:
    alphabet = string.ascii_letters + string.digits + "!@#$%"
    return "".join(secrets.choice(alphabet) for _ in range(length))


def hash_password(password: str) -> str:
    # Simple SHA-256 placeholder — replace with bcrypt when real auth is wired.
    # The real auth module will use passlib/bcrypt; this ensures the column
    # is populated so the NOT NULL constraint is satisfied.
    return "PLACEHOLDER:" + hashlib.sha256(password.encode()).hexdigest()


async def main() -> None:
    print("=" * 60)
    print("  BOOTSTRAP SEED — production only")
    print("=" * 60)
    print(f"  Database: {settings.DATABASE_URL}")
    print()

    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with factory() as session:
        # Check if bootstrap admin already exists
        result = await session.execute(
            text("SELECT id FROM users WHERE id = :id"),
            {"id": BOOTSTRAP_USER_ID},
        )
        existing = result.fetchone()

        if existing:
            print("  ⚠  Bootstrap admin already exists — skipping.")
            print("  If you need to reset the password, do so via the admin UI.")
        else:
            password = generate_password()
            pw_hash = hash_password(password)

            await session.execute(
                text(
                    "INSERT INTO users (id, name, email, password_hash, role, status) "
                    "VALUES (:id, :name, :email, :pw_hash, :role, :status)"
                ),
                {
                    "id": BOOTSTRAP_USER_ID,
                    "name": BOOTSTRAP_NAME,
                    "email": BOOTSTRAP_EMAIL,
                    "pw_hash": pw_hash,
                    "role": "SUPER_ADMIN",
                    "status": "Active",
                },
            )
            await session.commit()

            print("  ✅ Bootstrap Super Admin created.")
            print()
            print(f"     Email   : {BOOTSTRAP_EMAIL}")
            print(f"     Password: {password}")
            print()
            print("  ⚠  Save this password now — it will not be shown again.")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
