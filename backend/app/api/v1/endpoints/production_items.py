from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_active_admin, get_current_user
from app.db.session import get_db
from app.models.production import Production
from app.models.production_item import ProductionItem
from app.models.service import Service
from app.models.user import User
from app.schemas.production_item import ProductionItemCreate, ProductionItemResponse
from app.services.production_service import calculate_production_totals

router = APIRouter()


@router.post("/productions/{production_id}/items", response_model=ProductionItemResponse)
async def create_production_item(
    production_id: int,
    item_data: ProductionItemCreate,
    current_user: User = Depends(get_current_active_admin),
    db: AsyncSession = Depends(get_db)
) -> ProductionItemResponse:
    """
    Create a new item for a production.

    ProductionItems are instances of Services within a specific project.
    You can either:
    1. Link to an existing Service (service_id) - uses service name and default price
    2. Create a custom item (name + unit_price) - manual entry
    """

    # Verify production exists and belongs to user's organization
    result = await db.execute(
        select(Production).where(
            Production.id == production_id,
            Production.organization_id == current_user.organization_id
        )
    )
    production = result.scalar_one_or_none()

    if production is None:
        raise HTTPException(status_code=404, detail="Production not found")

    # Initialize variables
    item_name = None
    item_unit_price = None

    # Option 1: Link to existing service
    if item_data.service_id is not None:
        # Get service details
        service_result = await db.execute(
            select(Service).where(
                Service.id == item_data.service_id,
                Service.organization_id == current_user.organization_id
            )
        )
        service = service_result.scalar_one_or_none()

        if service is None:
            raise HTTPException(status_code=404, detail="Service not found")

        # Use service data as defaults, but allow explicit overrides
        # Ignore Swagger defaults: "string", 0, None
        item_name = service.name
        if item_data.name and item_data.name.strip() and item_data.name.lower() != "string":
            item_name = item_data.name

        item_unit_price = service.default_price
        if item_data.unit_price is not None and item_data.unit_price > 0:
            item_unit_price = item_data.unit_price

    # Option 2: Manual entry (validation already done by model_validator)
    else:
        item_name = item_data.name
        item_unit_price = item_data.unit_price

    # Calculate total price
    total_price = int(item_data.quantity * item_unit_price)

    # Create item
    item = ProductionItem(
        production_id=production_id,
        service_id=item_data.service_id if item_data.service_id else None,  # Historical reference
        name=item_name,
        quantity=item_data.quantity,
        unit_price=item_unit_price,
        total_price=total_price
    )

    db.add(item)
    await db.commit()
    await db.refresh(item)

    # Recalculate production totals
    await calculate_production_totals(production_id, db)
    await db.commit()  # Commit the calculated totals

    return ProductionItemResponse.from_orm(item)


@router.delete("/productions/{production_id}/items/{item_id}")
async def delete_production_item(
    production_id: int,
    item_id: int,
    current_user: User = Depends(get_current_active_admin),
    db: AsyncSession = Depends(get_db)
):
    """Delete a production item."""

    # Verify item exists and belongs to user's organization
    result = await db.execute(
        select(ProductionItem).join(Production).where(
            ProductionItem.id == item_id,
            ProductionItem.production_id == production_id,
            Production.organization_id == current_user.organization_id
        )
    )
    item = result.scalar_one_or_none()

    if item is None:
        raise HTTPException(status_code=404, detail="Production item not found")

    # Delete item
    await db.delete(item)
    await db.commit()

    # Recalculate production totals
    await calculate_production_totals(production_id, db)
    await db.commit()  # Commit the calculated totals

    return {"message": "Item deleted successfully"}
