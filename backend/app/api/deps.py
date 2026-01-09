import logging
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from app.core.config import settings
from app.db.session import get_db
from app.models.user import User, Profile, Organization
from app.services.billing_service import BillingService

logger = logging.getLogger(__name__)

# Import Supabase client for token validation
try:
    from supabase import create_client, Client
    SUPABASE_AVAILABLE = True

    def get_supabase_client() -> Client:
        """Get Supabase client for token validation"""
        return create_client(settings.supabase_url, settings.supabase_service_role_key)

except ImportError:
    SUPABASE_AVAILABLE = False
    def get_supabase_client():
        raise Exception("Supabase client not available - cannot validate JWT tokens")

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> Profile:
    """Get current authenticated user from Supabase JWT token using Supabase client."""

    print(f"🔍 get_current_user CHAMADA! Token: {credentials.credentials[:50]}...")  # Debug básico

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if not SUPABASE_AVAILABLE:
        print("❌ Supabase client not available")
        raise credentials_exception

    try:
        # Use Supabase client to validate the JWT token
        supabase = get_supabase_client()
        auth_response = supabase.auth.get_user(credentials.credentials)

        if auth_response.user is None:
            logger.error("❌ Supabase user validation failed - no user returned")
            raise credentials_exception

        user_id = auth_response.user.id
        print(f"✅ SUPABASE USER VALIDADO: {user_id}")  # Debug

    except Exception as e:
        logger.error(f"❌ ERRO FATAL NA VALIDAÇÃO SUPABASE: {str(e)}")
        logger.error(f"🔧 SUPABASE_URL: {settings.supabase_url}")
        logger.error(f"🔑 SERVICE_ROLE_KEY presente: {bool(settings.supabase_service_role_key)}")
        raise credentials_exception

    # Get user profile from database
    result = await db.execute(select(Profile).where(Profile.id == user_id))
    user_profile = result.scalar_one_or_none()

    if user_profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User profile not found"
        )

    if not user_profile.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )

    return user_profile


async def get_current_active_admin(
    current_profile: Profile = Depends(get_current_user)
) -> Profile:
    """Get current authenticated user and ensure they have admin/owner privileges."""

    if current_profile.role not in ["admin", "owner"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user doesn't have enough privileges"
        )

    return current_profile


async def check_subscription(
    current_profile: Profile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Organization:
    """
    Ensure the user's organization has an active subscription or trial.
    Returns the organization if valid, otherwise raises 402 Payment Required.
    """
    if not current_profile.organization_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is not associated with any organization"
        )

    result = await db.execute(
        select(Organization).where(Organization.id == current_profile.organization_id)
    )
    org = result.scalar_one_or_none()

    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    is_valid = await BillingService.get_organization_license_status(org)

    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="Subscription required. Please update your payment method."
        )

    return org


async def get_current_supabase_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> Profile:
    """
    Get current authenticated user from Supabase JWT token using Supabase client.
    This function validates JWT tokens issued by Supabase Auth.
    """
    print(f"🔍 get_current_supabase_user CHAMADA! Token: {credentials.credentials[:50]}...")  # Debug básico

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if not SUPABASE_AVAILABLE:
        print("❌ Supabase client not available")
        raise credentials_exception

    try:
        # Use Supabase client to validate the JWT token
        supabase = get_supabase_client()
        auth_response = supabase.auth.get_user(credentials.credentials)

        if auth_response.user is None:
            logger.error("❌ Supabase user validation failed - no user returned")
            raise credentials_exception

        user_id = auth_response.user.id
        print(f"✅ SUPABASE USER VALIDADO: {user_id}")  # Debug

    except Exception as e:
        logger.error(f"❌ ERRO FATAL NA VALIDAÇÃO SUPABASE: {str(e)}")
        logger.error(f"🔧 SUPABASE_URL: {settings.supabase_url}")
        logger.error(f"🔑 SERVICE_ROLE_KEY presente: {bool(settings.supabase_service_role_key)}")
        raise credentials_exception

    # Get user profile from database
    result = await db.execute(select(Profile).where(Profile.id == user_id))
    user_profile = result.scalar_one_or_none()

    if user_profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User profile not found"
        )

    if not user_profile.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )

    return user_profile


async def check_supabase_subscription(
    current_profile: Profile = Depends(get_current_supabase_user),
    db: AsyncSession = Depends(get_db)
) -> Organization:
    """
    Ensure the user's organization has an active subscription or trial.
    Works with Supabase authenticated users.
    Returns the organization if valid, otherwise raises 402 Payment Required.
    """
    if not current_profile.organization_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is not associated with any organization"
        )

    result = await db.execute(
        select(Organization).where(Organization.id == current_profile.organization_id)
    )
    org = result.scalar_one_or_none()

    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    is_valid = await BillingService.get_organization_license_status(org)

    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="Subscription required. Please update your payment method."
        )

    return org
