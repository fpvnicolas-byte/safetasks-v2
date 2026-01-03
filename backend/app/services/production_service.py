import logging
from sqlalchemy import select  # type: ignore
from sqlalchemy.ext.asyncio import AsyncSession  # type: ignore
from sqlalchemy.orm import selectinload  # type: ignore

from app.models.expense import Expense
from app.models.production import Production
from app.models.production_item import ProductionItem
from app.models.production_crew import ProductionCrew
from app.models.user import Organization

# Configure logger for this module
logger = logging.getLogger(__name__)


class FinancialCalculationError(Exception):
    """Custom exception for financial calculation errors."""
    pass


async def calculate_production_totals(production_id: int, db: AsyncSession) -> None:
    """
    Calculate and update production financial totals including costs and profit.
    
    This function ensures atomicity by working within the existing transaction context.
    All financial calculations are validated to prevent negative values and invalid states.
    
    Args:
        production_id: ID of the production to calculate totals for
        db: Async database session (should be within a transaction context)
        
    Raises:
        FinancialCalculationError: If financial calculations result in invalid values
        ValueError: If production is not found or has invalid state
    """
    
    # Work within existing transaction to ensure atomicity and prevent race conditions
    # Note: Not expiring session to avoid conflicts with eagerly loaded objects

    logger.info(f"Starting calculation for production {production_id}")

    # Get all items for this production
    result = await db.execute(
        select(ProductionItem).where(ProductionItem.production_id == production_id)
    )
    items = result.scalars().all()

    # Calculate subtotal (sum of all item total_prices)
    # Validate that all items have non-negative prices
    for item in items:
        if item.total_price < 0:
            raise FinancialCalculationError(
                f"Production item {item.id} has negative total_price: {item.total_price}"
            )
    
    subtotal = sum(item.total_price for item in items)
    logger.info(f"Production {production_id}: Found {len(items)} items, subtotal = R$ {(subtotal/100):.2f}")

    # Validate subtotal is non-negative
    if subtotal < 0:
        raise FinancialCalculationError(
            f"Calculated subtotal is negative: {subtotal} for production {production_id}"
        )

    # Get all expenses for this production
    result = await db.execute(
        select(Expense).where(Expense.production_id == production_id)
    )
    expenses = result.scalars().all()
    
    # Validate expenses have non-negative values
    for expense in expenses:
        if expense.value < 0:
            raise FinancialCalculationError(
                f"Expense {expense.id} has negative value: {expense.value}"
            )

    # Get all crew fees for this production
    result = await db.execute(
        select(ProductionCrew).where(ProductionCrew.production_id == production_id)
    )
    crew = result.scalars().all()
    
    # Validate crew fees are non-negative
    for member in crew:
        if member.fee is not None and member.fee < 0:
            raise FinancialCalculationError(
                f"Crew member {member.user_id} has negative fee: {member.fee}"
            )

    # Calculate total cost (sum of all expense values + crew fees)
    # Handle None fees as 0
    expenses_total = sum(expense.value for expense in expenses)
    crew_total = sum(member.fee or 0 for member in crew)
    total_cost = expenses_total + crew_total
    logger.info(f"Production {production_id}: Found {len(expenses)} expenses (R$ {(expenses_total/100):.2f}), {len(crew)} crew members (R$ {(crew_total/100):.2f}), total_cost = R$ {(total_cost/100):.2f}")

    # Validate total_cost is non-negative
    if total_cost < 0:
        raise FinancialCalculationError(
            f"Calculated total_cost is negative: {total_cost} for production {production_id}"
        )

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

    # Only use organization's default_tax_rate if production tax_rate is None (not set)
    # Allow explicit 0.0 values set by user
    if production.tax_rate is None:
        production.tax_rate = organization.default_tax_rate or 0.0

    # Use the tax_rate that is now set on the production
    effective_tax_rate = production.tax_rate
    
    # Validate tax_rate is within valid range (0-100)
    if effective_tax_rate < 0 or effective_tax_rate > 100:
        raise FinancialCalculationError(
            f"Tax rate {effective_tax_rate}% is outside valid range (0-100) for production {production_id}"
        )

    # Validate discount is non-negative and not greater than subtotal
    if production.discount < 0:
        raise FinancialCalculationError(
            f"Discount cannot be negative: {production.discount} for production {production_id}"
        )
    
    if production.discount > subtotal:
        logger.warning(
            f"Discount ({production.discount}) exceeds subtotal ({subtotal}) for production {production_id}. "
            f"Setting discount to subtotal to prevent negative values."
        )
        production.discount = subtotal

    # Calculate taxable base (subtotal - discount)
    taxable_base = subtotal - production.discount
    
    # Validate taxable_base is non-negative (already ensured by discount validation above)
    if taxable_base < 0:
        taxable_base = 0
        logger.warning(
            f"Taxable base was negative for production {production_id}, setting to 0"
        )

    # Calculate tax amount
    # Division by 100 is safe as we're dividing by a constant, not a variable
    tax_amount = int(taxable_base * (effective_tax_rate / 100))
    
    # Validate tax_amount is non-negative
    if tax_amount < 0:
        raise FinancialCalculationError(
            f"Calculated tax_amount is negative: {tax_amount} for production {production_id}"
        )

    # Calculate final total (revenue) - includes taxes as they're added to the client invoice
    total_value = subtotal - production.discount + tax_amount
    
    # Validate total_value is non-negative
    if total_value < 0:
        raise FinancialCalculationError(
            f"Calculated total_value is negative: {total_value} for production {production_id}"
        )

    # Calculate profit - what remains after costs (taxes are collected but not profit)
    # Profit = (revenue - taxes) - costs
    profit = (total_value - tax_amount) - total_cost
    logger.info(f"Production {production_id}: tax_rate={effective_tax_rate}%, tax_amount=R$ {(tax_amount/100):.2f}, total_value=R$ {(total_value/100):.2f}, profit=R$ {(profit/100):.2f}")

    # Log calculation details for transparency (structured logging)
    logger.info(
        "Recalculating production totals",
        extra={
            "production_id": production_id,
            "items_count": len(items),
            "subtotal": subtotal,
            "expenses_count": len(expenses),
            "crew_count": len(crew),
            "total_cost": total_cost,
            "tax_rate": effective_tax_rate,
            "tax_amount": tax_amount,
            "discount": production.discount,
            "total_value": total_value,
            "profit": profit,
        }
    )

    # Update production with calculated values
    production.subtotal = subtotal
    production.total_cost = total_cost
    production.tax_amount = tax_amount
    production.total_value = total_value
    production.profit = profit

    db.add(production)
    # Flush to ensure changes are in the current transaction
    # The calling function should handle commit
    await db.flush()
