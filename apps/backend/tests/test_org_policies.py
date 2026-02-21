import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.organization import Organization, OrgMembership
from tests.conftest import create_test_link

def test_link_privacy_policy_enabled(db: Session, client: TestClient, other_user: User, test_org: Organization, test_user: User):
    # Setup: Create links for both users
    create_test_link(db, owner_id=test_user.id, short_code="user1-link", org_id=test_org.id)
    create_test_link(db, owner_id=other_user.id, short_code="other-link", org_id=test_org.id)
    
    # Policy: Privacy Enabled (Default)
    test_org.is_link_privacy_enabled = True
    db.commit()
    
    response = client.get("/api/links/")
    assert response.status_code == 200
    links = response.json()
    assert len(links) == 1
    assert links[0]["short_code"] == "user1-link"

def test_link_privacy_policy_disabled(db: Session, client: TestClient, other_user: User, test_org: Organization, test_user: User):
    # Setup: Create links for both users
    create_test_link(db, owner_id=test_user.id, short_code="user1-link", org_id=test_org.id)
    create_test_link(db, owner_id=other_user.id, short_code="other-link", org_id=test_org.id)
    
    # Policy: Privacy Disabled
    test_org.is_link_privacy_enabled = False
    db.commit()
    
    response = client.get("/api/links/")
    assert response.status_code == 200
    links = response.json()
    assert len(links) == 2

def test_member_edit_policy_disallowed(db: Session, client: TestClient, test_user: User, test_org: Organization):
    # Setup: Create a link
    link = create_test_link(db, owner_id=test_user.id, short_code="edit-test", org_id=test_org.id)
    
    # Policy: Disallow Edit
    test_org.allow_member_edit = False
    db.commit()
    
    response = client.put(f"/api/links/{link.id}", json={"title": "Another Title", "original_url": "https://example.com"})
    assert response.status_code == 403
    assert "Member editing is disabled" in response.json()["detail"]

def test_admin_edit_policy_ignores_member_flag(db: Session, admin_client: TestClient, test_user: User, test_org: Organization):
    # Setup: Create a link owned by a member
    link = create_test_link(db, owner_id=test_user.id, short_code="edit-test-admin", org_id=test_org.id)
    
    # Policy: Disallow Edit for members
    test_org.allow_member_edit = False
    db.commit()
    
    # Admin should still be able to edit
    response = admin_client.put(f"/api/links/{link.id}", json={"title": "Admin Title", "original_url": "https://example.com"})
    if response.status_code != 200:
        print(f"DEBUG: response={response.json()}")
    assert response.status_code == 200

def test_member_delete_policy_disallowed(db: Session, client: TestClient, test_user: User, test_org: Organization):
    # Setup: Create a link
    link = create_test_link(db, owner_id=test_user.id, short_code="del-test", org_id=test_org.id)
    
    # Policy: Disallow Delete
    test_org.allow_member_delete = False
    db.commit()
    
    response = client.delete(f"/api/links/{link.id}")
    assert response.status_code == 403
    assert "Member deletion is disabled" in response.json()["detail"]

def test_admin_delete_policy_ignores_member_flag(db: Session, admin_client: TestClient, test_user: User, test_org: Organization):
    # Setup: Create a link
    link = create_test_link(db, owner_id=test_user.id, short_code="del-test-admin", org_id=test_org.id)
    
    # Policy: Disallow Delete for members
    test_org.allow_member_delete = False
    db.commit()
    
    # Admin should still be able to delete
    response = admin_client.delete(f"/api/links/{link.id}")
    assert response.status_code == 200

def test_policy_update_permissions_member(client: TestClient, test_org: Organization):
    # Member cannot update policies
    response = client.put(
        f"/api/orgs/{test_org.id}", 
        json={"is_link_privacy_enabled": False}
    )
    assert response.status_code == 403

def test_policy_update_permissions_owner(admin_client: TestClient, test_org: Organization):
    # Owner (admin_client in this context is superuser/owner) can update policies
    response = admin_client.put(
        f"/api/orgs/{test_org.id}", 
        json={"is_link_privacy_enabled": False}
    )
    assert response.status_code == 200
    assert response.json()["is_link_privacy_enabled"] is False
