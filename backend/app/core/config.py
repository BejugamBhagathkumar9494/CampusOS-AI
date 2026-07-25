import os
from typing import List, Union
from pydantic import BaseModel
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", env_ignore_empty=True, extra="ignore"
    )

    PROJECT_NAME: str = "CampusOS AI"
    DEBUG: bool = True
    API_V1_STR: str = "/api/v1"

    # Database
    DATABASE_URL: str = "postgresql://campusos_admin:campusos_secure_pass_2026@localhost:5432/campusos_db"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # Security
    JWT_SECRET_KEY: str = "replace_this_with_a_super_secure_random_hex_key_for_production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # OAuth
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    MICROSOFT_CLIENT_ID: str = ""
    MICROSOFT_CLIENT_SECRET: str = ""

    # Storage
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""
    SUPABASE_BUCKET_NAME: str = "campusos-media"

    # AI API Keys
    OPENAI_API_KEY: str = ""
    LLAMA_API_BASE: str = ""
    LLAMA_API_KEY: str = ""
    MISTRAL_API_KEY: str = ""
    DEFAULT_EMBEDDING_MODEL: str = "BAAI/bge-large-en-v1.5"

    # Environment
    ENV: str = "development"


settings = Settings()
