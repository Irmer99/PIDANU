from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "PDM-AI-Bridge"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = True

    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/pdm_ai_bridge"

    SUNBIRD_API_KEY: str = ""
    SUNBIRD_BASE_URL: str = "https://api.sunbird.ai"

    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_S3_BUCKET: str = "pdm-ai-bridge-docs"
    AWS_REGION: str = "eu-west-1"

    JWT_SECRET_KEY: str = "change-this-to-a-strong-random-secret"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 1440

    NIRA_API_URL: str = "https://api.nira.go.ug"
    NIRA_API_KEY: str = "nira_mock_key"

    ADMIN_EMAIL: str = "admin@pdm.go.ug"
    ADMIN_PASSWORD: str = "change-this-password"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
