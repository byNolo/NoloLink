from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "NoloLink"
    PROJECT_VERSION: str = "0.1.0"
    
    # KeyN Auth
    KEYN_CLIENT_ID: Optional[str] = None
    KEYN_CLIENT_SECRET: Optional[str] = None
    KEYN_REDIRECT_URI: str = "http://localhost:3071/auth/callback"
    KEYN_AUTH_URL: str = "https://auth-keyn.bynolo.ca"
    
    # Environment
    FRONTEND_URL: str = "http://localhost:3070"
    SERVER_HOST: str = "http://localhost:3071"

    # Database
    DATABASE_URL: str = "sqlite:///./nololink.db"

    class Config:
        env_file = ".env"
        env_file_encoding = 'utf-8'

settings = Settings()
