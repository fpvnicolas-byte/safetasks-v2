from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_active_admin, get_current_user
from app.db.session import get_db
from app.models.production import Production
from app.models.production_crew import ProductionCrew
from app.models.user import User
from app.schemas.production import ProductionCreate, ProductionCrewResponse, ProductionResponse, ProductionUpdate

router = APIRouter()


@router.post("/", response_model=ProductionResponse)
async def create_production(
    production_data: ProductionCreate,
    current_user: User = Depends(get_current_active_admin),
    db: AsyncSession = Depends(get_db)
) -> ProductionResponse:
    """Create a new production for the current user's organization."""

    # Create production linked to current user's organization
    production = Production(
        title=production_data.title,
        organization_id=current_user.organization_id,
        client_id=production_data.client_id,
        deadline=production_data.deadline,
        shooting_sessions=production_data.shooting_sessions,
        payment_method=production_data.payment_method,
        due_date=production_data.due_date
    )

    db.add(production)
    await db.commit()
    await db.refresh(production)

    # Calculate initial financial totals for the new production
    from app.services.production_service import calculate_production_totals
    await calculate_production_totals(production.id, db)

    # Reload production with relationships loaded for proper serialization
    result = await db.execute(
        select(Production).where(Production.id == production.id).options(
            selectinload(Production.items),
            selectinload(Production.expenses),
            selectinload(Production.crew).selectinload(ProductionCrew.user),
            selectinload(Production.client)
        )
    )
    production = result.scalar_one()

    return ProductionResponse.from_orm(production)


@router.delete("/{production_id}")
async def delete_production(
    production_id: int,
    current_user: User = Depends(get_current_active_admin),
    db: AsyncSession = Depends(get_db)
):
    """Delete a production (only if it belongs to current user's organization)."""

    # Get production to delete
    result = await db.execute(
        select(Production).where(
            Production.id == production_id,
            Production.organization_id == current_user.organization_id
        )
    )
    production = result.scalar_one_or_none()

    if production is None:
        raise HTTPException(status_code=404, detail="Production not found")

    # Delete production (cascade will delete related items and expenses)
    await db.delete(production)
    await db.commit()

    return {"message": "Production deleted successfully"}


@router.patch("/{production_id}", response_model=ProductionResponse)
async def update_production(
    production_id: int,
    production_data: ProductionUpdate,
    current_user: User = Depends(get_current_active_admin),
    db: AsyncSession = Depends(get_db)
) -> ProductionResponse:
    """Update a production (only if it belongs to current user's organization)."""

    # Get production to update
    result = await db.execute(
        select(Production).where(
            Production.id == production_id,
            Production.organization_id == current_user.organization_id
        )
    )
    production = result.scalar_one_or_none()

    if production is None:
        raise HTTPException(status_code=404, detail="Production not found")

    # Update fields if provided
    update_data = production_data.dict(exclude_unset=True)

    # Check which fields are in the model vs schema
    model_fields = ['title', 'client_id', 'status', 'deadline', 'priority', 'shooting_sessions',
                   'subtotal', 'total_cost', 'total_value', 'discount', 'tax_rate',
                   'payment_method', 'payment_status', 'due_date']

    for field, value in update_data.items():
        # Handle empty strings as None for nullable fields
        if value == "" and field in ['shooting_sessions', 'payment_method']:
            value = None
        setattr(production, field, value)

    db.add(production)
    await db.commit()
    await db.refresh(production)

    # Recalculate totals if discount or tax_rate was updated (which affects tax calculation)
    if "discount" in update_data or "tax_rate" in update_data:
        from app.services.production_service import calculate_production_totals
        await calculate_production_totals(production_id, db)

    # Refresh and return updated production with items, expenses and crew
    result = await db.execute(
        select(Production).where(Production.id == production_id).options(
            selectinload(Production.items),
            selectinload(Production.expenses),
            selectinload(Production.crew).selectinload(ProductionCrew.user),
            selectinload(Production.client)
        )
    )
    updated_production = result.scalar_one()

    return ProductionResponse.from_orm(updated_production)


@router.get("/")
async def get_productions(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get productions for the current user based on their role."""

    if current_user.role == "admin":
        # Admin sees all productions in their organization
        result = await db.execute(
            select(Production).where(Production.organization_id == current_user.organization_id).options(
                selectinload(Production.items),
                selectinload(Production.expenses),
                selectinload(Production.crew).selectinload(ProductionCrew.user),  # Load user data for full_name
                selectinload(Production.client)  # Load client data for client_name
            )
        )
        productions = result.scalars().all()

        return [ProductionResponse.from_orm(production) for production in productions]

    else:
        # Crew members see only productions they're assigned to
        result = await db.execute(
            select(Production).join(
                ProductionCrew,
                Production.id == ProductionCrew.production_id
            ).where(
                Production.organization_id == current_user.organization_id,
                ProductionCrew.user_id == current_user.id
            ).options(
                selectinload(Production.items),
                selectinload(Production.expenses),
                selectinload(Production.crew).selectinload(ProductionCrew.user)  # Load user data for full_name
            )
        )
        productions = result.scalars().all()

        # Privacy filter: Crew members should only see their own crew information
        for production in productions:
            production.crew = [member for member in production.crew if member.user_id == current_user.id]

        return [ProductionCrewResponse.from_orm(production) for production in productions]


@router.get("/{production_id}")
async def get_production(
    production_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific production by ID based on user role permissions."""

    if current_user.role == "admin":
        # Admin can access any production in their organization
        result = await db.execute(
            select(Production).where(
                Production.id == production_id,
                Production.organization_id == current_user.organization_id
            ).options(
                selectinload(Production.items),
                selectinload(Production.expenses),
                selectinload(Production.crew).selectinload(ProductionCrew.user),  # Load user data for full_name
                selectinload(Production.client)  # Load client data for client_name
            )
        )
        production = result.scalar_one_or_none()

        if production:
            return ProductionResponse.from_orm(production)
    else:
        # Crew members can only access productions they're assigned to
        result = await db.execute(
            select(Production).join(
                ProductionCrew,
                Production.id == ProductionCrew.production_id
            ).where(
                Production.organization_id == current_user.organization_id,
                ProductionCrew.user_id == current_user.id,
                Production.id == production_id  # Added specific production filter
            ).options(
                selectinload(Production.items),
                selectinload(Production.expenses),
                selectinload(Production.crew).selectinload(ProductionCrew.user)  # Load user data for full_name
            )
        )
        production = result.scalar_one_or_none()

    if production is None:
        raise HTTPException(status_code=404, detail="Production not found")

    # Check user role for restricted access using RBAC
    if current_user.role != "admin":  # Not owner/admin - use restricted schema
        # Get only the crew member's own assignment
        crew_member = None
        for member in production.crew:
            if member.user_id == current_user.id:
                crew_member = member
                break

        # Create restricted response with ProductionCrewResponse schema
        from app.schemas.production import ProductionCrewResponse
        from app.schemas.production_crew import ProductionCrewMemberRestricted
        from app.schemas.production_item import ProductionItemCrewResponse

        # Filter crew to show only current user's information
        restricted_crew = []
        if crew_member:
            # Get user full_name for display
            user_full_name = crew_member.user.full_name if crew_member.user else "Unknown User"
            restricted_crew = [ProductionCrewMemberRestricted(
                full_name=user_full_name,
                role=crew_member.role,
                fee=crew_member.fee  # Show only their own fee
            )]

        # Convert items to crew response (without pricing)
        crew_items = [
            ProductionItemCrewResponse(
                id=item.id,
                production_id=item.production_id,
                name=item.name,
                quantity=item.quantity
                # unit_price and total_price omitted
            )
            for item in production.items
        ]

        return ProductionCrewResponse(
            id=production.id,
            title=production.title,
            status=production.status,
            deadline=production.deadline,
            locations=production.locations,
            filming_dates=production.filming_dates,
            created_at=production.created_at,
            # Payment fields - crew can see status and due date
            payment_status=production.payment_status,
            due_date=production.due_date,
            # Financial fields explicitly omitted in ProductionCrewResponse
            items=crew_items,  # Items without pricing
            # expenses field COMPLETELY REMOVED for crew
            crew=restricted_crew  # Only their own assignment
        )
    else:
        # Owner/Admin - full access with all financial data
        return ProductionResponse.from_orm(production)
