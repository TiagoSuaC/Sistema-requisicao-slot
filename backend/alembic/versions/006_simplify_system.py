"""simplify system - remove surgery/consult distinction

Revision ID: 006
Revises: 005
Create Date: 2026-01-07

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '006'
down_revision = '005'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add total_days column to macro_period_units
    op.add_column('macro_period_units',
                  sa.Column('total_days', sa.Integer(), nullable=True))

    # Migrate existing data: total_days = surgery_days + consult_days
    op.execute("""
        UPDATE macro_period_units
        SET total_days = COALESCE(surgery_days, 0) + COALESCE(consult_days, 0)
    """)

    # Make total_days NOT NULL after migration
    op.alter_column('macro_period_units', 'total_days', nullable=False)

    # Remove old columns from macro_period_units
    op.drop_column('macro_period_units', 'surgery_days')
    op.drop_column('macro_period_units', 'consult_days')
    op.drop_column('macro_period_units', 'order')

    # Remove type column from macro_period_selections
    op.drop_column('macro_period_selections', 'type')

    # Drop the old enums
    op.execute("DROP TYPE IF EXISTS unitorder")
    op.execute("DROP TYPE IF EXISTS selectiontype")


def downgrade() -> None:
    # Recreate enums
    op.execute("CREATE TYPE unitorder AS ENUM ('SURGERY_FIRST', 'CONSULT_FIRST')")
    op.execute("CREATE TYPE selectiontype AS ENUM ('SURGERY', 'CONSULT')")

    # Add type back to selections (default to SURGERY for rollback)
    op.add_column('macro_period_selections',
                  sa.Column('type', sa.Enum('SURGERY', 'CONSULT', name='selectiontype'),
                           nullable=False, server_default='SURGERY'))

    # Add old columns back to macro_period_units
    op.add_column('macro_period_units',
                  sa.Column('surgery_days', sa.Integer(), nullable=True, server_default='0'))
    op.add_column('macro_period_units',
                  sa.Column('consult_days', sa.Integer(), nullable=True, server_default='0'))
    op.add_column('macro_period_units',
                  sa.Column('order', sa.Enum('SURGERY_FIRST', 'CONSULT_FIRST', name='unitorder'),
                           nullable=False, server_default='SURGERY_FIRST'))

    # Migrate data back: split total_days equally
    op.execute("""
        UPDATE macro_period_units
        SET surgery_days = total_days / 2,
            consult_days = total_days - (total_days / 2)
    """)

    # Remove total_days
    op.drop_column('macro_period_units', 'total_days')
