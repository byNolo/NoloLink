"""Tests for the Users API endpoints (/api/users/)."""

import pytest


class TestUserProfile:
    def test_get_me(self, client):
        resp = client.get("/api/users/me")
        assert resp.status_code == 200
        data = resp.json()
        assert data["username"] == "testuser"
        assert data["email"] == "testuser@example.com"
        assert data["is_approved"] is True


class TestAccessRequests:
    def test_request_access(self, db, unapproved_user):
        """Unapproved user can request access."""
        from tests.conftest import _make_client
        from main import app

        client = _make_client(db, unapproved_user)
        resp = client.post("/api/users/request-access")
        assert resp.status_code == 200
        assert resp.json()["request_status"] == "pending"
        app.dependency_overrides.clear()

    def test_request_access_already_approved(self, client):
        """Already approved user gets 400."""
        resp = client.post("/api/users/request-access")
        assert resp.status_code == 400
        assert "already approved" in resp.json()["detail"].lower()

    def test_request_access_already_pending(self, db, unapproved_user):
        """Second request while pending gets 400."""
        from tests.conftest import _make_client
        from main import app

        unapproved_user.request_status = "pending"
        db.add(unapproved_user)
        db.commit()

        client = _make_client(db, unapproved_user)
        resp = client.post("/api/users/request-access")
        assert resp.status_code == 400
        assert "already pending" in resp.json()["detail"].lower()
        app.dependency_overrides.clear()


class TestAdminUserManagement:
    def test_list_pending_requests(self, admin_client, db, unapproved_user):
        unapproved_user.request_status = "pending"
        db.add(unapproved_user)
        db.commit()

        resp = admin_client.get("/api/users/requests")
        assert resp.status_code == 200
        usernames = [u["username"] for u in resp.json()]
        assert "unapproved" in usernames

    def test_approve_user(self, admin_client, db, unapproved_user):
        resp = admin_client.post(f"/api/users/{unapproved_user.id}/approve")
        assert resp.status_code == 200
        data = resp.json()
        assert data["is_approved"] is True
        assert data["request_status"] == "approved"

    def test_reject_user(self, admin_client, db, unapproved_user):
        resp = admin_client.post(f"/api/users/{unapproved_user.id}/reject")
        assert resp.status_code == 200
        data = resp.json()
        assert data["is_approved"] is False
        assert data["request_status"] == "rejected"

    def test_admin_endpoints_non_admin(self, client, db, unapproved_user):
        """Regular user should get 400 on admin endpoints."""
        resp = client.get("/api/users/requests")
        assert resp.status_code == 400

        resp = client.post(f"/api/users/{unapproved_user.id}/approve")
        assert resp.status_code == 400

    def test_approve_nonexistent_user(self, admin_client):
        resp = admin_client.post("/api/users/99999/approve")
        assert resp.status_code == 404
