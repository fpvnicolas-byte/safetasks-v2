import logging
import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_active_admin, get_current_supabase_user, check_supabase_subscription, get_supabase_client
from app.core.security import get_password_hash
from app.db.session import get_db
from app.models.user import Profile, User
from app.schemas.auth import UserInvite
from app.services.billing_service import BillingService

logger = logging.getLogger(__name__)


class UserUpdateStatus(BaseModel):
    """Schema for updating user active status"""
    is_active: bool


router = APIRouter()


@router.get("/me")
async def get_my_profile(
    current_profile: Profile = Depends(get_current_supabase_user)
):
    """Get current user's profile data for debugging."""
    return {
        "id": str(current_profile.id),
        "email": current_profile.email,
        "full_name": current_profile.full_name,
        "role": current_profile.role,
        "organization_id": current_profile.organization_id,
        "is_active": current_profile.is_active
    }


@router.get("/", response_model=List[dict])
async def get_users(
    current_profile: Profile = Depends(get_current_supabase_user),
    db: AsyncSession = Depends(get_db),
    org: dict = Depends(check_supabase_subscription)
) -> List[dict]:
    """Get all users in the current user's organization."""
    
    # Use Profile table (Supabase) since legacy users table is empty
    result = await db.execute(
        select(Profile).where(Profile.organization_id == current_profile.organization_id)
    )
    profiles = result.scalars().all()

    return [{
        "id": str(profile.id),  # UUID as string
        "email": profile.email,
        "full_name": profile.full_name,
        "role": profile.role,
        "organization_id": profile.organization_id,
        "is_active": profile.is_active
    } for profile in profiles]


@router.post("/invite-crew", response_model=dict)
async def invite_crew_member(
    invite_data: UserInvite,
    current_profile: Profile = Depends(get_current_supabase_user),
    db: AsyncSession = Depends(get_db),
    org: dict = Depends(check_supabase_subscription)
) -> dict:
    """Invite a crew member to join the organization (only admins can invite)."""

    # Check if current user is admin/owner
    if current_profile.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Only organization admins can invite crew members"
        )

    # Check plan limits for collaborators
    await BillingService.check_collaborator_limit(current_profile.organization_id, db)

    # Check if email already exists
    existing_profile = await db.execute(
        select(Profile).where(Profile.email == invite_data.email)
    )
    if existing_profile.scalar_one_or_none():
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    # Create user in Supabase Auth first
    supabase = get_supabase_client()
    try:
        # Invite user via Supabase Auth - this creates the auth user
        auth_response = supabase.auth.admin.invite_user_by_email(invite_data.email, {
            'data': {
                'full_name': invite_data.full_name,
                'organization_id': current_profile.organization_id,
                'role': invite_data.role
            }
        })

        auth_user_id = auth_response.user.id if auth_response.user else None

        if not auth_user_id:
            raise HTTPException(
                status_code=500,
                detail="Failed to create user in Supabase Auth"
            )

    except Exception as e:
        logger.error(f"Failed to invite user via Supabase: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to send invitation: {str(e)}"
        )

    # Create profile in database with the Supabase Auth user ID
    profile = Profile(
        id=auth_user_id,  # Use the actual Supabase user ID
        email=invite_data.email,
        full_name=invite_data.full_name,
        organization_id=current_profile.organization_id,
        role=invite_data.role,  # Default "user" for crew
        is_active=True
    )
    db.add(profile)
    await db.commit()
    await db.refresh(profile)

    return {
        "id": str(profile.id),
        "email": profile.email,
        "full_name": profile.full_name,
        "role": profile.role,
        "organization_id": profile.organization_id,
        "is_active": profile.is_active
    }


@router.patch("/{user_id}", response_model=dict)
async def update_user_status(
    user_id: str,
    update_data: UserUpdateStatus,
    current_profile: Profile = Depends(get_current_supabase_user),
    db: AsyncSession = Depends(get_db),
    org: dict = Depends(check_supabase_subscription)
) -> dict:
    """Update user active status (only admins can update users)."""

    # Get user to update
    result = await db.execute(
        select(Profile).where(
            Profile.id == user_id,
            Profile.organization_id == current_profile.organization_id
        )
    )
    profile = result.scalar_one_or_none()

    if profile is None:
        raise HTTPException(status_code=404, detail="User not found")

    # Prevent users from deactivating themselves
    if profile.id == current_profile.id and not update_data.is_active:
        raise HTTPException(
            status_code=400,
            detail="You cannot deactivate your own account"
        )

    # Update status
    profile.is_active = update_data.is_active
    db.add(profile)
    await db.commit()
    await db.refresh(profile)

    return {
        "id": str(profile.id),
        "email": profile.email,
        "full_name": profile.full_name,
        "role": profile.role,
        "organization_id": profile.organization_id,
        "is_active": profile.is_active
    }


@router.delete("/{user_id}")
async def delete_user(
    user_id: str,
    current_profile: Profile = Depends(get_current_supabase_user),
    db: AsyncSession = Depends(get_db),
    org: dict = Depends(check_supabase_subscription)
):
    """Delete a user from the organization (only admins can delete users)."""

    # Get user to delete
    result = await db.execute(
        select(Profile).where(
            Profile.id == user_id,
            Profile.organization_id == current_profile.organization_id
        )
    )
    profile = result.scalar_one_or_none()

    if profile is None:
        raise HTTPException(status_code=404, detail="User not found")

    # Prevent users from deleting themselves
    if profile.id == current_profile.id:
        raise HTTPException(
            status_code=400,
            detail="You cannot delete your own account"
        )

    # Delete user (cascade will handle related records, but we set user_id to NULL in ProductionCrew)
    await db.delete(profile)
    await db.commit()

    return {"message": "User deleted successfully"}


# ===== SUPABASE AUTH ENDPOINTS =====

@router.get("/supabase/me")
async def get_my_supabase_profile(
    current_profile = Depends(get_current_supabase_user)
):
    """Get current user's profile data using Supabase authentication."""
    return {
        "id": str(current_profile.id),
        "email": current_profile.email,
        "full_name": current_profile.full_name,
        "role": current_profile.role,
        "organization_id": current_profile.organization_id,
        "is_active": current_profile.is_active
    }
