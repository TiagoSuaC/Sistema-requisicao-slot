"""add unit order field

Revision ID: 005
Revises: 004
Create Date: 2026-01-07

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '005'
down_revision = '004'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create ENUM type for unit order
    unit_order_enum = sa.Enum('SURGERY_FIRST', 'CONSULT_FIRST', name='unitorder')
    unit_order_enum.create(op.get_bind(), checkfirst=True)

    # Add order column to macro_period_units with default value
    op.add_column('macro_period_units',
                  sa.Column('order', unit_order_enum, nullable=False, server_default='SURGERY_FIRST'))


def downgrade() -> None:
    # Remove order column
    op.drop_column('macro_period_units', 'order')

    # Drop ENUM type
    unit_order_enum = sa.Enum('SURGERY_FIRST', 'CONSULT_FIRST', name='unitorder')
    unit_order_enum.drop(op.get_bind(), checkfirst=True)
