"""add_notes_field_to_productions_table

Revision ID: 53b3d912e160
Revises: bbb2c5e6792e
Create Date: 2026-01-02 17:18:32.058259

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '53b3d912e160'
down_revision: Union[str, Sequence[str], None] = 'bbb2c5e6792e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add notes field to productions table
    op.add_column('productions', sa.Column('notes', sa.Text(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    # Remove notes field from productions table
    op.drop_column('productions', 'notes')
