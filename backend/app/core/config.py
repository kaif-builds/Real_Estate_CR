from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    """Application settings — all values from environment variables."""

    APP_NAME: str = "RealEstateCRM"
    DEBUG: bool = False

    # Database
    # Local dev: SQLite (zero setup). Production: Postgres via managed provider
    # (Neon, Supabase, or Vercel Postgres). Set DATABASE_URL env var accordingly.
    DATABASE_URL: str = Field(
        default="sqlite+aiosqlite:///./realestate_crm.db",
        description="Async database connection string (PostgreSQL for production, SQLite for local dev)",
    )

    # Auth (placeholder for future JWT implementation)
    SECRET_KEY: str = Field(
        default="CHANGE-ME-IN-PRODUCTION",
        description="Secret key for JWT signing (unused in stub auth)",
    )

    # CORS
    CORS_ORIGINS: str = Field(
        default="http://localhost:3000",
        description="Comma-separated list of allowed CORS origins",
    )

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
