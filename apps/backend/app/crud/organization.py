import re
import secrets
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models.organization import Organization, OrgMembership, OrgInvite
from app.models.user import User
from app.schemas.organization import OrgCreate, OrgUpdate


def slugify(name: str) -> str:
    """Convert org name to a URL-safe slug."""
    slug = name.lower().strip()
    slug = re.sub(r'[^a-z0-9]+', '-', slug)
    slug = slug.strip('-')
    return slug


def create_org(db: Session, org_data: OrgCreate, owner_id: int) -> Organization:
    """Create org and add creator as owner."""
    slug = slugify(org_data.name)
    # Ensure slug uniqueness
    base_slug = slug
    counter = 1
    while db.query(Organization).filter(Organization.slug == slug).first():
        slug = f"{base_slug}-{counter}"
        counter += 1

    org = Organization(name=org_data.name, slug=slug)
    db.add(org)
    db.flush()

    membership = OrgMembership(user_id=owner_id, org_id=org.id, role="owner")
    db.add(membership)
    db.commit()
    db.refresh(org)
    return org


def get_org(db: Session, org_id: int) -> Organization:
    return db.query(Organization).filter(Organization.id == org_id, Organization.is_active == True).first()


def get_org_by_slug(db: Session, slug: str) -> Organization:
    return db.query(Organization).filter(Organization.slug == slug, Organization.is_active == True).first()


def get_orgs_for_user(db: Session, user_id: int) -> list:
    """Return all orgs a user belongs to."""
    memberships = db.query(OrgMembership).filter(OrgMembership.user_id == user_id).all()
    org_ids = [m.org_id for m in memberships]
    if not org_ids:
        return []
    return db.query(Organization).filter(Organization.id.in_(org_ids), Organization.is_active == True).all()


def get_memberships_for_user(db: Session, user_id: int) -> list:
    """Return all memberships for a user (with organization eagerly loaded)."""
    from sqlalchemy.orm import joinedload
    return db.query(OrgMembership).options(
        joinedload(OrgMembership.organization)
    ).filter(OrgMembership.user_id == user_id).all()


def get_membership(db: Session, user_id: int, org_id: int) -> OrgMembership:
    return db.query(OrgMembership).filter(
        OrgMembership.user_id == user_id,
        OrgMembership.org_id == org_id
    ).first()


def get_members(db: Session, org_id: int) -> list:
    return db.query(OrgMembership).filter(OrgMembership.org_id == org_id).all()


def add_member(db: Session, org_id: int, user_id: int, role: str = "member") -> OrgMembership:
    existing = get_membership(db, user_id=user_id, org_id=org_id)
    if existing:
        return existing
    membership = OrgMembership(user_id=user_id, org_id=org_id, role=role)
    db.add(membership)
    db.commit()
    db.refresh(membership)
    return membership


def remove_member(db: Session, org_id: int, user_id: int) -> bool:
    membership = get_membership(db, user_id=user_id, org_id=org_id)
    if not membership:
        return False
    db.delete(membership)
    db.commit()
    return True


def update_role(db: Session, org_id: int, user_id: int, new_role: str) -> OrgMembership:
    membership = get_membership(db, user_id=user_id, org_id=org_id)
    if not membership:
        return None
    membership.role = new_role
    db.commit()
    db.refresh(membership)
    return membership


def create_invite(db: Session, org_id: int, invited_by: int, email: str, role: str = "member") -> OrgInvite:
    token = secrets.token_urlsafe(32)
    expires_at = datetime.utcnow() + timedelta(days=7)
    invite = OrgInvite(
        org_id=org_id,
        invited_by=invited_by,
        email=email,
        role=role,
        token=token,
        expires_at=expires_at
    )
    db.add(invite)
    db.commit()
    db.refresh(invite)
    return invite


def get_invite_by_token(db: Session, token: str) -> OrgInvite:
    return db.query(OrgInvite).filter(OrgInvite.token == token, OrgInvite.status == "pending").first()


def list_invites(db: Session, org_id: int) -> list:
    return db.query(OrgInvite).filter(OrgInvite.org_id == org_id).all()


def accept_invite(db: Session, invite: OrgInvite, user_id: int) -> OrgMembership:
    """Accept an invite and create membership."""
    invite.status = "accepted"
    membership = add_member(db, org_id=invite.org_id, user_id=user_id, role=invite.role)
    db.commit()
    return membership


def revoke_invite(db: Session, invite_id: int, org_id: int) -> bool:
    invite = db.query(OrgInvite).filter(OrgInvite.id == invite_id, OrgInvite.org_id == org_id).first()
    if not invite:
        return False
    db.delete(invite)
    db.commit()
    return True


def update_org(db: Session, org: Organization, update_data: OrgUpdate) -> Organization:
    if update_data.name is not None:
        org.name = update_data.name
        org.slug = slugify(update_data.name)
    db.commit()
    db.refresh(org)
    return org
