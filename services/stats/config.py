import os
from pydantic import BaseModel

class Settings(BaseModel):
    SERVICE_KEY: str = os.getenv("STATS_SERVICE_KEY", "dev-stats-secret-key-12345")
    ENGINE_VERSION: str = os.getenv("ENGINE_VERSION", "1.0.0-beta")
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    PORT: int = int(os.getenv("PORT", "8000"))
    HOST: str = os.getenv("HOST", "0.0.0.0")

settings = Settings()
