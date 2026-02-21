from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db
from app.crud import organization as crud_org
from app.schemas import organization as org_schema
from app.api import deps
from app.models.user import User

router = APIRouter()


@router.get("/", response_model=List[org_schema.Organization])
def list_orgs(
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """List all orgs the current user belongs to."""
    return crud_org.get_orgs_for_user(db, user_id=current_user.id)


@router.get("/mine")
def list_my_orgs(
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """List orgs with the current user's role (for frontend org context)."""
    memberships = crud_org.get_memberships_for_user(db, user_id=current_user.id)
    result = []
    for m in memberships:
        org = m.organization
        if org:
            result.append({
                "id": m.id,
                "org_id": org.id,
                "org_name": org.name,
                "org_slug": org.slug,
                "role": m.role,
                "joined_at": m.joined_at.isoformat() if m.joined_at else None,
            })
    return result


@router.get("/all")
def list_all_orgs(
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_superuser)
):
    """List all organizations with stats (superuser only)."""
    from app.models.organization import Organization, OrgMembership
    from app.models.link import Link
    from sqlalchemy import func

    orgs = db.query(Organization).filter(Organization.is_active == True).all()
    result = []
    for org in orgs:
        member_count = db.query(func.count(OrgMembership.id)).filter(OrgMembership.org_id == org.id).scalar()
        link_count = db.query(func.count(Link.id)).filter(Link.org_id == org.id).scalar()
        total_clicks = db.query(func.coalesce(func.sum(Link.clicks), 0)).filter(Link.org_id == org.id).scalar()
        result.append({
            "id": org.id,
            "name": org.name,
            "slug": org.slug,
            "plan": org.plan,
            "is_active": org.is_active,
            "created_at": org.created_at.isoformat() if org.created_at else None,
            "member_count": member_count,
            "link_count": link_count,
            "total_clicks": total_clicks,
        })
    return result


@router.get("/{org_id}/stats")
def get_org_stats(
    org_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_superuser)
):
    """Get detailed stats for an organization (superuser only)."""
    from app.models.organization import OrgMembership
    from app.models.link import Link
    from app.models.campaign import Campaign
    from sqlalchemy import func

    org = crud_org.get_org(db, org_id=org_id)
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    member_count = db.query(func.count(OrgMembership.id)).filter(OrgMembership.org_id == org_id).scalar()
    link_count = db.query(func.count(Link.id)).filter(Link.org_id == org_id).scalar()
    campaign_count = db.query(func.count(Campaign.id)).filter(Campaign.org_id == org_id).scalar()
    total_clicks = db.query(func.coalesce(func.sum(Link.clicks), 0)).filter(Link.org_id == org_id).scalar()
    active_links = db.query(func.count(Link.id)).filter(Link.org_id == org_id, Link.is_active == True).scalar()

    return {
        "org": {
            "id": org.id,
            "name": org.name,
            "slug": org.slug,
            "plan": org.plan,
            "created_at": org.created_at.isoformat() if org.created_at else None,
        },
        "member_count": member_count,
        "link_count": link_count,
        "active_links": active_links,
        "campaign_count": campaign_count,
        "total_clicks": total_clicks,
    }


@router.post("/", response_model=org_schema.Organization)
def create_org(
    org_data: org_schema.OrgCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_superuser)
):
    """Create a new organization (superuser only)."""
    return crud_org.create_org(db, org_data=org_data, owner_id=current_user.id)


@router.get("/{org_id}", response_model=org_schema.Organization)
def get_org(
    org_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """Get org details (must be a member)."""
    org = crud_org.get_org(db, org_id=org_id)
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    membership = crud_org.get_membership(db, user_id=current_user.id, org_id=org_id)
    if not membership and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not a member of this organization")
    return org


@router.put("/{org_id}", response_model=org_schema.Organization)
def update_org(
    org_id: int,
    org_data: org_schema.OrgUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """Update org (admin+ or superuser)."""
    org = crud_org.get_org(db, org_id=org_id)
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    membership = crud_org.get_membership(db, user_id=current_user.id, org_id=org_id)
    if not current_user.is_superuser and (not membership or membership.role not in ("owner", "admin")):
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    return crud_org.update_org(db, org=org, update_data=org_data)


# --- Members ---
@router.get("/{org_id}/members", response_model=List[org_schema.MembershipResponse])
def list_members(
    org_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """List org members (must be a member or superuser)."""
    membership = crud_org.get_membership(db, user_id=current_user.id, org_id=org_id)
    if not membership and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not a member of this organization")
    
    members = crud_org.get_members(db, org_id=org_id)
    result = []
    for m in members:
        user = m.user
        result.append(org_schema.MembershipResponse(
            id=m.id,
            user_id=m.user_id,
            org_id=m.org_id,
            role=m.role,
            joined_at=m.joined_at,
            email=user.email if user else None,
            username=user.username if user else None,
            full_name=user.full_name if user else None,
            avatar_url=user.avatar_url if user else None,
        ))
    return result


@router.delete("/{org_id}/members/{user_id}")
def remove_member(
    org_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """Remove member (admin+ or superuser). Cannot remove owner."""
    membership = crud_org.get_membership(db, user_id=current_user.id, org_id=org_id)
    if not current_user.is_superuser and (not membership or membership.role not in ("owner", "admin")):
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    target = crud_org.get_membership(db, user_id=user_id, org_id=org_id)
    if not target:
        raise HTTPException(status_code=404, detail="Member not found")
    if target.role == "owner":
        raise HTTPException(status_code=400, detail="Cannot remove the owner")
    
    crud_org.remove_member(db, org_id=org_id, user_id=user_id)
    return {"detail": "Member removed"}


@router.put("/{org_id}/members/{user_id}", response_model=org_schema.MembershipResponse)
def update_member_role(
    org_id: int,
    user_id: int,
    role_update: org_schema.RoleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """Change member role (owner or superuser only)."""
    membership = crud_org.get_membership(db, user_id=current_user.id, org_id=org_id)
    if not current_user.is_superuser and (not membership or membership.role != "owner"):
        raise HTTPException(status_code=403, detail="Only the owner can change roles")
    
    if role_update.role not in ("owner", "admin", "member"):
        raise HTTPException(status_code=400, detail="Role must be 'owner', 'admin' or 'member'")

    if role_update.role == "owner":
        # Demote existing owners to admin
        from app.models.organization import OrgMembership
        db.query(OrgMembership).filter(
            OrgMembership.org_id == org_id, 
            OrgMembership.role == "owner"
        ).update({"role": "admin"})
        db.flush()
    
    updated = crud_org.update_role(db, org_id=org_id, user_id=user_id, new_role=role_update.role)
    if not updated:
        raise HTTPException(status_code=404, detail="Member not found")
    
    user = updated.user
    return org_schema.MembershipResponse(
        id=updated.id, user_id=updated.user_id, org_id=updated.org_id,
        role=updated.role, joined_at=updated.joined_at,
        email=user.email if user else None,
        username=user.username if user else None,
        full_name=user.full_name if user else None,
        avatar_url=user.avatar_url if user else None,
    )


# --- Invites ---
@router.post("/{org_id}/invites", response_model=org_schema.InviteResponse)
def create_invite(
    org_id: int,
    invite_data: org_schema.InviteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """Send invite (admin+ or superuser). Only owners or superusers can invite a new owner."""
    membership = crud_org.get_membership(db, user_id=current_user.id, org_id=org_id)
    if not current_user.is_superuser and (not membership or membership.role not in ("owner", "admin")):
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    if invite_data.role not in ("owner", "admin", "member"):
        raise HTTPException(status_code=400, detail="Role must be 'owner', 'admin' or 'member'")
    
    if invite_data.role == "owner" and not current_user.is_superuser and membership.role != "owner":
        raise HTTPException(status_code=403, detail="Only the organization owner can invite a new owner")

    invite = crud_org.create_invite(
        db, org_id=org_id, invited_by=current_user.id,
        email=invite_data.email, role=invite_data.role
    )
    return invite


@router.get("/{org_id}/invites", response_model=List[org_schema.InviteResponse])
def list_invites(
    org_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """List pending invites (admin+ or superuser)."""
    membership = crud_org.get_membership(db, user_id=current_user.id, org_id=org_id)
    if not current_user.is_superuser and (not membership or membership.role not in ("owner", "admin")):
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    return crud_org.list_invites(db, org_id=org_id)


@router.delete("/{org_id}/invites/{invite_id}")
def revoke_invite(
    org_id: int,
    invite_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """Revoke invite (admin+ or superuser)."""
    membership = crud_org.get_membership(db, user_id=current_user.id, org_id=org_id)
    if not current_user.is_superuser and (not membership or membership.role not in ("owner", "admin")):
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    if not crud_org.revoke_invite(db, invite_id=invite_id, org_id=org_id):
        raise HTTPException(status_code=404, detail="Invite not found")
    return {"detail": "Invite revoked"}


# --- Accept invite (any authenticated user) ---
@router.post("/invites/accept")
def accept_invite(
    data: org_schema.InviteAccept,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """Accept an invite with token."""
    invite = crud_org.get_invite_by_token(db, token=data.token)
    if not invite:
        raise HTTPException(status_code=404, detail="Invalid or expired invite")
    
    from datetime import datetime
    if invite.expires_at and invite.expires_at.replace(tzinfo=None) < datetime.utcnow():
        invite.status = "expired"
        db.commit()
        raise HTTPException(status_code=400, detail="Invite has expired")
    
    if invite.role == "owner":
        # Demote existing owners to admin
        from app.models.organization import OrgMembership
        db.query(OrgMembership).filter(
            OrgMembership.org_id == invite.org_id, 
            OrgMembership.role == "owner"
        ).update({"role": "admin"})
        db.flush()

    membership = crud_org.accept_invite(db, invite=invite, user_id=current_user.id)
    return {"detail": "Invite accepted", "org_id": invite.org_id, "role": membership.role}
