"""add performance indexes for productions

Revision ID: c4f8e9a1b2d3
Revises: bbb2c5e6792e
Create Date: 2025-01-01 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c4f8e9a1b2d3'
down_revision: Union[str, Sequence[str], None] = 'bbb2c5e6792e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add performance indexes for productions table and related tables."""
    
    # Index for filtering productions by organization and status (most common query pattern)
    op.create_index(
        'idx_productions_org_status',
        'productions',
        ['organization_id', 'status'],
        unique=False
    )
    
    # Index for filtering by deadline (used in calendar and deadline queries)
    op.create_index(
        'idx_productions_deadline',
        'productions',
        ['deadline'],
        unique=False,
        postgresql_where=sa.text('deadline IS NOT NULL')  # Partial index for non-null deadlines
    )
    
    # Index for ordering by creation date (most recent first)
    op.create_index(
        'idx_productions_created_at',
        'productions',
        ['created_at'],
        unique=False,
        postgresql_ops={'created_at': 'DESC'}  # Optimize for DESC ordering
    )
    
    # Index for production items (foreign key lookups)
    op.create_index(
        'idx_production_items_production',
        'production_items',
        ['production_id'],
        unique=False
    )
    
    # Index for production crew (foreign key lookups and user filtering)
    op.create_index(
        'idx_production_crew_production',
        'production_crew',
        ['production_id'],
        unique=False
    )
    
    op.create_index(
        'idx_production_crew_user',
        'production_crew',
        ['user_id'],
        unique=False
    )
    
    # Composite index for crew queries (production + user)
    op.create_index(
        'idx_production_crew_prod_user',
        'production_crew',
        ['production_id', 'user_id'],
        unique=False
    )
    
    # Index for expenses (foreign key lookups)
    op.create_index(
        'idx_expenses_production',
        'expenses',
        ['production_id'],
        unique=False
    )


def downgrade() -> None:
    """Remove performance indexes."""
    
    op.drop_index('idx_expenses_production', table_name='expenses')
    op.drop_index('idx_production_crew_prod_user', table_name='production_crew')
    op.drop_index('idx_production_crew_user', table_name='production_crew')
    op.drop_index('idx_production_crew_production', table_name='production_crew')
    op.drop_index('idx_production_items_production', table_name='production_items')
    op.drop_index('idx_productions_created_at', table_name='productions')
    op.drop_index('idx_productions_deadline', table_name='productions')
    op.drop_index('idx_productions_org_status', table_name='productions')

