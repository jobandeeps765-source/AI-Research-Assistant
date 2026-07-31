from pathlib import Path
from pydantic_settings import BaseSettings
from functools import lru_cache

ENV_FILE = Path(__file__).resolve().parent.parent / ".env"


class Settings(BaseSettings):
    """Application configuration loaded from environment variables."""

    # MongoDB
    MONGODB_URL: str = "mongodb://localhost:27017"
    DATABASE_NAME: str = "ai_research_assistant"

    # JWT
    JWT_SECRET_KEY: str = "your-secret-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_MINUTES: int = 60

    # Google Gemini
    GEMINI_API_KEY: str = ""

    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost:3000"]

    class Config:
        env_file = str(ENV_FILE)
        extra = "allow"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
