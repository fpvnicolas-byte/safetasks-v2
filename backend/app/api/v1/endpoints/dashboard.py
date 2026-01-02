from fastapi import APIRouter, Depends
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.production import Production
from app.models.production_crew import ProductionCrew
from app.models.user import User


router = APIRouter()


@router.get("/summary")
async def get_dashboard_summary(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get dashboard summary based on user role."""

    if current_user.role == "admin":
        # Admin/Owner: Full organization financial summary
        result = await db.execute(
            select(
                func.sum(Production.total_value).label('total_revenue'),
                func.sum(Production.total_cost).label('total_costs'),
                func.sum(Production.tax_amount).label('total_taxes'),
                func.sum(Production.profit).label('total_profit'),
                func.count(Production.id).label('total_productions')
            ).where(Production.organization_id == current_user.organization_id)
        )

        row = result.first()

        # Handle None values (when no productions exist)
        summary = {
            "total_revenue": row.total_revenue or 0,
            "total_costs": row.total_costs or 0,
            "total_taxes": row.total_taxes or 0,
            "total_profit": row.total_profit or 0,
            "total_productions": row.total_productions or 0
        }

    else:
        # Crew: Personal operational dashboard
        from app.models.production_crew import ProductionCrew

        # Calculate total earnings (fees) for this crew member
        earnings_result = await db.execute(
            select(func.sum(ProductionCrew.fee).label('total_earnings'))
            .where(
                ProductionCrew.user_id == current_user.id,
                ProductionCrew.production_id == Production.id,
                Production.organization_id == current_user.organization_id
            )
        )

        # Count productions this crew member is assigned to
        productions_result = await db.execute(
            select(func.count(ProductionCrew.production_id.distinct()).label('production_count'))
            .where(
                ProductionCrew.user_id == current_user.id,
                ProductionCrew.production_id == Production.id,
                Production.organization_id == current_user.organization_id
            )
        )

        earnings_row = earnings_result.first()
        productions_row = productions_result.first()

        summary = {
            "total_earnings": earnings_row.total_earnings or 0,  # Personal earnings in cents
            "production_count": productions_row.production_count or 0,  # Number of productions assigned
            # Organization financials hidden for crew (set to None/null)
            "total_revenue": None,
            "total_costs": None,
            "total_taxes": None,
            "total_profit": None,
            "total_productions": None
        }

    return summary
