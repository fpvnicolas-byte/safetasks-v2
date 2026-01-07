from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_active_admin, get_current_user
from app.db.session import get_db
from app.models.service import Service
from app.models.user import User
from app.schemas.service import ServiceCreate, ServiceCrewRead, ServiceResponse

router = APIRouter()


@router.post("/", response_model=ServiceResponse)
async def create_service(
    service_data: ServiceCreate,
    current_user: User = Depends(get_current_active_admin),
    db: AsyncSession = Depends(get_db)
) -> ServiceResponse:
    """Create a new service for the current user's organization."""

    # Create service linked to current user's organization
    service = Service(
        name=service_data.name,
        description=service_data.description,
        default_price=service_data.default_price,
        unit=service_data.unit,
        organization_id=current_user.organization_id
    )

    db.add(service)
    await db.commit()
    await db.refresh(service)

    return ServiceResponse.from_orm(service)


@router.get("/")
async def get_services(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all services for the current user's organization."""

    # Get only services from current user's organization (data isolation)
    result = await db.execute(
        select(Service).where(Service.organization_id == current_user.organization_id)
    )
    services = result.scalars().all()

    if current_user.role == "admin":
        # Admin sees all service details including pricing
        return [ServiceResponse.from_orm(service) for service in services]
    else:
        # Crew members see services without pricing information
        return [ServiceCrewRead.from_orm(service) for service in services]


@router.delete("/{service_id}", response_model=ServiceResponse)
async def delete_service(
    service_id: int,
    current_user: User = Depends(get_current_active_admin),
    db: AsyncSession = Depends(get_db)
) -> ServiceResponse:
    """Delete a service if it belongs to the current user's organization and is not used in any production."""

    # Get service and verify ownership
    result = await db.execute(
        select(Service).where(
            Service.id == service_id,
            Service.organization_id == current_user.organization_id
        )
    )
    service = result.scalar_one_or_none()

    if not service:
        raise HTTPException(status_code=404, detail="Service not found")

    # Check if service is used in any production items
    from app.models.production_item import ProductionItem
    result = await db.execute(
        select(ProductionItem).where(ProductionItem.service_id == service_id)
    )
    production_items = result.scalars().all()

    if production_items:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete service that is used in productions"
        )

    # Delete the service
    await db.delete(service)
    await db.commit()

    return ServiceResponse.from_orm(service)
