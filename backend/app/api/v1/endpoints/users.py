from typing import List

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_active_admin, get_current_user
from app.core.security import get_password_hash
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import UserInvite, UserResponse


class UserUpdateStatus(BaseModel):
    """Schema for updating user active status"""
    is_active: bool


router = APIRouter()


@router.get("/me", response_model=UserResponse)
async def get_my_profile(
    current_user: User = Depends(get_current_user)
) -> UserResponse:
    """Get current user's profile data for debugging."""
    return UserResponse.from_orm(current_user)


@router.get("/", response_model=List[UserResponse])
async def get_users(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> List[UserResponse]:
    """Get all users in the current user's organization."""

    result = await db.execute(
        select(User).where(User.organization_id == current_user.organization_id)
    )
    users = result.scalars().all()

    return [UserResponse.from_orm(user) for user in users]


@router.post("/invite-crew", response_model=UserResponse)
async def invite_crew_member(
    invite_data: UserInvite,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> UserResponse:
    """Invite a crew member to join the organization (only admins can invite)."""

    # Check if current user is admin/owner
    if current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Only organization admins can invite crew members"
        )

    # Check if email already exists
    existing_user = await db.execute(
        select(User).where(User.email == invite_data.email)
    )
    if existing_user.scalar_one_or_none():
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    # Hash the password using pwd_context
    hashed_password = get_password_hash(invite_data.password)

    # Create user with crew role (they can set password later via email link)
    user = User(
        email=invite_data.email,
        hashed_password=hashed_password,
        full_name=invite_data.full_name,
        organization_id=current_user.organization_id,
        role=invite_data.role,  # Default "user" for crew
        is_active=True
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    return UserResponse.from_orm(user)


@router.patch("/{user_id}", response_model=UserResponse)
async def update_user_status(
    user_id: int,
    update_data: UserUpdateStatus,
    current_user: User = Depends(get_current_active_admin),
    db: AsyncSession = Depends(get_db)
) -> UserResponse:
    """Update user active status (only admins can update users)."""

    # Get user to update
    result = await db.execute(
        select(User).where(
            User.id == user_id,
            User.organization_id == current_user.organization_id
        )
    )
    user = result.scalar_one_or_none()

    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    # Prevent users from deactivating themselves
    if user.id == current_user.id and not update_data.is_active:
        raise HTTPException(
            status_code=400,
            detail="You cannot deactivate your own account"
        )

    # Update status
    user.is_active = update_data.is_active
    db.add(user)
    await db.commit()
    await db.refresh(user)

    return UserResponse.from_orm(user)


@router.delete("/{user_id}")
async def delete_user(
    user_id: int,
    current_user: User = Depends(get_current_active_admin),
    db: AsyncSession = Depends(get_db)
):
    """Delete a user from the organization (only admins can delete users)."""

    # Get user to delete
    result = await db.execute(
        select(User).where(
            User.id == user_id,
            User.organization_id == current_user.organization_id
        )
    )
    user = result.scalar_one_or_none()

    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    # Prevent users from deleting themselves
    if user.id == current_user.id:
        raise HTTPException(
            status_code=400,
            detail="You cannot delete your own account"
        )

    # Delete user (cascade will handle related records, but we set user_id to NULL in ProductionCrew)
    await db.delete(user)
    await db.commit()

    return {"message": "User deleted successfully"}
