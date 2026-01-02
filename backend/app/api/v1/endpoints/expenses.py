from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_active_admin, get_current_user
from app.db.session import get_db
from app.models.expense import Expense
from app.models.production import Production
from app.models.user import User
from app.schemas.expense import ExpenseCreate, ExpenseResponse
from app.services.production_service import calculate_production_totals

router = APIRouter()


@router.post("/productions/{production_id}/expenses", response_model=ExpenseResponse)
async def create_expense(
    production_id: int,
    expense_data: ExpenseCreate,
    current_user: User = Depends(get_current_active_admin),
    db: AsyncSession = Depends(get_db)
) -> ExpenseResponse:
    """Create a new expense for a production."""

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

    # Create expense
    expense = Expense(
        production_id=production_id,
        name=expense_data.name,
        value=expense_data.value,
        category=expense_data.category,
        paid_by=expense_data.paid_by
    )

    db.add(expense)
    await db.commit()
    await db.refresh(expense)

    # Recalculate production totals (including profit)
    await calculate_production_totals(production_id, db)

    return ExpenseResponse.from_orm(expense)


@router.delete("/productions/{production_id}/expenses/{expense_id}")
async def delete_expense(
    production_id: int,
    expense_id: int,
    current_user: User = Depends(get_current_active_admin),
    db: AsyncSession = Depends(get_db)
):
    """Delete an expense."""

    # Verify expense exists and belongs to user's organization
    result = await db.execute(
        select(Expense).join(Production).where(
            Expense.id == expense_id,
            Expense.production_id == production_id,
            Production.organization_id == current_user.organization_id
        )
    )
    expense = result.scalar_one_or_none()

    if expense is None:
        raise HTTPException(status_code=404, detail="Expense not found")

    # Delete expense
    await db.delete(expense)
    await db.commit()

    # Recalculate production totals (including profit)
    await calculate_production_totals(production_id, db)

    return {"message": "Expense deleted successfully"}
