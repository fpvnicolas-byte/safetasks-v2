import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str
    redis_url: str = os.getenv("REDIS_URL", "")  # Optional Redis for caching
    secret_key: str = "your-secret-key-here-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    log_level: str = os.getenv("LOG_LEVEL", "INFO")  # DEBUG, INFO, WARNING, ERROR, CRITICAL
    stripe_secret_key: str = os.getenv("STRIPE_SECRET_KEY", "")
    stripe_webhook_secret: str = os.getenv("STRIPE_WEBHOOK_SECRET", "")
    frontend_url: str = os.getenv("FRONTEND_URL", "http://localhost:3000")
    trial_period_days: int = int(os.getenv("TRIAL_PERIOD_DAYS", "7")) # Default to 7 days

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()

if settings.secret_key == "your-secret-key-here-change-in-production":
    import logging
    # Create a logger specifically for config to ensure it prints
    logger = logging.getLogger("app.core.config")
    logger.warning("\n" + "!" * 60)
    logger.warning("🚨 SECURITY ALERT: You are using the default SECRET_KEY! 🚨")
    logger.warning("Please set SECRET_KEY in your .env file before deploying.")
    logger.warning("!" * 60 + "\n")
