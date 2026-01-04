from datetime import datetime, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.db.session import get_db
from app.core.cache import cache, CacheKeys
from app.models.production import Production
from app.models.production_crew import ProductionCrew
from app.models.user import User
from app.models.client import Client


router = APIRouter()


@router.get("/summary")
async def get_dashboard_summary(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get dashboard summary based on user role with Redis caching."""

    if current_user.role == "admin":
        # Try cache first
        cache_key = CacheKeys.dashboard_summary(current_user.organization_id)
        cached_result = await cache.get(cache_key)
        if cached_result:
            return cached_result
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

        # Get monthly revenue data (last 12 months)
        # Calculate date 12 months ago to avoid SQL interval syntax issues
        twelve_months_ago = datetime.now() - timedelta(days=365)

        monthly_result = await db.execute(
            select(
                func.to_char(Production.created_at, 'Mon').label('month'),
                func.to_char(Production.created_at, 'YYYY').label('year'),
                func.sum(Production.total_value / 100).label('revenue')  # Convert cents to reais
            )
            .where(Production.organization_id == current_user.organization_id)
            .where(Production.created_at >= twelve_months_ago)
            .group_by(
                func.to_char(Production.created_at, 'YYYY'),  # Group by year first
                func.to_char(Production.created_at, 'Mon'),   # Then by month
                Production.created_at  # Required for ORDER BY date_part
            )
            .order_by(
                func.to_char(Production.created_at, 'YYYY'),  # Order by year first
                func.date_part('month', Production.created_at)  # Then by month number
            )
        )

        monthly_data = []
        for row in monthly_result:
            monthly_data.append({
                "month": row.month,
                "revenue": row.revenue or 0
            })

        # Get productions by status
        status_result = await db.execute(
            select(
                Production.status,
                func.count(Production.id).label('count'),
                func.sum(Production.total_value).label('total_value')
            )
            .where(Production.organization_id == current_user.organization_id)
            .group_by(Production.status)
        )

        status_data = []
        for row in status_result:
            status_data.append({
                "status": row.status,
                "count": row.count or 0,
                "percentage": 0,  # Will be calculated in frontend
                "total_value": row.total_value or 0
            })

        # Calculate percentages for status data
        total_productions = sum(item['count'] for item in status_data)
        if total_productions > 0:
            for item in status_data:
                item['percentage'] = round((item['count'] / total_productions) * 100, 1)

        # Get top 5 clients by total value
        clients_result = await db.execute(
            select(
                Client.full_name.label('client_name'),
                func.sum(Production.total_value).label('total_value'),
                func.count(Production.id).label('productions_count')
            )
            .select_from(Production)
            .join(Client, Production.client_id == Client.id)
            .where(Production.organization_id == current_user.organization_id)
            .group_by(Client.full_name)
            .order_by(func.sum(Production.total_value).desc())
            .limit(5)
        )

        clients_data = []
        for row in clients_result:
            clients_data.append({
                "name": row.client_name,
                "total_value": row.total_value or 0,
                "productions_count": row.productions_count or 0
            })

        # Add chart data to summary
        summary.update({
            "monthly_revenue": monthly_data,
            "productions_by_status": status_data,
            "top_clients": clients_data
        })

        # Cache the result
        await cache.set(cache_key, summary, ttl_seconds=300)  # 5 minutes cache

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
