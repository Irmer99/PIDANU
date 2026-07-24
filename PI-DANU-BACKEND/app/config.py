from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "PDM-AI-Bridge"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = True

    # Supabase / PostgreSQL
    DATABASE_URL: str = ""
    SUPABASE_URL: str = ""
    SUPABASE_ANON_KEY: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""

    # Sunbird AI
    SUNBIRD_API_KEY: str = ""
    SUNBIRD_BASE_URL: str = "https://api.sunbird.ai"

    # Storage
    USE_SUPABASE_STORAGE: bool = True
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_S3_BUCKET: str = "pdm-ai-bridge-docs"
    AWS_REGION: str = "eu-west-1"

    # JWT Auth
    JWT_SECRET_KEY: str = "change-this-to-a-strong-random-secret"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 1440

    # NIRA API (mocked for MVP)
    NIRA_API_URL: str = "https://api.nira.go.ug"
    NIRA_API_KEY: str = "nira_mock_key"

    # Admin
    ADMIN_EMAIL: str = "admin@pdm.go.ug"
    ADMIN_PASSWORD: str = "change-this-password"

    # Gemini AI
    GEMINI_API_KEY: str = ""

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
