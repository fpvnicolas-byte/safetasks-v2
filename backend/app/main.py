import os
import logging
import time
from fastapi import Depends, FastAPI, Request, Response
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

# Importar e carregar dotenv para garantir que as variáveis de ambiente sejam carregadas o mais cedo possível
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '.env')) # Arquivo .env está na raiz do backend

# Importando as configurações para ler as variáveis de ambiente
# AGORA settings será inicializado DEPOIS que load_dotenv() for chamado
from app.core.config import settings 

from app.api.v1.endpoints.auth import router as auth_router
from app.api.v1.endpoints.clients import router as clients_router
from app.api.v1.endpoints.dashboard import router as dashboard_router
from app.api.v1.endpoints.expenses import router as expenses_router
from app.api.v1.endpoints.organizations import router as organizations_router
from app.api.v1.endpoints.production_crew import router as production_crew_router
from app.api.v1.endpoints.production_items import router as production_items_router
from app.api.v1.endpoints.productions import router as productions_router
from app.api.v1.endpoints.services import router as services_router
from app.api.v1.endpoints.users import router as users_router
from app.api.v1.endpoints.webhooks import router as webhooks_router
from app.core.logging_config import setup_logging
from app.db.session import get_db

# Setup logging before creating the app
setup_logging()
logger = logging.getLogger(__name__)

app = FastAPI(title="SafeTasks V2 API", version="0.1.0")

from app.core.rate_limit import limiter
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """
    Custom handler for Pydantic validation errors.
    Ensures detailed error messages are returned to the client.
    """
    logger.error(f"🔴 VALIDATION ERROR on {request.method} {request.url.path}")
    logger.error(f"🔴 ERRORS: {exc.errors()}")
    logger.error(f"🔴 BODY: {exc.body}")
    
    # Serialize errors properly (remove non-JSON-serializable objects like ValueError)
    serialized_errors = []
    for error in exc.errors():
        serialized_error = {
            "type": error.get("type"),
            "loc": error.get("loc"),
            "msg": error.get("msg"),
            "input": error.get("input")
        }
        serialized_errors.append(serialized_error)
    
    return JSONResponse(
        status_code=422,
        content={
            "detail": serialized_errors
        },
    )

logger.info("SafeTasks V2 API starting up")

# --- CORREÇÃO INFALÍVEL DE CORS (MANUAL OVERRIDE) ---
# Lendo a variável bruta do sistema para evitar erros de parsing do Pydantic
raw_cors_origins = os.getenv("BACKEND_CORS_ORIGINS", "")

if raw_cors_origins:
    # Separa por vírgula e remove espaços em branco (Ex: "url1, url2" vira ["url1", "url2"])
    origins_list = [origin.strip() for origin in raw_cors_origins.split(",") if origin.strip()]
else:
    # Fallback de segurança: se a variável estiver vazia, usa estes padrões
    origins_list = ["https://safetasks-frontend-production.up.railway.app", "http://localhost:3000"]

# Log para confirmar no terminal do Render
logger.info(f"🔒 MANUAL CORS ORIGINS LOADED: {origins_list}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins_list,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)
# ----------------------------------------------------

# Performance monitoring middleware
@app.middleware("http")
async def performance_monitoring(request: Request, call_next):
    """Middleware to monitor request performance and log metrics."""
    start_time = time.time()

    # Get user info if available (for authenticated requests)
    user_id = None
    org_id = None
    try:
        # Try to get user from request state (set by auth middleware)
        if hasattr(request.state, 'user'):
            user = request.state.user
            user_id = user.id
            org_id = user.organization_id
    except: #NOSONAR
        pass

    try:
        response: Response = await call_next(request)
        process_time = time.time() - start_time

        # Log performance metrics
        logger.info(
            f"Request completed",
            extra={
                "method": request.method,
                "path": request.url.path,
                "status_code": response.status_code,
                "duration_ms": round(process_time * 1000, 2),
                "user_id": user_id,
                "org_id": org_id,
                "user_agent": request.headers.get("user-agent", "")[:100]  # Truncate for privacy
            }
        )

        # Add performance header
        response.headers["X-Process-Time"] = str(process_time)
        return response

    except Exception as e:
        process_time = time.time() - start_time
        logger.error(
            f"Request failed",
            extra={
                "method": request.method,
                "path": request.url.path,
                "duration_ms": round(process_time * 1000, 2),
                "error": str(e),
                "user_id": user_id,
                "org_id": org_id
            }
        )
        raise

# Note: Rate limiting is applied via @limiter.limit() decorators on individual endpoints
# This provides fine-grained control per endpoint type

# Include routers
app.include_router(auth_router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(clients_router, prefix="/api/v1/clients", tags=["clients"])
app.include_router(services_router, prefix="/api/v1/services", tags=["services"])
app.include_router(productions_router, prefix="/api/v1/productions", tags=["productions"])
app.include_router(organizations_router, prefix="/api/v1/organizations", tags=["organizations"])
app.include_router(users_router, prefix="/api/v1/users", tags=["users"])
app.include_router(dashboard_router, prefix="/api/v1/dashboard", tags=["dashboard"])
app.include_router(production_crew_router, prefix="/api/v1", tags=["production-crew"])
app.include_router(production_items_router, prefix="/api/v1", tags=["production-items"])
app.include_router(expenses_router, prefix="/api/v1", tags=["expenses"])
app.include_router(webhooks_router, prefix="/api/v1/webhooks", tags=["webhooks"])

@app.get("/")
async def root():
    return {"status": "ok", "message": "SafeTasks V2 API is running"}


@app.get("/health")
async def health_check(db: AsyncSession = Depends(get_db)):
    """Enhanced health check endpoint with system metrics."""
    health_status = {
        "status": "ok",
        "timestamp": time.time(),
        "services": {}
    }

    # Database health check
    try:
        start_time = time.time()
        result = await db.execute(text("SELECT 1"))
        result.fetchone()
        db_time = time.time() - start_time
        health_status["services"]["database"] = {
            "status": "ok",
            "response_time_ms": round(db_time * 1000, 2)
        }
    except Exception as e:
        health_status["status"] = "degraded"
        health_status["services"]["database"] = {
            "status": "error",
            "error": str(e)
        }

    # Redis cache health check
    try:
        from app.core.cache import cache
        if cache.enabled:
            start_time = time.time()
            test_result = await cache.get("health_check")
            redis_time = time.time() - start_time
            health_status["services"]["redis"] = {
                "status": "ok",
                "response_time_ms": round(redis_time * 1000, 2)
            }
        else:
            health_status["services"]["redis"] = {
                "status": "disabled",
                "note": "Redis not configured"
            }
    except Exception as e:
        health_status["status"] = "degraded"
        health_status["services"]["redis"] = {
            "status": "error",
            "error": str(e)
        }

    # System info
    health_status["version"] = "2.0.0"
    # Agora pega o ambiente real da configuração, não hardcoded "development"
    health_status["environment"] = settings.log_level 

    logger.info("Health check performed", extra={"status": health_status["status"]})
    return health_status
