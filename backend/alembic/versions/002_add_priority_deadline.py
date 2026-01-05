"""add priority and deadline fields

Revision ID: 002
Revises: 001
Create Date: 2026-01-05

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '002'
down_revision = '001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create ENUM type first
    priority_enum = sa.Enum('BAIXA', 'NORMAL', 'ALTA', 'URGENTE', name='priority')
    priority_enum.create(op.get_bind(), checkfirst=True)

    # Add priority column with default NORMAL
    op.add_column('macro_periods', sa.Column('priority', priority_enum, nullable=False, server_default='NORMAL'))

    # Add deadline column (nullable)
    op.add_column('macro_periods', sa.Column('deadline', sa.Date(), nullable=True))

    # Create index on priority for faster filtering
    op.create_index('ix_macro_periods_priority', 'macro_periods', ['priority'])


def downgrade() -> None:
    op.drop_index('ix_macro_periods_priority', table_name='macro_periods')
    op.drop_column('macro_periods', 'deadline')
    op.drop_column('macro_periods', 'priority')
    op.execute('DROP TYPE priority')
