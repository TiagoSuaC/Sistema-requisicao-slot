from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    database_url: str = "postgresql://postgres:postgres@db:5432/macro_periods"
    secret_key: str = "change-this-secret-key-in-production"
    admin_email: str = "admin@example.com"
    admin_password: str = "admin123"
    frontend_url: str = "http://localhost:3000"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 43200  # 30 days

    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache()
def get_settings():
    return Settings()
