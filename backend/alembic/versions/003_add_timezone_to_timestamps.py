"""add timezone to timestamps

Revision ID: 003
Revises: 002
Create Date: 2026-01-05

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '003'
down_revision = '002'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Convert timestamp columns to timestamptz (timestamp with time zone)
    # PostgreSQL will automatically convert existing data from local time to UTC

    # For macro_periods table
    op.execute('ALTER TABLE macro_periods ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE')
    op.execute('ALTER TABLE macro_periods ALTER COLUMN responded_at TYPE TIMESTAMP WITH TIME ZONE')

    # For audit_events table
    op.execute('ALTER TABLE audit_events ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE')


def downgrade() -> None:
    # Convert back to timestamp without time zone
    op.execute('ALTER TABLE macro_periods ALTER COLUMN created_at TYPE TIMESTAMP WITHOUT TIME ZONE')
    op.execute('ALTER TABLE macro_periods ALTER COLUMN responded_at TYPE TIMESTAMP WITHOUT TIME ZONE')
    op.execute('ALTER TABLE audit_events ALTER COLUMN created_at TYPE TIMESTAMP WITHOUT TIME ZONE')
