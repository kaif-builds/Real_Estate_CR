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

engine = create_async_engine(settings.DATABASE_URL, **_engine_kwargs)

async_session_factory = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy models."""
    pass


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency — yields an async DB session."""
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
