from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.expense import Expense
from app.models.production import Production
from app.models.production_item import ProductionItem
from app.models.production_crew import ProductionCrew
from app.models.user import Organization


async def calculate_production_totals(production_id: int, db: AsyncSession) -> None:
    """Calculate and update production financial totals including costs and profit."""

    # Clear session to avoid conflicts with recently deleted objects
    db.expire_all()

    # Get all items for this production
    result = await db.execute(
        select(ProductionItem).where(ProductionItem.production_id == production_id)
    )
    items = result.scalars().all()

    # Calculate subtotal (sum of all item total_prices)
    subtotal = sum(item.total_price for item in items)

    # Get all expenses for this production
    result = await db.execute(
        select(Expense).where(Expense.production_id == production_id)
    )
    expenses = result.scalars().all()

    # Get all crew fees for this production
    result = await db.execute(
        select(ProductionCrew).where(ProductionCrew.production_id == production_id)
    )
    crew = result.scalars().all()

    # Calculate total cost (sum of all expense values + crew fees)
    total_cost = sum(expense.value for expense in expenses) + sum(member.fee for member in crew)

    # Get the production with organization and relationships loaded for calculation
    result = await db.execute(
        select(Production, Organization).join(Organization).where(Production.id == production_id).options(
            selectinload(Production.items),
            selectinload(Production.expenses)
        )
    )
    row = result.first()
    if row is None:
        raise ValueError(f"Production with ID {production_id} not found or has no associated organization")

    production, organization = row

    # If production tax_rate is not set (0, 0.0, or None), use organization's default_tax_rate
    if production.tax_rate is None or production.tax_rate == 0 or production.tax_rate == 0.0:
        production.tax_rate = organization.default_tax_rate or 0.0

    # Use the tax_rate that is now set on the production
    effective_tax_rate = production.tax_rate

    # Calculate tax amount
    tax_amount = int((subtotal - production.discount) * (effective_tax_rate / 100))

    # Calculate final total (revenue) - includes taxes as they're added to the client invoice
    total_value = subtotal - production.discount + tax_amount

    # Calculate profit - what remains after costs (taxes are collected but not profit)
    # Profit = (revenue - taxes) - costs
    profit = (total_value - tax_amount) - total_cost

    # Log calculation details for transparency
    print(f"🔄 Recalculating Production ID {production_id}:")
    print(f"   📊 Items: {len(items)} | Subtotal: R$ {(subtotal/100):.2f}")
    print(f"   💸 Expenses: {len(expenses)} | Total Cost: R$ {(total_cost/100):.2f}")
    print(f"   📈 Tax Rate: {effective_tax_rate}% | Tax Amount: R$ {(tax_amount/100):.2f}")
    print(f"   💰 Final Revenue: R$ {(total_value/100):.2f} | Profit: R$ {(profit/100):.2f}")

    # Update production with calculated values
    production.subtotal = subtotal
    production.total_cost = total_cost
    production.tax_amount = tax_amount
    production.total_value = total_value
    production.profit = profit

    db.add(production)
    await db.commit()
    await db.refresh(production)
