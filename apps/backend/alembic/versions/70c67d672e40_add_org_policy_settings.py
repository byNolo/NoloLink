"""add_org_policy_settings

Revision ID: 70c67d672e40
Revises: f7e8d9c0b1a2
Create Date: 2026-02-20 23:44:08.074848

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '70c67d672e40'
down_revision: Union[str, Sequence[str], None] = 'f7e8d9c0b1a2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Adding columns one by one - SQLite supports this for simple cases
    op.add_column('organizations', sa.Column('is_link_privacy_enabled', sa.Boolean(), server_default='1', nullable=False))
    op.add_column('organizations', sa.Column('allow_member_delete', sa.Boolean(), server_default='1', nullable=False))
    op.add_column('organizations', sa.Column('allow_member_edit', sa.Boolean(), server_default='1', nullable=False))


def downgrade() -> None:
    with op.batch_alter_table('organizations') as batch_op:
        batch_op.drop_column('allow_member_edit')
        batch_op.drop_column('allow_member_delete')
        batch_op.drop_column('is_link_privacy_enabled')
