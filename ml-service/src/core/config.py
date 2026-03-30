"""
Core configuration settings for PeakPurse ML Service
"""


# class Settings(BaseSettings):
#     """Application settings"""
    
#     # Service Configuration
#     DEBUG: bool = True
#     APP_NAME: str = "PeakPurse ML Service"
#     VERSION: str = "1.0.0"
    
#     # API Configuration
#     API_V1_PREFIX: str = "/internal/ml"
    
#     # CORS Configuration
#     ALLOWED_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:3001"]
    
#     # Security
#     INTERNAL_SECRET: str = "dev-secret-change-in-production"
    
#     # ML Model Configuration
#     LAYOUTLM_MODEL_NAME: str = "microsoft/layoutlm-base-uncased"
#     MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB
    
#     # PDF Processing Configuration
#     PDF_PASSWORD: str = ""  # Default password for encrypted PDFs
#     MIN_CONFIDENCE_SCORE: float = 0.8
    
#     # Database Configuration
#     DATABASE_URL: str = "postgresql://peakpurse_user:password@localhost:5432/peakpurse_dev"
    
#     # Logging Configuration
#     LOG_LEVEL: str = "INFO"
    
#     class Config:
#         env_file = ".env"
#         case_sensitive = True


# # Global settings instance
# settings = Settings()

# from pydantic_settings import BaseSettings

# class Settings(BaseSettings):
#     HOST: str
#     PORT: int
#     BACKEND_URL: str
#     LOG_FORMAT: str
#     MODEL_PATH: str
#     MODEL_VERSION: str
#     ENABLE_HEALTH_SCORE: bool
#     ENABLE_RECOMMENDATIONS: bool
#     ENABLE_CATEGORIZER: bool
#     MAX_WORKERS: int
#     BATCH_SIZE: int
#     CACHE_TTL: int
#     PROMETHEUS_ENABLED: bool
#     METRICS_PORT: int

# settings = Settings()
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List
import os


class Settings(BaseSettings):
    """Application settings"""

    # 🔧 Pydantic v2 config
    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
        extra="ignore"   # 🔥 prevents crash from unknown env vars
    )

    # -------------------------------
    # 🧠 Core App Config
    # -------------------------------
    DEBUG: bool = True
    APP_NAME: str = "PeakPurse ML Service"
    VERSION: str = "1.0.0"

    # -------------------------------
    # 🌐 Service Config (NEW - from your error)
    # -------------------------------
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    BACKEND_URL: str = "http://localhost:3000"

    # -------------------------------
    # 🔗 API Config
    # -------------------------------
    API_V1_PREFIX: str = "/internal/ml"

    # -------------------------------
    # 🌍 CORS
    # -------------------------------
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:3001"
    ]

    # -------------------------------
    # 🔐 Security
    # -------------------------------
    INTERNAL_SECRET: str = "dev-secret-change-in-production"

    # -------------------------------
    # 🤖 ML Config (NEW + existing)
    # -------------------------------
    LAYOUTLM_MODEL_NAME: str = "microsoft/layoutlm-base-uncased"
    MODEL_PATH: str = "./models"
    MODEL_VERSION: str = "1.0"

    ENABLE_HEALTH_SCORE: bool = True
    ENABLE_RECOMMENDATIONS: bool = True
    ENABLE_CATEGORIZER: bool = True

    # -------------------------------
    # 📄 PDF Processing
    # -------------------------------
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB
    PDF_PASSWORD: str = ""
    MIN_CONFIDENCE_SCORE: float = 0.8

    # -------------------------------
    # ⚙️ Performance / Workers
    # -------------------------------
    MAX_WORKERS: int = 4
    BATCH_SIZE: int = 100
    CACHE_TTL: int = 3600

    # -------------------------------
    # 📊 Logging & Monitoring
    # -------------------------------
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "json"

    PROMETHEUS_ENABLED: bool = True
    METRICS_PORT: int = 9090

    # -------------------------------
    # 🗄️ Database
    # -------------------------------
    DATABASE_URL: str = "postgresql://peakpurse_user:password@localhost:5432/peakpurse_dev"


# ✅ Global instance
settings = Settings()
