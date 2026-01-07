import os
from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # 1. Banco de Dados (Lê DATABASE_URL do Render)
    database_url: str = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:postgres@localhost:5432/safetasks_dev")

    # 2. Redis (Opcional, deixamos vazio por enquanto)
    redis_url: str = os.getenv("REDIS_URL", "")

    # 3. Segurança (Lê SECRET_KEY do Render)
    secret_key: str = os.getenv("SECRET_KEY", "CHANGE_ME_IN_PRODUCTION")
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30

    # 4. Logs
    log_level: str = os.getenv("LOG_LEVEL", "INFO")

    # 5. Stripe (Pagamentos)
    stripe_secret_key: str = os.getenv("STRIPE_SECRET_KEY", "")
    stripe_webhook_secret: str = os.getenv("STRIPE_WEBHOOK_SECRET", "")
    
    # 6. URLs do Sistema
    # FRONTEND_URL: Usada para redirecionamentos (links de email, sucesso de pagamento)
    frontend_url: str = os.getenv("FRONTEND_URL", "http://localhost:3000")
    
    # BACKEND_CORS_ORIGINS: Quem pode acessar a API (Browser Security)
    # Definimos um padrão seguro caso a variável não exista
    backend_cors_origins: List[str] = []

    # Validador Inteligente: Transforma string do .env em Lista Python
    @field_validator("backend_cors_origins", mode="before")
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> Union[List[str], str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        return []

    # 7. Regras de Negócio
    trial_period_days: int = int(os.getenv("TRIAL_PERIOD_DAYS", "7"))

    @property
    def async_database_url(self) -> str:
        """Converte a URL do Render (postgresql://) para o driver Async (postgresql+asyncpg://)"""
        if self.database_url and self.database_url.startswith("postgresql://"):
            return self.database_url.replace("postgresql://", "postgresql+asyncpg://", 1)
        return self.database_url

    class Config:
        env_file = ".env"
        case_sensitive = True # No Linux/Render as variáveis geralmente são Case Sensitive
        extra = "ignore" # Permite variáveis de ambiente extras sem quebrar a validação

settings = Settings()

# Alerta de Segurança no Log se a chave for a padrão
if settings.secret_key == "CHANGE_ME_IN_PRODUCTION":
    import logging
    logger = logging.getLogger("app.core.config")
    logger.warning("\n" + "!" * 60)
    logger.warning("🚨 SECURITY ALERT: Default SECRET_KEY detected! 🚨")
    logger.warning("Please set SECRET_KEY in your Render Environment Variables.")
    logger.warning("!" * 60 + "\n")