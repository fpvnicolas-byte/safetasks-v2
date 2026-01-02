from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.security import create_access_token, get_password_hash, verify_password
from app.db.session import get_db
from app.models.user import Organization, User
from app.schemas.auth import Token, UserCreate, UserLogin, UserResponse

router = APIRouter()


@router.post("/register-owner", response_model=UserResponse)
async def register_owner(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db)
) -> UserResponse:
    """Register a new organization owner (tenant admin)."""

    # Check if email already exists
    existing_user = await db.execute(
        select(User).where(User.email == user_data.email)
    )
    if existing_user.scalar_one_or_none():
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    # Create new organization
    organization = Organization(name=user_data.organization_name)
    db.add(organization)
    await db.flush()  # Get the organization ID

    # Create user with admin/owner role
    hashed_password = get_password_hash(user_data.password)
    user = User(
        email=user_data.email,
        hashed_password=hashed_password,
        full_name=user_data.full_name,
        organization_id=organization.id,
        role="admin"  # Owner gets admin role
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    return UserResponse.from_orm(user)


@router.post("/login", response_model=Token)
async def login(
    user_credentials: UserLogin,
    db: AsyncSession = Depends(get_db)
) -> Token:
    """Authenticate user and return JWT token."""

    # Get user by email
    result = await db.execute(
        select(User).where(User.email == user_credentials.username)
    )
    user = result.scalar_one_or_none()

    # Check if user exists and password is correct
    if not user or not verify_password(user_credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=400,
            detail="Incorrect email or password"
        )

    # Create access token
    access_token = create_access_token(data={"sub": str(user.id)})

    return Token(access_token=access_token, token_type="bearer")
