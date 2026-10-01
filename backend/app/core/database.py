from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.pool import NullPool
from typing import AsyncGenerator

from app.core.config import settings

# ── Engine configuration ───────────────────────────────────────────────────────
#
# Serverless (Vercel): NullPool prevents connection leaks across cold starts.
# The managed Postgres provider (Neon / Supabase / Vercel Postgres) handles
# pooling externally via its connection pooler endpoint.
#
# Local dev with SQLite: NullPool also works fine — each request opens and
# closes its own connection, which is perfectly adequate for development.
#
_is_sqlite = settings.DATABASE_URL.startswith("sqlite")
_engine_kwargs: dict = {
    "echo": settings.DEBUG,
    "poolclass": NullPool,      # No application-side pooling — let the DB pooler manage it
}
if not _is_sqlite:
    _engine_kwargs["pool_pre_ping"] = True
    # Supabase/Supavisor pooler runs in transaction mode, which doesn't support
    # asyncpg's prepared statement cache. Disable it to avoid
    # "prepared statement already exists" errors.
    _engine_kwargs["connect_args"] = {"statement_cache_size": 0}

engine = create_async_engine(settings.DATABASE_URL, **_engine_kwargs)

async_session_factory = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy models."""
    pass


import enum as _enum
import sqlalchemy as _sa

def PgEnum(enum_cls: type[_enum.Enum], **kwargs):
    """
    Wrapper around sa.Enum that:
      - Uses the enum member's .value (not .name) for DB storage
      - Assumes the Postgres type already exists (create_type=False)
      - Derives the type name from the enum class if not provided
    
    This fixes the asyncpg issue where Python enum member names (e.g. DIGITAL)
    are sent to Postgres instead of values (e.g. Digital).
    """
    kwargs.setdefault("create_type", False)
    kwargs.setdefault("values_callable", lambda e: [m.value for m in e])
    if "name" not in kwargs:
        # Convert e.g. ChannelType -> enum_channel_type
        import re
        snake = re.sub(r'(?<!^)(?=[A-Z])', '_', enum_cls.__name__).lower()
        kwargs["name"] = f"enum_{snake}"
    return _sa.Enum(enum_cls, **kwargs)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency — yields an async DB session."""
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
