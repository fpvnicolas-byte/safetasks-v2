import logging
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_active_admin, get_current_user
from app.db.session import get_db
from app.models.production import Production
from app.models.production_crew import ProductionCrew
from app.models.user import Profile, User
from app.schemas.production_crew import ProductionCrewCreate, ProductionCrewResponse
from app.services.production_service import calculate_production_totals

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/productions/{production_id}/crew", response_model=ProductionCrewResponse)
async def add_crew_member(
    production_id: int,
    crew_data: ProductionCrewCreate,
    current_profile: Profile = Depends(get_current_active_admin),
    db: AsyncSession = Depends(get_db)
) -> ProductionCrewResponse:
    """Add a crew member to a production."""

    # Verify production exists and belongs to user's organization
    result = await db.execute(
        select(Production).where(
            Production.id == production_id,
            Production.organization_id == current_profile.organization_id
        )
    )
    production = result.scalar_one_or_none()

    if production is None:
        raise HTTPException(status_code=404, detail="Production not found")

    # Verify user exists and belongs to the same organization
    result = await db.execute(
        select(User).where(
            User.id == crew_data.user_id,
            User.organization_id == current_profile.organization_id
        )
    )
    user = result.scalar_one_or_none()

    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    # Check if user is already assigned to this production
    result = await db.execute(
        select(ProductionCrew).where(
            ProductionCrew.production_id == production_id,
            ProductionCrew.user_id == crew_data.user_id
        )
    )
    existing_assignment = result.scalar_one_or_none()

    if existing_assignment:
        raise HTTPException(status_code=400, detail="User is already assigned to this production")

    # Create crew assignment
    new_crew = ProductionCrew(
        production_id=production_id,
        user_id=crew_data.user_id,
        role=crew_data.role,
        fee=crew_data.fee
    )

    # Add and commit
    db.add(new_crew)
    await db.commit()

    # After commit, explicitly reload with relationship using selectinload
    stmt = select(ProductionCrew).options(selectinload(ProductionCrew.user)).where(ProductionCrew.id == new_crew.id)
    result = await db.execute(stmt)
    refreshed_crew = result.scalar_one()

    # Recalculate production totals (crew fees affect total_cost)
    await calculate_production_totals(production_id, db)
    await db.commit()  # Commit the calculated totals

    # Return dict to avoid Pydantic validation issues with SQLAlchemy objects
    return {
        "id": refreshed_crew.id,
        "production_id": refreshed_crew.production_id,
        "user_id": refreshed_crew.user_id,
        "role": refreshed_crew.role,
        "fee": refreshed_crew.fee,
        "full_name": refreshed_crew.user.full_name if refreshed_crew.user else None
    }


@router.get("/productions/{production_id}/crew", response_model=List[ProductionCrewResponse])
async def get_production_crew(
    production_id: int,
    current_profile: Profile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> List[ProductionCrewResponse]:
    """Get all crew members for a production."""

    # Verify production exists and belongs to user's organization
    result = await db.execute(
        select(Production).where(
            Production.id == production_id,
            Production.organization_id == current_profile.organization_id
        )
    )
    production = result.scalar_one_or_none()

    if production is None:
        raise HTTPException(status_code=404, detail="Production not found")

    if current_profile.role == "admin":
        # Admin sees all crew members
        result = await db.execute(
            select(ProductionCrew).where(ProductionCrew.production_id == production_id).options(
                selectinload(ProductionCrew.user)  # Load user data for display
            )
        )
        crew_members = result.scalars().all()
    else:
        # Crew members see only their own assignment - but this logic needs work since Profile.id is UUID and User.id is int
        # For now, let's just return empty list for non-admin users until we fix the data model
        crew_members = []
        logger.info(
            "Crew privacy filter applied - non-admin users see no crew for now",
            extra={
                "production_id": production_id,
                "profile_id": str(current_profile.id),
                "crew_members_shown": len(crew_members)
            }
        )

    return [ProductionCrewResponse.from_orm(member) for member in crew_members]


@router.delete("/productions/{production_id}/crew/{user_id}")
async def remove_crew_member(
    production_id: int,
    user_id: int,
    current_profile: Profile = Depends(get_current_active_admin),
    db: AsyncSession = Depends(get_db)
):
    """Remove a crew member from a production."""

    # Verify production exists and belongs to user's organization
    result = await db.execute(
        select(Production).where(
            Production.id == production_id,
            Production.organization_id == current_profile.organization_id
        )
    )
    production = result.scalar_one_or_none()

    if production is None:
        raise HTTPException(status_code=404, detail="Production not found")

    # Find the crew assignment
    result = await db.execute(
        select(ProductionCrew).where(
            ProductionCrew.production_id == production_id,
            ProductionCrew.user_id == user_id
        )
    )
    crew_assignment = result.scalar_one_or_none()

    if crew_assignment is None:
        raise HTTPException(status_code=404, detail="Crew member not found in this production")

    # Remove the assignment and flush to sync state
    await db.delete(crew_assignment)
    await db.flush()  # Synchronize state with database without closing transaction

    # Recalculate production totals with updated state (crew member removed)
    await calculate_production_totals(production_id, db)

    # Only commit after successful recalculation
    await db.commit()

    return {"message": "Crew member removed successfully"}
