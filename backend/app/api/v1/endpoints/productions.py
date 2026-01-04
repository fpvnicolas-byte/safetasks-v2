import logging
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Request  # type: ignore
from sqlalchemy import select, func  # type: ignore
from sqlalchemy.ext.asyncio import AsyncSession  # type: ignore
from sqlalchemy.orm import selectinload  # type: ignore

# from app.core.rate_limit import limiter  # TODO: Enable when slowapi is installed

from app.api.deps import get_current_active_admin, get_current_user
from app.db.session import get_db
from app.core.cache import cache, CacheKeys
from app.models.client import Client
from app.models.expense import Expense
from app.models.production import Production
from app.models.production_crew import ProductionCrew
from app.models.production_item import ProductionItem
from app.models.user import User, Organization
from app.schemas.production import ProductionCreate, ProductionCrewResponse, ProductionResponse, ProductionUpdate
from app.services.production_service import calculate_production_totals

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/", response_model=ProductionResponse)
# @limiter.limit("30/minute")  # Write operations limit - TODO: Enable when slowapi is installed
async def create_production(
    request: Request,
    production_data: ProductionCreate,
    current_user: User = Depends(get_current_active_admin),
    db: AsyncSession = Depends(get_db)
) -> ProductionResponse:
    """Create a new production for the current user's organization."""

    # Get organization for default tax rate using the user's organization_id
    org_result = await db.execute(
        select(Organization).where(Organization.id == current_user.organization_id)
    )
    organization = org_result.scalar_one()

    # Create production linked to current user's organization with default tax rate
    production = Production(
        title=production_data.title,
        organization_id=current_user.organization_id,
        client_id=production_data.client_id,
        deadline=production_data.deadline,
        shooting_sessions=production_data.shooting_sessions,
        payment_method=production_data.payment_method,
        due_date=production_data.due_date,
        tax_rate=organization.default_tax_rate  # Set default tax rate from organization
    )

    db.add(production)
    await db.commit()
    await db.refresh(production)

    # Calculate initial financial totals for the new production
    from app.services.production_service import calculate_production_totals
    await calculate_production_totals(production.id, db)
    await db.commit()  # Commit the calculated totals

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

    # Invalidate cache for productions and dashboard
    await cache.delete_pattern(f"productions:list:{current_user.organization_id}:*")
    await cache.delete(CacheKeys.dashboard_summary(current_user.organization_id))

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

    # Invalidate cache for productions and dashboard
    await cache.delete_pattern(f"productions:list:{current_user.organization_id}:*")
    await cache.delete(CacheKeys.dashboard_summary(current_user.organization_id))

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
                   'payment_method', 'payment_status', 'due_date', 'notes']

    for field, value in update_data.items():
        # Handle empty strings as None for nullable fields
        if value == "" and field in ['shooting_sessions', 'payment_method']:
            value = None
            value = None
        setattr(production, field, value)

    db.add(production)
    await db.commit()
    await db.refresh(production)

    # Recalculate totals if discount or tax_rate was updated (which affects tax calculation)
    if "discount" in update_data or "tax_rate" in update_data:
        from app.services.production_service import calculate_production_totals
        await calculate_production_totals(production_id, db)
        await db.commit()  # Commit the calculated totals

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
# @limiter.limit("200/minute")  # Read operations limit - TODO: Enable when slowapi is installed
async def get_productions(
    request: Request,
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get productions for the current user based on their role.

    Optimized to use a single query with eager loading to prevent N+1 query problems.
    All related data (items, expenses, crew, client) is loaded in one efficient query.
    Uses Redis cache for first page to improve performance.

    Args:
        skip: Number of records to skip (for pagination). Default: 0
        limit: Maximum number of records to return. Default: 50, Max: 100
        current_user: Authenticated user
        db: Database session

    Returns:
        List of productions with pagination metadata
    """

    # Try cache for first page only (most common case)
    cache_key = None
    if skip == 0 and limit <= 50:  # Only cache first page with reasonable limit
        cache_key = CacheKeys.productions_list(current_user.organization_id, current_user.role, skip, limit)
        cached_result = await cache.get(cache_key)
        if cached_result:
            logger.info(f"Cache hit for productions list: {cache_key}")
            return cached_result

    # Validate pagination parameters
    if skip < 0:
        skip = 0
    if limit < 1:
        limit = 1
    if limit > 100:
        limit = 100  # Maximum limit to prevent abuse

    if current_user.role == "admin":
        # Admin sees all productions in their organization
        # Single optimized query with all relationships eagerly loaded
        
        # First, get total count for pagination metadata (optimized with COUNT)
        count_result = await db.execute(
            select(func.count(Production.id))
            .where(Production.organization_id == current_user.organization_id)
        )
        total_count = count_result.scalar_one()
        
        # Then get paginated results with explicit eager loading
        # selectinload prevents N+1 queries by loading all relationships in one query
        result = await db.execute(
            select(Production)
            .where(Production.organization_id == current_user.organization_id)
            .options(
                selectinload(Production.items),
                selectinload(Production.expenses),
                selectinload(Production.crew).selectinload(ProductionCrew.user),
                selectinload(Production.client)
            )
            .order_by(Production.created_at.desc())
            .offset(skip)
            .limit(limit)
        )

        # No unique() needed with selectinload - it prevents duplicates by design
        productions = result.scalars().all()

        # Log query performance metrics (production-ready logging)
        logger.info(f"ADMIN: Retrieved {len(productions)} productions with eager loading (skip={skip}, limit={limit})")

        # Totals are calculated during write operations, no need to recalculate on read

        result = {
            "productionsList": [ProductionResponse.from_orm(production) for production in productions],
            "total": total_count,
            "skip": skip,
            "limit": limit,
            "has_more": (skip + limit) < total_count
        }

        # Cache result for first page
        if cache_key:
            await cache.set(cache_key, result, ttl_seconds=300)  # 5 minutes cache
            logger.info(f"Cached productions list: {cache_key}")

        return result

    else:
        # Crew members see only productions they're assigned to
        # Single optimized query with all relationships eagerly loaded
        
        # First, get total count for pagination metadata (optimized with COUNT)
        count_result = await db.execute(
            select(func.count(Production.id))
            .join(
                ProductionCrew,
                Production.id == ProductionCrew.production_id
            )
            .where(
                Production.organization_id == current_user.organization_id,
                ProductionCrew.user_id == current_user.id
            )
        )
        total_count = count_result.scalar_one()
        
        # Then get paginated results with explicit eager loading
        # Added client loading to prevent N+1 queries when displaying client names
        result = await db.execute(
            select(Production)
            .join(
                ProductionCrew,
                Production.id == ProductionCrew.production_id
            )
            .where(
                Production.organization_id == current_user.organization_id,
                ProductionCrew.user_id == current_user.id
            )
            .options(
                selectinload(Production.items),
                selectinload(Production.expenses),
                selectinload(Production.crew).selectinload(ProductionCrew.user),
                selectinload(Production.client)  # Added to prevent N+1 queries for client names
            )
            .order_by(Production.created_at.desc())
            .offset(skip)
            .limit(limit)
        )

        # No unique() needed with selectinload - it prevents duplicates by design
        productions = result.scalars().all()

        # Privacy filter: Crew members should only see their own crew information
        for production in productions:
            production.crew = [member for member in production.crew if member.user_id == current_user.id]

        # Log query performance metrics (production-ready logging)
        logger.info(f"CREW: Retrieved {len(productions)} productions with eager loading (skip={skip}, limit={limit})")

        # Totals are calculated during write operations, no need to recalculate on read

        # Privacy filter: Crew members should only see their own crew information
        for production in productions:
            production.crew = [member for member in production.crew if member.user_id == current_user.id]

        return {
            "items": [ProductionCrewResponse.from_orm(production) for production in productions],
            "total": total_count,
            "skip": skip,
            "limit": limit,
            "has_more": (skip + limit) < total_count
        }


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
                selectinload(Production.crew).selectinload(ProductionCrew.user),
                selectinload(Production.client)
            )
        )
        production = result.unique().scalar_one_or_none()

        if production:
            # Debug logging
            try:
                items_count = len(production.items) if production.items else 0
                expenses_count = len(production.expenses) if production.expenses else 0
                crew_count = len(production.crew) if production.crew else 0
                logger.info(f"SINGLE Production {production.id}: items={items_count}, expenses={expenses_count}, crew={crew_count}")
            except Exception as e:
                logger.warning(f"Could not access relations for single production {production.id}: {e}")

            # Totals are calculated during write operations, no need to recalculate on read

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
                Production.id == production_id
            ).options(
                selectinload(Production.items),
                selectinload(Production.expenses),
                selectinload(Production.crew).selectinload(ProductionCrew.user)
            )
        )
        production = result.unique().scalar_one_or_none()

        if production:
            # Filter crew to show only current user's information
            production.crew = [member for member in production.crew if member.user_id == current_user.id]

            # Debug logging
            try:
                items_count = len(production.items) if production.items else 0
                expenses_count = len(production.expenses) if production.expenses else 0
                crew_count = len(production.crew) if production.crew else 0
                logger.info(f"SINGLE CREW Production {production.id}: items={items_count}, expenses={expenses_count}, crew={crew_count}")
            except Exception as e:
                logger.warning(f"Could not access relations for single crew production {production.id}: {e}")

            # Totals are calculated during write operations, no need to recalculate on read

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
