import logging
from fastapi import Depends, FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

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
from app.core.logging_config import setup_logging
from app.db.session import get_db

# Setup logging before creating the app
setup_logging()
logger = logging.getLogger(__name__)

app = FastAPI(title="SafeTasks V2 API", version="0.1.0")

# TODO: Rate limiting temporarily disabled - install slowapi to enable
# from app.core.rate_limit import limiter
# from slowapi import _rate_limit_exceeded_handler
# from slowapi.errors import RateLimitExceeded
#
# app.state.limiter = limiter
# app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

logger.warning("Rate limiting is temporarily disabled. Install slowapi to enable: 'poetry add slowapi'")

logger.info("SafeTasks V2 API starting up")

# Configure CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

@app.get("/")
async def root():
    return {"status": "ok"}


@app.get("/health")
async def health_check(db: AsyncSession = Depends(get_db)):
    """Health check endpoint that tests database connection."""
    try:
        # Execute a simple query to test database connection
        result = await db.execute(text("SELECT 1"))
        result.fetchone()
        return {"status": "ok", "db": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "database": f"error: {str(e)}"}
