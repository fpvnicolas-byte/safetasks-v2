from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_active_admin
from app.db.session import get_db
from app.models.user import Organization, User

router = APIRouter()


@router.get("/settings")
async def get_organization_settings(
    current_user: User = Depends(get_current_active_admin),
    db: AsyncSession = Depends(get_db)
):
    """Get organization settings."""

    result = await db.execute(
        select(Organization).where(Organization.id == current_user.organization_id)
    )
    organization = result.scalar_one_or_none()

    if organization is None:
        raise HTTPException(status_code=404, detail="Organization not found")

    return {
        "id": organization.id,
        "name": organization.name,
        "cnpj": organization.cnpj,
        "phone": organization.phone,
        "email": organization.email,
        "address": organization.address,
        "default_tax_rate": organization.default_tax_rate,
    }


@router.patch("/settings")
async def update_organization_settings(
    settings_data: dict,
    current_user: User = Depends(get_current_active_admin),
    db: AsyncSession = Depends(get_db)
):
    """Update organization settings."""

    result = await db.execute(
        select(Organization).where(Organization.id == current_user.organization_id)
    )
    organization = result.scalar_one_or_none()

    if organization is None:
        raise HTTPException(status_code=404, detail="Organization not found")

    # Update allowed fields
    allowed_fields = ['name', 'cnpj', 'phone', 'email', 'address', 'default_tax_rate']

    for field in allowed_fields:
        if field in settings_data:
            value = settings_data[field]
            if field == 'default_tax_rate' and value is not None:
                # Ensure tax rate is a valid float
                try:
                    value = float(value)
                    if value < 0 or value > 100:
                        raise ValueError("Tax rate must be between 0 and 100")
                except (ValueError, TypeError):
                    raise HTTPException(status_code=400, detail="Invalid tax rate value")
            setattr(organization, field, value)

    db.add(organization)
    await db.commit()
    await db.refresh(organization)

    return {
        "id": organization.id,
        "name": organization.name,
        "cnpj": organization.cnpj,
        "phone": organization.phone,
        "email": organization.email,
        "address": organization.address,
        "default_tax_rate": organization.default_tax_rate,
    }
