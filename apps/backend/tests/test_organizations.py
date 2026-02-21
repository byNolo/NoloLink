import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.api.deps import get_current_active_user, get_current_active_superuser, get_current_org, OrgContext
from app.models.user import User
from app.models.organization import Organization, OrgMembership, OrgInvite
from app.crud import organization as crud_org
from main import app

def test_transfer_ownership_via_role_update(admin_client: TestClient, db: Session, test_superuser: User, other_user: User):
    # Setup: Superuser creates an org
    response = admin_client.post(
        "/api/orgs/",
        json={"name": "Owner Transfer Org"}
    )
    assert response.status_code == 200
    org_id = response.json()["id"]
    
    # Check superuser is owner
    membership = db.query(OrgMembership).filter(
        OrgMembership.user_id == test_superuser.id, 
        OrgMembership.org_id == org_id
    ).first()
    assert membership.role == "owner"
    
    # Add other user as member
    crud_org.add_member(db, org_id=org_id, user_id=other_user.id, role="member")
    
    # Superuser promotes other user to owner
    response = admin_client.put(
        f"/api/orgs/{org_id}/members/{other_user.id}",
        json={"role": "owner"}
    )
    assert response.status_code == 200
    assert response.json()["role"] == "owner"
    
    # Verify demotion of previous owner (superuser)
    db.refresh(membership)
    assert membership.role == "admin"
    
    # Verify new owner
    new_membership = db.query(OrgMembership).filter(
        OrgMembership.user_id == other_user.id, 
        OrgMembership.org_id == org_id
    ).first()
    assert new_membership.role == "owner"

def test_transfer_ownership_via_invite(admin_client: TestClient, db: Session, test_superuser: User, other_user: User):
    # Setup: Superuser creates an org
    response = admin_client.post(
        "/api/orgs/",
        json={"name": "Invite Transfer Org"}
    )
    assert response.status_code == 200
    org_id = response.json()["id"]
    
    # Superuser invites other user as owner
    response = admin_client.post(
        f"/api/orgs/{org_id}/invites",
        json={"email": other_user.email, "role": "owner"}
    )
    assert response.status_code == 200
    invite_token = response.json()["token"] if "token" in response.json() else None
    
    if not invite_token:
        invite = db.query(OrgInvite).filter(OrgInvite.org_id == org_id, OrgInvite.email == other_user.email).first()
        invite_token = invite.token

    # Switch to Other User for accepting invite
    def _override_other_user():
        return other_user
    
    app.dependency_overrides[get_current_active_user] = _override_other_user
    # Also need to override org context if it's used (accept_invite doesn't use it, but good practice)
    
    try:
        response = admin_client.post(
            "/api/orgs/invites/accept",
            json={"token": invite_token}
        )
        assert response.status_code == 200
        assert response.json()["role"] == "owner"
        
        # Verify previous owner (superuser) is demoted
        membership = db.query(OrgMembership).filter(
            OrgMembership.user_id == test_superuser.id, 
            OrgMembership.org_id == org_id
        ).first()
        assert membership.role == "admin"
    finally:
        # Restore admin override (conftest cleanup will do this eventually, but let's be safe)
        def _override_admin():
            return test_superuser
        app.dependency_overrides[get_current_active_user] = _override_admin
