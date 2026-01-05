"""Initial schema

Revision ID: 001
Revises:
Create Date: 2025-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create units table
    op.create_table(
        'units',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('city', sa.String(), nullable=False),
        sa.Column('config_turnos', postgresql.JSON(astext_type=sa.Text()), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_units_id'), 'units', ['id'], unique=False)

    # Create doctors table
    op.create_table(
        'doctors',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('active', sa.Boolean(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email')
    )
    op.create_index(op.f('ix_doctors_id'), 'doctors', ['id'], unique=False)
    op.create_index(op.f('ix_doctors_name'), 'doctors', ['name'], unique=False)
    op.create_index(op.f('ix_doctors_email'), 'doctors', ['email'], unique=False)

    # Create macro_periods table
    op.create_table(
        'macro_periods',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('unit_id', sa.Integer(), nullable=False),
        sa.Column('doctor_id', sa.Integer(), nullable=False),
        sa.Column('start_date', sa.Date(), nullable=False),
        sa.Column('end_date', sa.Date(), nullable=False),
        sa.Column('suggested_surgery_min', sa.Integer(), nullable=True),
        sa.Column('suggested_surgery_max', sa.Integer(), nullable=True),
        sa.Column('suggested_consult_min', sa.Integer(), nullable=True),
        sa.Column('suggested_consult_max', sa.Integer(), nullable=True),
        sa.Column('status', sa.Enum('AGUARDANDO', 'RESPONDIDO', 'EDICAO_LIBERADA', 'CONFIRMADO', 'CANCELADO', 'EXPIRADO', name='macroperiodstatus'), nullable=False),
        sa.Column('public_token', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('created_by', sa.String(), nullable=False),
        sa.Column('responded_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['doctor_id'], ['doctors.id'], ),
        sa.ForeignKeyConstraint(['unit_id'], ['units.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('public_token')
    )
    op.create_index(op.f('ix_macro_periods_id'), 'macro_periods', ['id'], unique=False)
    op.create_index(op.f('ix_macro_periods_public_token'), 'macro_periods', ['public_token'], unique=False)
    op.create_index(op.f('ix_macro_periods_status'), 'macro_periods', ['status'], unique=False)

    # Create macro_period_selections table
    op.create_table(
        'macro_period_selections',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('macro_period_id', sa.Integer(), nullable=False),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('part_of_day', sa.Enum('MORNING', 'AFTERNOON', 'FULL_DAY', 'CUSTOM', name='partofday'), nullable=False),
        sa.Column('custom_start', sa.Time(), nullable=True),
        sa.Column('custom_end', sa.Time(), nullable=True),
        sa.Column('type', sa.Enum('SURGERY', 'CONSULT', name='selectiontype'), nullable=False),
        sa.ForeignKeyConstraint(['macro_period_id'], ['macro_periods.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_macro_period_selections_id'), 'macro_period_selections', ['id'], unique=False)
    op.create_index(op.f('ix_macro_period_selections_macro_period_id'), 'macro_period_selections', ['macro_period_id'], unique=False)

    # Create audit_events table
    op.create_table(
        'audit_events',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('macro_period_id', sa.Integer(), nullable=False),
        sa.Column('event_type', sa.Enum('CREATED', 'LINK_VIEWED', 'RESPONDED', 'UNLOCKED', 'UPDATED', 'CONFIRMED', 'CANCELLED', name='eventtype'), nullable=False),
        sa.Column('payload', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('created_by', sa.String(), nullable=False),
        sa.ForeignKeyConstraint(['macro_period_id'], ['macro_periods.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_audit_events_id'), 'audit_events', ['id'], unique=False)
    op.create_index(op.f('ix_audit_events_macro_period_id'), 'audit_events', ['macro_period_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_audit_events_macro_period_id'), table_name='audit_events')
    op.drop_index(op.f('ix_audit_events_id'), table_name='audit_events')
    op.drop_table('audit_events')
    op.drop_index(op.f('ix_macro_period_selections_macro_period_id'), table_name='macro_period_selections')
    op.drop_index(op.f('ix_macro_period_selections_id'), table_name='macro_period_selections')
    op.drop_table('macro_period_selections')
    op.drop_index(op.f('ix_macro_periods_status'), table_name='macro_periods')
    op.drop_index(op.f('ix_macro_periods_public_token'), table_name='macro_periods')
    op.drop_index(op.f('ix_macro_periods_id'), table_name='macro_periods')
    op.drop_table('macro_periods')
    op.drop_index(op.f('ix_doctors_email'), table_name='doctors')
    op.drop_index(op.f('ix_doctors_name'), table_name='doctors')
    op.drop_index(op.f('ix_doctors_id'), table_name='doctors')
    op.drop_table('doctors')
    op.drop_index(op.f('ix_units_id'), table_name='units')
    op.drop_table('units')
    sa.Enum(name='eventtype').drop(op.get_bind(), checkfirst=False)
    sa.Enum(name='selectiontype').drop(op.get_bind(), checkfirst=False)
    sa.Enum(name='partofday').drop(op.get_bind(), checkfirst=False)
    sa.Enum(name='macroperiodstatus').drop(op.get_bind(), checkfirst=False)
