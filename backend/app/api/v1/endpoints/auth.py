from datetime import datetime, timedelta
import logging
import uuid

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_current_supabase_user
from app.core.config import settings
from app.core.security import create_access_token, get_password_hash, verify_password
from app.db.session import get_db
from app.models.user import Organization, User, Profile
from app.schemas.auth import Token, UserCreate, UserLogin, UserResponse
from app.core.billing_config import SubscriptionStatus

# Import Supabase client (lazy initialization)
try:
    from supabase import create_client, Client
    SUPABASE_AVAILABLE = True

    def get_supabase_client() -> Client:
        """Get Supabase client with lazy initialization"""
        return create_client(settings.supabase_url, settings.supabase_service_role_key)

except ImportError:
    SUPABASE_AVAILABLE = False
    def get_supabase_client():
        raise Exception("Supabase client not available")
    logging.warning("Supabase client not available. Supabase auth features will be disabled.")

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/register-owner", response_model=UserResponse)
async def register_owner(
    request: Request,
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db)
) -> UserResponse:
    """Register a new organization owner (tenant admin)."""

    logger.debug("Attempting to register new owner.")

    # Check if email already exists
    existing_user = await db.execute(
        select(User).where(User.email == user_data.email)
    )
    if existing_user.scalar_one_or_none():
        logger.debug(f"Email {user_data.email} already registered.")
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    # Create new organization
    organization = Organization(
        name=user_data.organization_name,
        subscription_status=SubscriptionStatus.TRIALING
    )
    
    logger.debug(f"New organization created with status: {organization.subscription_status}")
    if organization.subscription_status == SubscriptionStatus.TRIALING:
        organization.trial_ends_at = datetime.utcnow() + timedelta(days=settings.trial_period_days)
        logger.debug(f"Trial ends at set to: {organization.trial_ends_at}")

    db.add(organization)
    await db.flush()

    # Create user with admin/owner role
    hashed_password = get_password_hash(user_data.password)
    user = User(
        email=user_data.email,
        hashed_password=hashed_password,
        full_name=user_data.full_name,
        organization_id=organization.id,
        role="admin"
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    logger.debug(f"User {user.email} registered with organization {organization.id}")
    return UserResponse.from_orm(user)


@router.post("/login", response_model=Token)
async def login(
    request: Request,
    user_credentials: UserLogin,
    db: AsyncSession = Depends(get_db)
) -> Token:
    """Authenticate user and return JWT token."""

    logger.debug(f"Attempting login for user: {user_credentials.username}")
    # Get user by email
    result = await db.execute(
        select(User).where(User.email == user_credentials.username)
    )
    user = result.scalar_one_or_none()

    # Check if user exists and password is correct
    if not user or not verify_password(user_credentials.password, user.hashed_password):
        logger.debug(f"Login failed for user {user_credentials.username}: Incorrect credentials.")
        raise HTTPException(
            status_code=400,
            detail="Incorrect email or password"
        )

    # Create access token
    access_token = create_access_token(data={"sub": str(user.id)})

    logger.debug(f"Login successful for user: {user.email}")
    return Token(access_token=access_token, token_type="bearer")


# ===== SUPABASE AUTH ENDPOINTS =====

@router.post("/supabase/register-owner", response_model=dict)
async def register_owner_supabase(
    request: Request,
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db)
) -> dict:
    """
    Register a new organization owner using Supabase Auth.
    Creates profile and organization in database using supabase_user_id from frontend.
    DOES NOT register in Supabase Auth - that's done by frontend.
    """
    logger.info(f"🔍 DEBUG: Received registration request with data: {user_data.dict()}")

    if not SUPABASE_AVAILABLE:
        logger.error("❌ Supabase client is not available. Cannot register user.")
        raise HTTPException(
            status_code=503,
            detail="Supabase authentication service is not available"
        )

    logger.debug("Creating profile and organization for Supabase user.")

    try:
        # ✅ CORREÇÃO: NÃO registrar novamente no Supabase - usar apenas o ID fornecido
        if not user_data.supabase_user_id:
            logger.error("❌ No supabase_user_id provided. User must be registered in Supabase first.")
            raise HTTPException(
                status_code=400,
                detail="supabase_user_id is required. Register user in Supabase first."
            )

        user_id = user_data.supabase_user_id
        logger.info(f"✅ Using Supabase user ID: {user_id}")

        logger.info("🔍 Creating organization...")
        # ✅ Sempre criar organização e perfil
        organization = Organization(
            name=user_data.organization_name,
            subscription_status=SubscriptionStatus.TRIALING
        )

        if organization.subscription_status == SubscriptionStatus.TRIALING:
            organization.trial_ends_at = datetime.utcnow() + timedelta(days=settings.trial_period_days)

        logger.info(f"🔍 Organization data: name={organization.name}, status={organization.subscription_status}")
        try:
            db.add(organization)
            await db.flush()
            logger.info(f"✅ Organization created with ID: {organization.id}")
        except Exception as org_error:
            logger.error(f"❌ Failed to create organization: {org_error}")
            raise

        # ✅ CORREÇÃO: Como não temos auth_response, assumimos que o perfil é ativo
        # quando email confirmation está desabilitado (o que o usuário fez)
        # Para email confirmation habilitado, seria inativo inicialmente
        is_active = True  # Temporário: assumindo email confirmation desabilitado
        logger.info(f"🔍 Creating profile with is_active={is_active}")

        profile = Profile(
            id=user_id,
            email=user_data.email,
            full_name=user_data.full_name,
            organization_id=organization.id,
            role="admin",
            is_active=is_active
        )

        logger.info(f"🔍 Profile data: id={profile.id}, email={profile.email}, org_id={profile.organization_id}")
        try:
            db.add(profile)
            await db.commit()
            await db.refresh(profile)
            logger.info(f"✅ Profile created successfully")
        except Exception as profile_error:
            logger.error(f"❌ Failed to create profile: {profile_error}")
            raise

        logger.debug(f"User {user_data.email} registered with Supabase Auth and organization {organization.id}")
        logger.debug(f"Profile created with is_active={is_active}")

        return {
            "message": "User registered successfully",
            "user_id": str(user_id),
            "organization_id": organization.id,
            "email": user_data.email,
            "requires_email_confirmation": False,  # Email confirmation desabilitado
            "access_token": None,  # Não temos mais acesso aos tokens aqui
            "refresh_token": None
        }

    except Exception as e:
        await db.rollback()
        logger.error(f"❌ Failed to register user with Supabase: {e}")
        logger.error(f"❌ Exception type: {type(e)}")
        import traceback
        logger.error(f"❌ Full traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=400,
            detail=f"Registration failed: {str(e)}"
        )


@router.post("/supabase/login", response_model=dict)
async def login_supabase(
    request: Request,
    user_credentials: UserLogin,
    db: AsyncSession = Depends(get_db)
) -> dict:
    """
    Authenticate user using Supabase Auth.
    Returns Supabase JWT tokens instead of our custom JWT.
    """
    if not SUPABASE_AVAILABLE:
        raise HTTPException(
            status_code=503,
            detail="Supabase authentication is not available"
        )

    logger.debug(f"Attempting Supabase login for user: {user_credentials.username}")

    try:
        # Initialize Supabase client when needed
        supabase = get_supabase_client()

        # Authenticate with Supabase
        auth_response = supabase.auth.sign_in_with_password({
            "email": user_credentials.username,
            "password": user_credentials.password,
        })

        if auth_response.user is None or auth_response.session is None:
            raise HTTPException(
                status_code=400,
                detail="Invalid email or password"
            )

        user_id = auth_response.user.id
        user_email = user_credentials.username
        user_metadata = auth_response.user.user_metadata or {}

        # Verify user profile exists and is active
        result = await db.execute(select(Profile).where(Profile.id == user_id))
        profile = result.scalar_one_or_none()

        # ✅ NEW: Create profile if it doesn't exist (first login after email confirmation)
        if not profile:
            logger.debug(f"Creating new profile for user {user_id} after email confirmation")

            # Get user metadata from Supabase
            full_name = user_metadata.get("full_name", "Unknown User")
            organization_name = user_metadata.get("organization_name", "My Organization")

            # Create organization first
            organization = Organization(
                name=organization_name,
                subscription_status=SubscriptionStatus.TRIALING
            )

            if organization.subscription_status == SubscriptionStatus.TRIALING:
                organization.trial_ends_at = datetime.utcnow() + timedelta(days=settings.trial_period_days)

            db.add(organization)
            await db.flush()

            # Create user profile
            profile = Profile(
                id=user_id,
                email=user_email,
                full_name=full_name,
                organization_id=organization.id,
                role="admin",
                is_active=True
            )

            db.add(profile)
            await db.commit()
            await db.refresh(profile)

            logger.debug(f"Profile created successfully for user {user_id}")

        if not profile.is_active:
            raise HTTPException(
                status_code=403,
                detail="Account is inactive"
            )

        logger.debug(f"Supabase login successful for user: {user_credentials.username}")

        return {
            "access_token": auth_response.session.access_token,
            "refresh_token": auth_response.session.refresh_token,
            "token_type": "bearer",
            "expires_in": auth_response.session.expires_in,
            "user": {
                "id": str(user_id),
                "email": profile.email,
                "full_name": profile.full_name,
                "role": profile.role,
                "organization_id": profile.organization_id
            }
        }

    except Exception as e:
        logger.error(f"Supabase login failed for user {user_credentials.username}: {e}")
        raise HTTPException(
            status_code=400,
            detail="Invalid email or password"
        )


@router.post("/supabase/logout")
async def logout_supabase():
    """
    Logout from Supabase Auth.
    This invalidates the session on Supabase side.
    """
    if not SUPABASE_AVAILABLE:
        raise HTTPException(
            status_code=503,
            detail="Supabase authentication is not available"
        )

    try:
        # Initialize Supabase client when needed
        supabase = get_supabase_client()

        # Sign out from Supabase (this will invalidate the session)
        supabase.auth.sign_out()
        return {"message": "Successfully logged out"}
    except Exception as e:
        logger.error(f"Supabase logout failed: {e}")
        # Even if Supabase logout fails, we return success to avoid blocking the user
        return {"message": "Logged out (with warnings)"}


@router.get("/supabase/me")
async def get_supabase_current_user(
    current_profile: Profile = Depends(get_current_supabase_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get current authenticated user profile from Supabase JWT.
    """
    return {
        "id": str(current_profile.id),
        "email": current_profile.email,
        "full_name": current_profile.full_name,
        "role": current_profile.role,
        "organization_id": current_profile.organization_id,
        "is_active": current_profile.is_active
    }
