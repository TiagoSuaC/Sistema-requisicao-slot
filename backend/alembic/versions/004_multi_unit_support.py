"""add multi-unit support

Revision ID: 004
Revises: 003
Create Date: 2026-01-07

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '004'
down_revision = '003'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create macro_period_units table
    op.create_table(
        'macro_period_units',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('macro_period_id', sa.Integer(), nullable=False),
        sa.Column('unit_id', sa.Integer(), nullable=False),
        sa.Column('surgery_days', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('consult_days', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('order_position', sa.Integer(), nullable=True),
        sa.CheckConstraint('surgery_days >= 0', name='check_surgery_days_positive'),
        sa.CheckConstraint('consult_days >= 0', name='check_consult_days_positive'),
        sa.ForeignKeyConstraint(['macro_period_id'], ['macro_periods.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['unit_id'], ['units.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_macro_period_units_id'), 'macro_period_units', ['id'], unique=False)
    op.create_index(op.f('ix_macro_period_units_macro_period_id'), 'macro_period_units', ['macro_period_id'], unique=False)

    # Add new columns to macro_period_selections
    op.add_column('macro_period_selections', sa.Column('macro_period_unit_id', sa.Integer(), nullable=True))
    op.add_column('macro_period_selections', sa.Column('block_id', sa.String(), nullable=True))
    op.create_index(op.f('ix_macro_period_selections_macro_period_unit_id'), 'macro_period_selections', ['macro_period_unit_id'], unique=False)
    op.create_index(op.f('ix_macro_period_selections_block_id'), 'macro_period_selections', ['block_id'], unique=False)
    op.create_foreign_key('fk_selection_macro_period_unit', 'macro_period_selections', 'macro_period_units', ['macro_period_unit_id'], ['id'])

    # Migrate existing data
    # For each existing macro_period, create a corresponding macro_period_unit entry
    op.execute("""
        INSERT INTO macro_period_units (macro_period_id, unit_id, surgery_days, consult_days, order_position)
        SELECT
            id as macro_period_id,
            unit_id,
            COALESCE(suggested_surgery_min, 0) as surgery_days,
            COALESCE(suggested_consult_min, 0) as consult_days,
            0 as order_position
        FROM macro_periods
        WHERE unit_id IS NOT NULL
    """)

    # Update selections to point to the new macro_period_unit
    op.execute("""
        UPDATE macro_period_selections mps
        SET macro_period_unit_id = mpu.id
        FROM macro_period_units mpu
        WHERE mps.macro_period_id = mpu.macro_period_id
    """)

    # Remove old columns from macro_periods (after data migration)
    op.drop_constraint('macro_periods_unit_id_fkey', 'macro_periods', type_='foreignkey')
    op.drop_column('macro_periods', 'unit_id')
    op.drop_column('macro_periods', 'suggested_surgery_min')
    op.drop_column('macro_periods', 'suggested_surgery_max')
    op.drop_column('macro_periods', 'suggested_consult_min')
    op.drop_column('macro_periods', 'suggested_consult_max')


def downgrade() -> None:
    # Add back old columns to macro_periods
    op.add_column('macro_periods', sa.Column('suggested_consult_max', sa.Integer(), nullable=True))
    op.add_column('macro_periods', sa.Column('suggested_consult_min', sa.Integer(), nullable=True))
    op.add_column('macro_periods', sa.Column('suggested_surgery_max', sa.Integer(), nullable=True))
    op.add_column('macro_periods', sa.Column('suggested_surgery_min', sa.Integer(), nullable=True))
    op.add_column('macro_periods', sa.Column('unit_id', sa.Integer(), nullable=True))
    op.create_foreign_key('macro_periods_unit_id_fkey', 'macro_periods', 'units', ['unit_id'], ['id'])

    # Migrate data back (take first unit from macro_period_units)
    op.execute("""
        UPDATE macro_periods mp
        SET
            unit_id = mpu.unit_id,
            suggested_surgery_min = mpu.surgery_days,
            suggested_consult_min = mpu.consult_days
        FROM (
            SELECT DISTINCT ON (macro_period_id)
                macro_period_id, unit_id, surgery_days, consult_days
            FROM macro_period_units
            ORDER BY macro_period_id, order_position
        ) mpu
        WHERE mp.id = mpu.macro_period_id
    """)

    # Make unit_id NOT NULL again
    op.alter_column('macro_periods', 'unit_id', nullable=False)

    # Remove new columns from macro_period_selections
    op.drop_constraint('fk_selection_macro_period_unit', 'macro_period_selections', type_='foreignkey')
    op.drop_index(op.f('ix_macro_period_selections_block_id'), table_name='macro_period_selections')
    op.drop_index(op.f('ix_macro_period_selections_macro_period_unit_id'), table_name='macro_period_selections')
    op.drop_column('macro_period_selections', 'block_id')
    op.drop_column('macro_period_selections', 'macro_period_unit_id')

    # Drop macro_period_units table
    op.drop_index(op.f('ix_macro_period_units_macro_period_id'), table_name='macro_period_units')
    op.drop_index(op.f('ix_macro_period_units_id'), table_name='macro_period_units')
    op.drop_table('macro_period_units')
