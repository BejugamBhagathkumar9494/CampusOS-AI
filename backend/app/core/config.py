import os
import sys
from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", env_ignore_empty=True, extra="ignore"
    )

    PROJECT_NAME: str = "CampusOS AI"
    DEBUG: bool = False
    API_V1_STR: str = "/api/v1"

    # Database
    DATABASE_URL: str = "postgresql://campusos_admin:campusos_secure_pass_2026@localhost:5432/campusos_db"

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def assemble_db_connection(cls, v: str) -> str:
        if isinstance(v, str) and v.startswith("postgres://"):
            return v.replace("postgres://", "postgresql://", 1)
        return v

    # Security & CORS
    JWT_SECRET_KEY: str = "replace_this_with_a_super_secure_random_hex_key_for_production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    ALLOWED_ORIGINS: Union[str, List[str]] = [
        "https://campus-os-ai-jbth.vercel.app",
        "http://localhost:5173",
    ]

    @property
    def cors_origins(self) -> List[str]:
        if isinstance(self.ALLOWED_ORIGINS, str):
            origins = [o.strip() for o in self.ALLOWED_ORIGINS.split(",") if o.strip()]
        else:
            origins = list(self.ALLOWED_ORIGINS)
        
        default_allowed = [
            "https://campus-os-ai-jbth.vercel.app",
            "http://localhost:5173",
        ]
        cleaned = [o for o in origins if o != "*"]
        for d in default_allowed:
            if d not in cleaned:
                cleaned.append(d)
        return cleaned

    # Storage & Supabase
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""
    SUPABASE_BUCKET_NAME: str = "campusos-media"

    # AI & Vector RAG Settings
    GEMINI_API_KEY: str = ""
    GOOGLE_API_KEY: str = ""
    OPENAI_API_KEY: str = ""
    DEFAULT_EMBEDDING_MODEL: str = "sentence-transformers/all-MiniLM-L6-v2"
    VECTOR_MATCH_THRESHOLD: float = 0.20
    VECTOR_MATCH_COUNT: int = 5
    ENV: str = "production"

    def validate_required_env(self) -> None:
        """Validates critical environment variables required for backend execution."""
        required_vars = {
            "SUPABASE_URL": self.SUPABASE_URL or os.getenv("SUPABASE_URL", ""),
            "SUPABASE_SERVICE_ROLE_KEY": self.SUPABASE_SERVICE_ROLE_KEY or os.getenv("SUPABASE_SERVICE_ROLE_KEY", ""),
            "OPENAI_API_KEY": self.OPENAI_API_KEY or os.getenv("OPENAI_API_KEY", ""),
        }
        missing = [var for var, val in required_vars.items() if not val or not str(val).strip()]
        if missing:
            msg = (
                f"\n========================================================================\n"
                f"CRITICAL STARTUP ERROR: Missing required environment variable(s):\n"
                f"  -> {', '.join(missing)}\n"
                f"Please ensure SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and OPENAI_API_KEY\n"
                f"are properly set in environment variables or .env file before running.\n"
                f"========================================================================\n"
            )
            print(msg, file=sys.stderr)
            raise RuntimeError(msg)


settings = Settings()

