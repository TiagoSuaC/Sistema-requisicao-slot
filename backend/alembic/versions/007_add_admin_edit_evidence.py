"""add admin edit evidence

Revision ID: 007
Revises: 006
Create Date: 2026-01-08

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers
revision = '007'
down_revision = '006'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create admin_edit_evidences table
    op.create_table(
        'admin_edit_evidences',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('macro_period_id', sa.Integer(), nullable=False),
        sa.Column('file_path', sa.String(500), nullable=False),
        sa.Column('original_filename', sa.String(255), nullable=True),
        sa.Column('file_size', sa.Integer(), nullable=True),
        sa.Column('mime_type', sa.String(100), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('uploaded_by', sa.String(255), nullable=True),
        sa.Column('uploaded_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['macro_period_id'], ['macro_periods.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # Add index for faster lookups
    op.create_index('idx_admin_edit_evidences_macro_period', 'admin_edit_evidences', ['macro_period_id'])


def downgrade() -> None:
    op.drop_index('idx_admin_edit_evidences_macro_period')
    op.drop_table('admin_edit_evidences')
