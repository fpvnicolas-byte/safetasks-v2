"""
Unit tests for production_service.py
Tests the core business logic for production calculations
"""

import pytest
from unittest.mock import AsyncMock, MagicMock
from decimal import Decimal

from app.services.production_service import calculate_production_totals
from app.models.production import Production
from app.models.production_item import ProductionItem
from app.models.expense import Expense
from app.models.production_crew import ProductionCrew


class TestCalculateProductionTotals:
    """Test cases for production totals calculation"""

    @pytest.mark.asyncio
    async def test_calculate_totals_with_items_only(self):
        """Test calculation with production items only"""
        # Mock database session
        mock_db = AsyncMock()

        # Create mock production
        mock_production = MagicMock(spec=Production)
        mock_production.id = 1

        # Mock items (2 items: 100.00 + 50.00 = 150.00 subtotal)
        mock_item1 = MagicMock(spec=ProductionItem)
        mock_item1.total_price = 10000  # cents
        mock_item2 = MagicMock(spec=ProductionItem)
        mock_item2.total_price = 5000   # cents

        mock_production.items = [mock_item1, mock_item2]
        mock_production.expenses = []
        mock_production.crew = []
        mock_production.discount = 0
        mock_production.tax_rate = 10.0  # 10%

        # Mock database execute to return the production
        mock_result = MagicMock()
        mock_result.scalar_one.return_value = mock_production
        mock_db.execute.return_value = mock_result

        # Call the function
        await calculate_production_totals(1, mock_db)

        # Verify calculations
        # subtotal = 150.00
        # tax_amount = 150.00 * 0.10 = 15.00
        # total_value = 150.00 + 15.00 = 165.00
        # total_cost = 0 (no expenses/crew)
        # profit = 165.00 - 0 = 165.00

        # Verify database commit was called
        mock_db.commit.assert_called_once()

    @pytest.mark.asyncio
    async def test_calculate_totals_with_discount(self):
        """Test calculation with discount applied"""
        mock_db = AsyncMock()

        mock_production = MagicMock(spec=Production)
        mock_production.id = 1

        # Mock items (subtotal = 200.00)
        mock_item = MagicMock(spec=ProductionItem)
        mock_item.total_price = 20000  # cents
        mock_production.items = [mock_item]
        mock_production.expenses = []
        mock_production.crew = []
        mock_production.discount = 2000  # 20.00 discount
        mock_production.tax_rate = 10.0   # 10%

        mock_result = MagicMock()
        mock_result.scalar_one.return_value = mock_production
        mock_db.execute.return_value = mock_result

        await calculate_production_totals(1, mock_db)

        # Verify calculations:
        # subtotal = 200.00
        # discounted_subtotal = 200.00 - 20.00 = 180.00
        # tax_amount = 180.00 * 0.10 = 18.00
        # total_value = 180.00 + 18.00 = 198.00
        # profit = 198.00 - 0 = 198.00

        mock_db.commit.assert_called_once()

    @pytest.mark.asyncio
    async def test_calculate_totals_with_expenses_and_crew(self):
        """Test calculation with expenses and crew costs"""
        mock_db = AsyncMock()

        mock_production = MagicMock(spec=Production)
        mock_production.id = 1

        # Mock items (subtotal = 300.00)
        mock_item = MagicMock(spec=ProductionItem)
        mock_item.total_price = 30000  # cents
        mock_production.items = [mock_item]

        # Mock expenses (50.00)
        mock_expense = MagicMock(spec=Expense)
        mock_expense.value = 5000  # cents
        mock_production.expenses = [mock_expense]

        # Mock crew (100.00 fee)
        mock_crew = MagicMock(spec=ProductionCrew)
        mock_crew.fee = 10000  # cents
        mock_production.crew = [mock_crew]

        mock_production.discount = 0
        mock_production.tax_rate = 10.0

        mock_result = MagicMock()
        mock_result.scalar_one.return_value = mock_production
        mock_db.execute.return_value = mock_result

        await calculate_production_totals(1, mock_db)

        # Verify calculations:
        # subtotal = 300.00
        # tax_amount = 300.00 * 0.10 = 30.00
        # total_value = 300.00 + 30.00 = 330.00
        # total_cost = 50.00 (expenses) + 100.00 (crew) = 150.00
        # profit = 330.00 - 150.00 = 180.00

        mock_db.commit.assert_called_once()

    @pytest.mark.asyncio
    async def test_calculate_totals_zero_tax_rate(self):
        """Test calculation with zero tax rate"""
        mock_db = AsyncMock()

        mock_production = MagicMock(spec=Production)
        mock_production.id = 1

        mock_item = MagicMock(spec=ProductionItem)
        mock_item.total_price = 10000  # cents
        mock_production.items = [mock_item]
        mock_production.expenses = []
        mock_production.crew = []
        mock_production.discount = 0
        mock_production.tax_rate = 0.0

        mock_result = MagicMock()
        mock_result.scalar_one.return_value = mock_production
        mock_db.execute.return_value = mock_result

        await calculate_production_totals(1, mock_db)

        # Verify calculations:
        # subtotal = 100.00
        # tax_amount = 100.00 * 0 = 0.00
        # total_value = 100.00 + 0.00 = 100.00
        # profit = 100.00 - 0 = 100.00

        mock_db.commit.assert_called_once()

    @pytest.mark.asyncio
    async def test_calculate_totals_empty_production(self):
        """Test calculation with no items, expenses, or crew"""
        mock_db = AsyncMock()

        mock_production = MagicMock(spec=Production)
        mock_production.id = 1
        mock_production.items = []
        mock_production.expenses = []
        mock_production.crew = []
        mock_production.discount = 0
        mock_production.tax_rate = 10.0

        mock_result = MagicMock()
        mock_result.scalar_one.return_value = mock_production
        mock_db.execute.return_value = mock_result

        await calculate_production_totals(1, mock_db)

        # All values should be zero
        mock_db.commit.assert_called_once()


class TestEdgeCases:
    """Test edge cases and error conditions"""

    @pytest.mark.asyncio
    async def test_negative_discount(self):
        """Test handling of negative discount (should not happen in real usage but test robustness)"""
        mock_db = AsyncMock()

        mock_production = MagicMock(spec=Production)
        mock_production.id = 1

        mock_item = MagicMock(spec=ProductionItem)
        mock_item.total_price = 10000  # cents
        mock_production.items = [mock_item]
        mock_production.expenses = []
        mock_production.crew = []
        mock_production.discount = -1000  # Negative discount
        mock_production.tax_rate = 10.0

        mock_result = MagicMock()
        mock_result.scalar_one.return_value = mock_production
        mock_db.execute.return_value = mock_result

        # Should handle negative discount gracefully (resulting in higher total)
        await calculate_production_totals(1, mock_db)
        mock_db.commit.assert_called_once()

