"""merge_heads

Revision ID: bb4715090f61
Revises: 1d398a2c43bc, c4f8e9a1b2d3
Create Date: 2026-01-05 12:49:08.559924

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'bb4715090f61'
down_revision: Union[str, Sequence[str], None] = ('1d398a2c43bc', 'c4f8e9a1b2d3')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
