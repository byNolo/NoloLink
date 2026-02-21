"""add organizations and org_id

Revision ID: f7e8d9c0b1a2
Revises: 23c980b95413
Create Date: 2026-02-20 15:30:00.000000
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'f7e8d9c0b1a2'
down_revision: Union[str, None] = '23c980b95413'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _column_exists(table_name: str, column_name: str) -> bool:
    """Check if a column already exists (handles partial migration residue)."""
    conn = op.get_bind()
    result = conn.execute(sa.text(f"PRAGMA table_info({table_name})"))
    return any(row[1] == column_name for row in result)


def upgrade() -> None:
    # 1. Create organizations table
    op.create_table(
        'organizations',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('slug', sa.String(), nullable=False),
        sa.Column('plan', sa.String(), server_default='free'),
        sa.Column('is_active', sa.Boolean(), server_default=sa.text('1')),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index('ix_organizations_slug', 'organizations', ['slug'], unique=True)

    # 2. Create org_memberships table
    op.create_table(
        'org_memberships',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('org_id', sa.Integer(), sa.ForeignKey('organizations.id'), nullable=False),
        sa.Column('role', sa.String(), nullable=False, server_default='member'),
        sa.Column('joined_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index('ix_org_memberships_user_id', 'org_memberships', ['user_id'])
    op.create_index('ix_org_memberships_org_id', 'org_memberships', ['org_id'])

    # 3. Create org_invites table
    op.create_table(
        'org_invites',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('org_id', sa.Integer(), sa.ForeignKey('organizations.id'), nullable=False),
        sa.Column('invited_by', sa.Integer(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('role', sa.String(), nullable=False, server_default='member'),
        sa.Column('token', sa.String(), nullable=False),
        sa.Column('status', sa.String(), server_default='pending'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index('ix_org_invites_token', 'org_invites', ['token'], unique=True)
    op.create_index('ix_org_invites_org_id', 'org_invites', ['org_id'])

    # 4. Add org_id to links, campaigns, audit_logs using batch mode (SQLite compat)
    # Skip if column already exists (handles partial migration residue)
    if not _column_exists('links', 'org_id'):
        with op.batch_alter_table('links') as batch_op:
            batch_op.add_column(sa.Column('org_id', sa.Integer(), nullable=True))
            batch_op.create_index('ix_links_org_id', ['org_id'])

    if not _column_exists('campaigns', 'org_id'):
        with op.batch_alter_table('campaigns') as batch_op:
            batch_op.add_column(sa.Column('org_id', sa.Integer(), nullable=True))
            batch_op.create_index('ix_campaigns_org_id', ['org_id'])

    if not _column_exists('audit_logs', 'org_id'):
        with op.batch_alter_table('audit_logs') as batch_op:
            batch_op.add_column(sa.Column('org_id', sa.Integer(), nullable=True))
            batch_op.create_index('ix_audit_logs_org_id', ['org_id'])

    # 5. Data migration: create default org and backfill
    conn = op.get_bind()

    conn.execute(sa.text(
        "INSERT INTO organizations (name, slug, plan, is_active) VALUES ('NoloLink', 'nololink', 'free', 1)"
    ))
    
    result = conn.execute(sa.text("SELECT id FROM organizations WHERE slug = 'nololink'"))
    default_org_id = result.fetchone()[0]

    # Add superuser(s) as owner
    superusers = conn.execute(sa.text("SELECT id FROM users WHERE is_superuser = 1"))
    for row in superusers:
        conn.execute(sa.text(
            "INSERT INTO org_memberships (user_id, org_id, role) VALUES (:uid, :oid, 'owner')"
        ), {"uid": row[0], "oid": default_org_id})

    # Add approved non-superusers as members
    conn.execute(sa.text(
        "INSERT INTO org_memberships (user_id, org_id, role) "
        "SELECT id, :oid, 'member' FROM users "
        "WHERE is_approved = 1 AND is_superuser = 0 "
        "AND id NOT IN (SELECT user_id FROM org_memberships WHERE org_id = :oid)"
    ), {"oid": default_org_id})

    # Backfill org_id on existing data
    conn.execute(sa.text("UPDATE links SET org_id = :oid"), {"oid": default_org_id})
    conn.execute(sa.text("UPDATE campaigns SET org_id = :oid"), {"oid": default_org_id})
    conn.execute(sa.text("UPDATE audit_logs SET org_id = :oid"), {"oid": default_org_id})


def downgrade() -> None:
    with op.batch_alter_table('audit_logs') as batch_op:
        batch_op.drop_index('ix_audit_logs_org_id')
        batch_op.drop_column('org_id')
    with op.batch_alter_table('campaigns') as batch_op:
        batch_op.drop_index('ix_campaigns_org_id')
        batch_op.drop_column('org_id')
    with op.batch_alter_table('links') as batch_op:
        batch_op.drop_index('ix_links_org_id')
        batch_op.drop_column('org_id')
    op.drop_table('org_invites')
    op.drop_table('org_memberships')
    op.drop_table('organizations')
