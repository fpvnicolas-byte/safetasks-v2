"""update_production_crew_foreign_key_to_profiles

Revision ID: 3a3b0b8ac65a
Revises: 7977b32f1185
Create Date: 2026-01-08 21:49:11.559673

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = '3a3b0b8ac65a'
down_revision: Union[str, Sequence[str], None] = '7977b32f1185'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema: Recreate production_crew table with user_id as UUID referencing profiles.id"""
    # Since this is a fresh deployment and the user couldn't add crew members due to the bug,
    # it's safe to drop and recreate the table with the correct schema

    # Drop the existing table
    op.drop_table('production_crew')

    # Recreate the table with correct schema
    op.create_table('production_crew',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('production_id', sa.Integer(), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('role', sa.String(), nullable=False),
        sa.Column('fee', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['production_id'], ['productions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['profiles.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # Recreate the index
    op.create_index(op.f('ix_production_crew_id'), 'production_crew', ['id'], unique=False)


def downgrade() -> None:
    """Downgrade schema: Revert production_crew.user_id back to INTEGER, referencing users.id"""
    # Drop foreign key constraint to profiles
    op.drop_constraint('production_crew_user_id_fkey', 'production_crew', type_='foreignkey')

    # Change column type back from UUID to INTEGER
    op.alter_column('production_crew', 'user_id',
                    type_=sa.Integer(),
                    postgresql_using='user_id::integer')

    # Add back foreign key constraint to users.id
    op.create_foreign_key(
        'production_crew_user_id_fkey',
        'production_crew', 'users',
        ['user_id'], ['id'],
        ondelete='CASCADE'
    )
