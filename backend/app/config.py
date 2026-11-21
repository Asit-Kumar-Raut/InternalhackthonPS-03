from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    SECRET_KEY: str = "supersecretkey123changeInProduction"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    DATABASE_URL: str = "sqlite:///./smartsignal.db"
    AI_SERVICE_URL: str = "http://localhost:8001"
    AI_SERVICE_TIMEOUT: float = 0.3
    UPLOAD_DIR: str = "uploads"
    CLOUDINARY_CLOUD_NAME: str = ""
    CLOUDINARY_API_KEY: str = ""
    CLOUDINARY_API_SECRET: str = ""
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:5174"
    MAX_FILE_SIZE_MB: int = 5
    MONGODB_URL: str = ""
    MONGODB_DB: str = "smartsignal"

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",")]

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
