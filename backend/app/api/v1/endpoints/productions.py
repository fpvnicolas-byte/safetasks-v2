import logging
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Request  # type: ignore
from sqlalchemy import select, func  # type: ignore
from sqlalchemy.ext.asyncio import AsyncSession  # type: ignore
from sqlalchemy.orm import selectinload  # type: ignore

from app.core.rate_limit import limiter

from app.api.deps import get_current_supabase_user, check_supabase_subscription
from app.db.session import get_db
from app.core.cache import cache, CacheKeys
from app.models.client import Client
from app.models.expense import Expense
from app.models.production import Production
from app.models.production_crew import ProductionCrew
from app.models.production_item import ProductionItem
from app.models.user import Profile, Organization
from app.schemas.production import ProductionCreate, ProductionCrewResponse, ProductionResponse, ProductionUpdate
from app.services.production_service import calculate_production_totals

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/", response_model=dict)
@limiter.limit("30/minute")  # Write operations limit
async def create_production(
    request: Request,
    production_data: ProductionCreate,
    current_profile: Profile = Depends(get_current_supabase_user),
    db: AsyncSession = Depends(get_db),
    org: dict = Depends(check_supabase_subscription)
) -> dict:
    """Create a new production for the current user's organization."""

    # Get organization for default tax rate using the profile's organization_id
    org_result = await db.execute(
        select(Organization).where(Organization.id == current_profile.organization_id)
    )
    organization = org_result.scalar_one()

    # Create production linked to current user's organization with default tax rate
    production = Production(
        title=production_data.title,
        organization_id=current_profile.organization_id,
        client_id=production_data.client_id,
        deadline=production_data.deadline,
        shooting_sessions=production_data.shooting_sessions,
        payment_method=production_data.payment_method,
        due_date=production_data.due_date,
        tax_rate=organization.default_tax_rate,  # Set default tax rate from organization
        # 🔒 PROTEÇÃO FINANCEIRA: Inicializar campos obrigatórios
        subtotal=0,
        total_cost=0,
        total_value=0,
        tax_amount=0,
        discount=0,
        profit=0
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
    await cache.delete_pattern(f"productions:list:{current_profile.organization_id}:*")
    await cache.delete(CacheKeys.dashboard_summary(current_profile.organization_id))

    return {
        "id": production.id,
        "title": production.title,
        "organization_id": production.organization_id,
        "client_id": production.client_id,
        "deadline": production.deadline,
        "shooting_sessions": production.shooting_sessions,
        "payment_method": production.payment_method,
        "due_date": production.due_date,
        "tax_rate": production.tax_rate,
        "status": production.status,
        "payment_status": production.payment_status,
        "created_at": production.created_at,
        "updated_at": production.updated_at
    }


@router.delete("/{production_id}")
async def delete_production(
    production_id: int,
    current_profile: Profile = Depends(get_current_supabase_user),
    db: AsyncSession = Depends(get_db),
    org: dict = Depends(check_supabase_subscription)
):
    """Delete a production (only if it belongs to current user's organization)."""

    # Get production to delete
    result = await db.execute(
        select(Production).where(
            Production.id == production_id,
            Production.organization_id == current_profile.organization_id
        )
    )
    production = result.scalar_one_or_none()

    if production is None:
        raise HTTPException(status_code=404, detail="Production not found")

    # Delete production (cascade will delete related items and expenses)
    await db.delete(production)
    await db.commit()

    # Invalidate cache for productions and dashboard
    await cache.delete_pattern(f"productions:list:{current_profile.organization_id}:*")
    await cache.delete(CacheKeys.dashboard_summary(current_profile.organization_id))

    return {"message": "Production deleted successfully"}


@router.patch("/{production_id}", response_model=dict)
async def update_production(
    production_id: int,
    production_data: ProductionUpdate,
    current_profile: Profile = Depends(get_current_supabase_user),
    db: AsyncSession = Depends(get_db),
    org: dict = Depends(check_supabase_subscription)
) -> dict:
    """Update a production (only if it belongs to current user's organization)."""
    
    # 🔍 DEBUG: Log incoming data
    logger.info(f"📦 RECEIVED PAYLOAD for production {production_id}")
    logger.info(f"📦 RAW DATA: {production_data}")
    
    # Try to serialize to see the actual structure
    try:
        import json
        logger.info(f"📦 SERIALIZED: {json.dumps(production_data.dict(exclude_unset=True), indent=2, default=str)}")
    except Exception as e:
        logger.error(f"❌ Failed to serialize payload: {e}")

    # Get production to update
    result = await db.execute(
        select(Production).where(
            Production.id == production_id,
            Production.organization_id == current_profile.organization_id
        )
    )
    production = result.scalar_one_or_none()

    if production is None:
        raise HTTPException(status_code=404, detail="Production not found")

    # BATCH SAVING: Separate nested data from simple fields
    update_data = production_data.dict(exclude_unset=True)

    # Extract nested arrays before processing simple fields
    items_data = update_data.pop('items', None)
    crew_data = update_data.pop('crew', None)
    expenses_data = update_data.pop('expenses', None)

    # Update simple fields only
    model_fields = ['title', 'client_id', 'status', 'deadline', 'priority', 'shooting_sessions',
                   'subtotal', 'total_cost', 'total_value', 'discount', 'tax_rate',
                   'payment_method', 'payment_status', 'due_date', 'notes']

    for field, value in update_data.items():
        # Handle empty strings as None for nullable fields
        if value == "" and field in ['shooting_sessions', 'payment_method']:
            value = None
        setattr(production, field, value)

    # BATCH SAVING: Replace relationships completely (delete all, recreate)
    # This is simpler than trying to diff existing vs new

    # Clear existing relationships
    production.items.clear()
    production.crew.clear()
    production.expenses.clear()

    # Recreate items from payload data
    if items_data:
        logger.info(f"📦 PROCESSING {len(items_data)} items")
        for idx, item_dict in enumerate(items_data):
            logger.info(f"📦 ITEM {idx}: {item_dict}")
            # 🔒 SEGURANÇA: NUNCA usar o ID recebido - sempre deixar o banco gerar
            # Remove 'id' do dict para forçar auto-increment (evita IDs negativos)
            item_dict.pop('id', None)
            
            # BATCH SAVING: Recalcular total_price para garantir integridade
            quantity = item_dict.get('quantity', 1)
            unit_price = item_dict.get('unit_price', 0)
            total_price = quantity * unit_price  # Cálculo obrigatório

            new_item = ProductionItem(
                production_id=production_id,
                service_id=item_dict.get('service_id'),
                name=item_dict.get('name'),
                quantity=quantity,
                unit_price=unit_price,
                total_price=total_price  # Campo obrigatório preenchido
            )
            production.items.append(new_item)

    # Recreate crew from payload data
    if crew_data:
        for crew_dict in crew_data:
            # 🔒 SEGURANÇA: NUNCA usar o ID recebido - sempre deixar o banco gerar
            crew_dict.pop('id', None)
            
            new_member = ProductionCrew(
                production_id=production_id,
                user_id=crew_dict.get('user_id'),
                role=crew_dict.get('role'),
                fee=crew_dict.get('fee', 0)
            )
            production.crew.append(new_member)

    # Recreate expenses from payload data
    if expenses_data:
        for expense_dict in expenses_data:
            # 🔒 SEGURANÇA: NUNCA usar o ID recebido - sempre deixar o banco gerar
            expense_dict.pop('id', None)
            
            new_expense = Expense(
                production_id=production_id,
                name=expense_dict.get('name'),
                value=expense_dict.get('value', 0),
                category=expense_dict.get('category')
            )
            production.expenses.append(new_expense)

    # 🔒 PROTEÇÃO FINANCEIRA: Garantir integridade antes do commit
    # Garantir defaults para campos obrigatórios
    if production.subtotal is None:
        production.subtotal = production.total_value if production.total_value is not None else 0
    if production.total_cost is None:
        production.total_cost = 0
    if production.tax_amount is None:
        production.tax_amount = 0
    if production.total_value is None:
        production.total_value = 0
    if production.discount is None:
        production.discount = 0
    if production.tax_rate is None:
        production.tax_rate = 0.0

    # Recalcular lucro para garantir consistência matemática
    production.profit = production.total_value - production.total_cost - production.tax_amount

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

    return {
        "id": updated_production.id,
        "title": updated_production.title,
        "organization_id": updated_production.organization_id,
        "client_id": updated_production.client_id,
        "deadline": updated_production.deadline,
        "shooting_sessions": updated_production.shooting_sessions,
        "payment_method": updated_production.payment_method,
        "due_date": updated_production.due_date,
        "tax_rate": updated_production.tax_rate,
        "status": updated_production.status,
        "payment_status": updated_production.payment_status,
        "created_at": updated_production.created_at,
        "updated_at": updated_production.updated_at
    }


@router.get("/")
@limiter.limit("200/minute")  # Read operations limit
async def get_productions(
    request: Request,
    skip: int = 0,
    limit: int = 50,
    current_profile: Profile = Depends(get_current_supabase_user),
    db: AsyncSession = Depends(get_db),
    org: dict = Depends(check_supabase_subscription)
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
        cache_key = CacheKeys.productions_list(current_profile.organization_id, current_profile.role, skip, limit)
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

    if current_profile.role == "admin":
        # Admin sees all productions in their organization
        # Single optimized query with all relationships eagerly loaded
        
        # First, get total count for pagination metadata (optimized with COUNT)
        count_result = await db.execute(
            select(func.count(Production.id))
            .where(Production.organization_id == current_profile.organization_id)
        )
        total_count = count_result.scalar_one()
        
        # Then get paginated results with explicit eager loading
        # selectinload prevents N+1 queries by loading all relationships in one query
        result = await db.execute(
            select(Production)
            .where(Production.organization_id == current_profile.organization_id)
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
            "productionsList": [{
                "id": production.id,
                "title": production.title,
                "organization_id": production.organization_id,
                "client_id": production.client_id,
                "client": {
                    "id": production.client.id,
                    "full_name": production.client.full_name,
                    "email": production.client.email,
                    "cnpj": production.client.cnpj,
                    "phone": production.client.phone,
                    "created_at": production.client.created_at
                } if production.client else None,
                "status": production.status,
                "deadline": production.deadline,
                "shooting_sessions": production.shooting_sessions,
                "notes": production.notes,
                "created_at": production.created_at,
                "updated_at": production.updated_at,
                # Payment fields
                "payment_method": production.payment_method,
                "payment_status": production.payment_status,
                "due_date": production.due_date,
                # Financial fields
                "subtotal": production.subtotal,
                "discount": production.discount,
                "tax_rate": production.tax_rate,
                "tax_amount": production.tax_amount,
                "total_value": production.total_value,
                "total_cost": production.total_cost,
                "profit": production.profit,
                # Related data - CRÍTICO para o frontend
                "items": [{
                    "id": item.id,
                    "production_id": item.production_id,
                    "name": item.name,
                    "quantity": item.quantity,
                    "unit_price": item.unit_price,
                    "total_price": item.total_price
                } for item in production.items],
                "expenses": [{
                    "id": expense.id,
                    "production_id": expense.production_id,
                    "name": expense.name,
                    "value": expense.value,
                    "category": expense.category,
                    "paid_by": expense.paid_by
                } for expense in production.expenses],
                "crew": [{
                    "id": member.id,
                    "production_id": member.production_id,
                    "user_id": member.user_id,
                    "role": member.role,
                    "fee": member.fee,
                    "full_name": member.user.full_name if member.user else None
                } for member in production.crew]
            } for production in productions],
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
                Production.organization_id == current_profile.organization_id,
                ProductionCrew.user_id == current_profile.id
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
                Production.organization_id == current_profile.organization_id,
                ProductionCrew.user_id == current_profile.id
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
            production.crew = [member for member in production.crew if member.user_id == current_profile.id]

        # Log query performance metrics (production-ready logging)
        logger.info(f"CREW: Retrieved {len(productions)} productions with eager loading (skip={skip}, limit={limit})")

        # Totals are calculated during write operations, no need to recalculate on read

        # Privacy filter: Crew members should only see their own crew information
        for production in productions:
            production.crew = [member for member in production.crew if member.user_id == current_profile.id]

        return {
            "items": [{
                "id": production.id,
                "title": production.title,
                "organization_id": production.organization_id,
                "client_id": production.client_id,
                "client": {
                    "id": production.client.id,
                    "full_name": production.client.full_name,
                    "email": production.client.email,
                    "cnpj": production.client.cnpj,
                    "phone": production.client.phone,
                    "created_at": production.client.created_at
                } if production.client else None,
                "status": production.status,
                "deadline": production.deadline,
                "shooting_sessions": production.shooting_sessions,
                "notes": production.notes,
                "created_at": production.created_at,
                "updated_at": production.updated_at,
                # Payment fields
                "payment_method": production.payment_method,
                "payment_status": production.payment_status,
                "due_date": production.due_date,
                # Financial fields (crew pode ver)
                "subtotal": production.subtotal,
                "discount": production.discount,
                "tax_rate": production.tax_rate,
                "tax_amount": production.tax_amount,
                "total_value": production.total_value,
                "total_cost": production.total_cost,
                "profit": production.profit,
                # Related data - CRÍTICO para o frontend
                "items": [{
                    "id": item.id,
                    "production_id": item.production_id,
                    "name": item.name,
                    "quantity": item.quantity,
                    "unit_price": item.unit_price,
                    "total_price": item.total_price
                } for item in production.items],
                "expenses": [{
                    "id": expense.id,
                    "production_id": expense.production_id,
                    "name": expense.name,
                    "value": expense.value,
                    "category": expense.category,
                    "paid_by": expense.paid_by
                } for expense in production.expenses],
                "crew": [{
                    "id": member.id,
                    "production_id": member.production_id,
                    "user_id": member.user_id,
                    "role": member.role,
                    "fee": member.fee,
                    "full_name": member.user.full_name if member.user else None
                } for member in production.crew]
            } for production in productions],
            "total": total_count,
            "skip": skip,
            "limit": limit,
            "has_more": (skip + limit) < total_count
        }


@router.get("/{production_id}")
async def get_production(
    production_id: int,
    current_profile: Profile = Depends(get_current_supabase_user),
    db: AsyncSession = Depends(get_db),
    org: dict = Depends(check_supabase_subscription)
):
    """Get a specific production by ID based on user role permissions."""

    if current_profile.role == "admin":
        # Admin can access any production in their organization
        result = await db.execute(
            select(Production).where(
                Production.id == production_id,
                Production.organization_id == current_profile.organization_id
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

            return {
                "id": production.id,
                "title": production.title,
                "organization_id": production.organization_id,
                "client_id": production.client_id,
                "client": {
                    "id": production.client.id,
                    "full_name": production.client.full_name,
                    "email": production.client.email,
                    "cnpj": production.client.cnpj,
                    "phone": production.client.phone,
                    "created_at": production.client.created_at
                } if production.client else None,
                "status": production.status,
                "deadline": production.deadline,
                "shooting_sessions": production.shooting_sessions,
                "notes": production.notes,
                "created_at": production.created_at,
                "updated_at": production.updated_at,
                # Payment fields
                "payment_method": production.payment_method,
                "payment_status": production.payment_status,
                "due_date": production.due_date,
                # Financial fields
                "subtotal": production.subtotal,
                "discount": production.discount,
                "tax_rate": production.tax_rate,
                "tax_amount": production.tax_amount,
                "total_value": production.total_value,
                "total_cost": production.total_cost,
                "profit": production.profit,
                # Related data - CRÍTICO para o frontend
                "items": [{
                    "id": item.id,
                    "production_id": item.production_id,
                    "name": item.name,
                    "quantity": item.quantity,
                    "unit_price": item.unit_price,
                    "total_price": item.total_price
                } for item in production.items],
                "expenses": [{
                    "id": expense.id,
                    "production_id": expense.production_id,
                    "name": expense.name,
                    "value": expense.value,
                    "category": expense.category,
                    "paid_by": expense.paid_by
                } for expense in production.expenses],
                "crew": [{
                    "id": member.id,
                    "production_id": member.production_id,
                    "user_id": member.user_id,
                    "role": member.role,
                    "fee": member.fee,
                    "full_name": member.user.full_name if member.user else None
                } for member in production.crew]
            }
    else:
        # Crew members can only access productions they're assigned to
        result = await db.execute(
            select(Production).join(
                ProductionCrew,
                Production.id == ProductionCrew.production_id
            ).where(
                Production.organization_id == current_profile.organization_id,
                ProductionCrew.user_id == current_profile.id,
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
            production.crew = [member for member in production.crew if member.user_id == current_profile.id]

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
    if current_profile.role != "admin":  # Not owner/admin - use restricted schema
        # Get only the crew member's own assignment
        crew_member = None
        for member in production.crew:
            if member.user_id == current_profile.id:
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
            restricted_crew = [{
                "full_name": user_full_name,
                "role": crew_member.role,
                "fee": crew_member.fee  # Show only their own fee
            }]

        # Convert items to crew response (without pricing)
        crew_items = [
            {
                "id": item.id,
                "production_id": item.production_id,
                "name": item.name,
                "quantity": item.quantity
                # unit_price and total_price omitted
            }
            for item in production.items
        ]

        return {
            "id": production.id,
            "title": production.title,
            "status": production.status,
            "deadline": production.deadline,
            "locations": production.locations,
            "filming_dates": production.filming_dates,
            "created_at": production.created_at,
            # Payment fields - crew can see status and due date
            "payment_status": production.payment_status,
            "due_date": production.due_date,
            # Financial fields explicitly omitted in ProductionCrewResponse
            "items": crew_items,  # Items without pricing
            # expenses field COMPLETELY REMOVED for crew
            "crew": restricted_crew  # Only their own assignment
        }
    else:
        # Owner/Admin - full access with all financial data
        return {
            "id": production.id,
            "title": production.title,
            "organization_id": production.organization_id,
            "client_id": production.client_id,
            "client": {
                "id": production.client.id,
                "full_name": production.client.full_name,
                "email": production.client.email,
                "cnpj": production.client.cnpj,
                "phone": production.client.phone,
                "created_at": production.client.created_at
            } if production.client else None,
            "status": production.status,
            "deadline": production.deadline,
            "shooting_sessions": production.shooting_sessions,
            "notes": production.notes,
            "created_at": production.created_at,
            "updated_at": production.updated_at,
            # Payment fields
            "payment_method": production.payment_method,
            "payment_status": production.payment_status,
            "due_date": production.due_date,
            # Financial fields
            "subtotal": production.subtotal,
            "discount": production.discount,
            "tax_rate": production.tax_rate,
            "tax_amount": production.tax_amount,
            "total_value": production.total_value,
            "total_cost": production.total_cost,
            "profit": production.profit,
            # Related data - CRÍTICO para o frontend
            "items": [{
                "id": item.id,
                "production_id": item.production_id,
                "name": item.name,
                "quantity": item.quantity,
                "unit_price": item.unit_price,
                "total_price": item.total_price
            } for item in production.items],
            "expenses": [{
                "id": expense.id,
                "production_id": expense.production_id,
                "name": expense.name,
                "value": expense.value,
                "category": expense.category,
                "paid_by": expense.paid_by
            } for expense in production.expenses],
            "crew": [{
                "id": member.id,
                "production_id": member.production_id,
                "user_id": member.user_id,
                "role": member.role,
                "fee": member.fee,
                "full_name": member.user.full_name if member.user else None
            } for member in production.crew]
        }
