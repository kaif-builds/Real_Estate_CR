from pydantic_settings import BaseSettings
from pydantic import Field, field_validator


class Settings(BaseSettings):
    """Application settings — all values from environment variables."""

    APP_NAME: str = "RealEstateCRM"
    DEBUG: bool = False

    # Database
    DATABASE_URL: str = Field(
        default="",
        description="Async database connection string (PostgreSQL for production)",
    )

    @field_validator("DATABASE_URL")
    @classmethod
    def validate_database_url(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("DATABASE_URL is not set")
        return v

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
