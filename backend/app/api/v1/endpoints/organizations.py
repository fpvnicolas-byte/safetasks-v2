from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import Organization, User
from app.schemas.organization import OrganizationResponse, OrganizationUpdate

router = APIRouter()


@router.get("/me", response_model=OrganizationResponse)
async def get_my_organization(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> OrganizationResponse:
    """Get current user's organization details."""

    # Get organization data
    result = await db.execute(
        select(Organization).where(Organization.id == current_user.organization_id)
    )
    organization = result.scalar_one_or_none()

    if organization is None:
        raise HTTPException(status_code=404, detail="Organization not found")

    return OrganizationResponse.from_orm(organization)


@router.patch("/me", response_model=OrganizationResponse)
async def update_my_organization(
    org_data: OrganizationUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> OrganizationResponse:
    """Update current user's organization details."""

    # Get organization to update
    result = await db.execute(
        select(Organization).where(Organization.id == current_user.organization_id)
    )
    organization = result.scalar_one_or_none()

    if organization is None:
        raise HTTPException(status_code=404, detail="Organization not found")

    # Update fields if provided
    update_data = org_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(organization, field, value)

    db.add(organization)
    await db.commit()
    await db.refresh(organization)

    return OrganizationResponse.from_orm(organization)
