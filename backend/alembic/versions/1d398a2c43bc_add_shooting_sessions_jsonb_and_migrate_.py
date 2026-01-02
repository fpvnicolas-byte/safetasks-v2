"""add_shooting_sessions_jsonb_and_migrate_data

Revision ID: 1d398a2c43bc
Revises: 53b3d912e160
Create Date: 2026-01-02 17:35:26.753322

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1d398a2c43bc'
down_revision: Union[str, Sequence[str], None] = '53b3d912e160'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add shooting_sessions JSONB column
    op.add_column('productions', sa.Column('shooting_sessions', sa.JSON(), nullable=True))

    # Create connection to perform data migration
    bind = op.get_bind()
    session = sa.orm.Session(bind=bind)

    # Get all productions to migrate data
    productions_table = sa.Table('productions',
        sa.MetaData(),
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('filming_dates', sa.String),
        sa.Column('locations', sa.String),
        sa.Column('shooting_sessions', sa.JSON)
    )

    # Migrate existing data
    productions = session.execute(sa.select(productions_table.c.id, productions_table.c.filming_dates, productions_table.c.locations)).fetchall()

    for prod in productions:
        shooting_sessions = []

        # Parse filming dates and locations
        filming_dates = prod.filming_dates.split(',') if prod.filming_dates else []
        locations = prod.locations.split(',') if prod.locations else []

        # Create shooting sessions by pairing dates with locations
        max_length = max(len(filming_dates), len(locations)) if filming_dates or locations else 0

        for i in range(max_length):
            session_date = filming_dates[i].strip() if i < len(filming_dates) else None
            session_location = locations[i].strip() if i < len(locations) else None

            if session_date or session_location:
                shooting_sessions.append({
                    'date': session_date,
                    'location': session_location
                })

        # Update the production with shooting_sessions if we have data
        if shooting_sessions:
            session.execute(
                sa.update(productions_table)
                .where(productions_table.c.id == prod.id)
                .values(shooting_sessions=shooting_sessions)
            )

    session.commit()

    # Remove old columns after successful migration
    op.drop_column('productions', 'filming_dates')
    op.drop_column('productions', 'locations')


def downgrade() -> None:
    """Downgrade schema."""
    # Recreate old columns
    op.add_column('productions', sa.Column('filming_dates', sa.String(), nullable=True))
    op.add_column('productions', sa.Column('locations', sa.String(), nullable=True))

    # Create connection to restore data
    bind = op.get_bind()
    session = sa.orm.Session(bind=bind)

    productions_table = sa.Table('productions',
        sa.MetaData(),
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('filming_dates', sa.String),
        sa.Column('locations', sa.String),
        sa.Column('shooting_sessions', sa.JSON)
    )

    # Restore data from shooting_sessions
    productions = session.execute(sa.select(productions_table.c.id, productions_table.c.shooting_sessions)).fetchall()

    for prod in productions:
        filming_dates = []
        locations = []

        if prod.shooting_sessions:
            for session in prod.shooting_sessions:
                if session.get('date'):
                    filming_dates.append(session['date'])
                if session.get('location'):
                    locations.append(session['location'])

        # Update old columns
        session.execute(
            sa.update(productions_table)
            .where(productions_table.c.id == prod.id)
            .values(
                filming_dates=', '.join(filming_dates) if filming_dates else None,
                locations=', '.join(locations) if locations else None
            )
        )

    session.commit()

    # Remove shooting_sessions column
    op.drop_column('productions', 'shooting_sessions')
