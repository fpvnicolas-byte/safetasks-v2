from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy import select
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
