"""Tests for the Links API endpoints (/api/links/)."""

import pytest
from tests.conftest import create_test_link, create_test_campaign


class TestCreateLink:
    def test_create_link(self, client):
        resp = client.post("/api/links/", json={
            "original_url": "https://example.com/page",
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["original_url"] == "https://example.com/page"
        assert data["short_code"]  # auto-generated
        assert data["is_active"] is True
        assert data["clicks"] == 0

    def test_create_link_custom_code(self, client):
        resp = client.post("/api/links/", json={
            "original_url": "https://example.com/custom",
            "short_code": "mycode",
        })
        assert resp.status_code == 200
        assert resp.json()["short_code"] == "mycode"

    def test_create_link_duplicate_code(self, client, db, test_user):
        create_test_link(db, owner_id=test_user.id, short_code="dupe")
        resp = client.post("/api/links/", json={
            "original_url": "https://example.com",
            "short_code": "dupe",
        })
        assert resp.status_code == 400

    def test_create_link_with_password(self, client):
        resp = client.post("/api/links/", json={
            "original_url": "https://example.com/secret",
            "password": "supersecret",
        })
        assert resp.status_code == 200
        data = resp.json()
        # Password hash should not leak in response
        assert "password" not in data or data.get("password") is None
        assert "password_hash" not in data

    def test_create_link_with_expiry(self, client):
        resp = client.post("/api/links/", json={
            "original_url": "https://example.com/temp",
            "expires_at": "2099-12-31T23:59:59",
        })
        assert resp.status_code == 200
        assert resp.json()["expires_at"] is not None

    def test_create_link_short_code_no_plus(self, client):
        resp = client.post("/api/links/", json={
            "original_url": "https://example.com",
            "short_code": "bad+",
        })
        assert resp.status_code == 422  # Validation error

    def test_create_link_with_all_fields(self, client, db, test_user):
        camp = create_test_campaign(db, owner_id=test_user.id, name="Full Test")
        resp = client.post("/api/links/", json={
            "original_url": "https://example.com/full",
            "short_code": "fulltest",
            "title": "Full Test Link",
            "tags": "test,full",
            "redirect_type": 301,
            "campaign_id": camp.id,
            "is_active": True,
            "require_login": True,
            "allowed_emails": "a@b.com",
            "expires_at": "2099-01-01T00:00:00",
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["title"] == "Full Test Link"
        assert data["tags"] == "test,full"
        assert data["redirect_type"] == 301
        assert data["campaign_id"] == camp.id


class TestReadLinks:
    def test_read_links(self, client, db, test_user):
        create_test_link(db, owner_id=test_user.id, short_code="read1")
        create_test_link(db, owner_id=test_user.id, short_code="read2")
        resp = client.get("/api/links/")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) >= 2

    def test_read_links_search(self, client, db, test_user):
        create_test_link(db, owner_id=test_user.id, short_code="searchme",
                         title="Searchable Link", original_url="https://search.example.com")
        resp = client.get("/api/links/", params={"search": "Searchable"})
        assert resp.status_code == 200
        codes = [l["short_code"] for l in resp.json()]
        assert "searchme" in codes

    def test_read_links_filter_campaign(self, client, db, test_user):
        camp = create_test_campaign(db, owner_id=test_user.id, name="FilterCamp")
        create_test_link(db, owner_id=test_user.id, short_code="incamp",
                         campaign_id=camp.id)
        create_test_link(db, owner_id=test_user.id, short_code="nocamp")
        resp = client.get("/api/links/", params={"campaign_id": camp.id})
        assert resp.status_code == 200
        codes = [l["short_code"] for l in resp.json()]
        assert "incamp" in codes
        assert "nocamp" not in codes

    def test_read_links_filter_active(self, client, db, test_user):
        create_test_link(db, owner_id=test_user.id, short_code="active1", is_active=True)
        create_test_link(db, owner_id=test_user.id, short_code="inactive1", is_active=False)
        resp = client.get("/api/links/", params={"is_active": True})
        assert resp.status_code == 200
        codes = [l["short_code"] for l in resp.json()]
        assert "active1" in codes
        assert "inactive1" not in codes


class TestUpdateLink:
    def test_update_link(self, client, db, test_user):
        link = create_test_link(db, owner_id=test_user.id, short_code="upd1",
                                original_url="https://old.com")
        resp = client.put(f"/api/links/{link.id}", json={
            "original_url": "https://new.com",
            "short_code": "upd1",
        })
        assert resp.status_code == 200
        assert resp.json()["original_url"] == "https://new.com"

    def test_update_link_short_code_collision(self, client, db, test_user):
        create_test_link(db, owner_id=test_user.id, short_code="taken")
        link = create_test_link(db, owner_id=test_user.id, short_code="change",
                                original_url="https://example.com")
        resp = client.put(f"/api/links/{link.id}", json={
            "original_url": "https://example.com",
            "short_code": "taken",
        })
        assert resp.status_code == 400

    def test_update_link_toggle_active(self, client, db, test_user):
        link = create_test_link(db, owner_id=test_user.id, short_code="toggle1",
                                is_active=True)
        resp = client.put(f"/api/links/{link.id}", json={
            "original_url": link.original_url,
            "is_active": False,
        })
        assert resp.status_code == 200
        assert resp.json()["is_active"] is False


class TestDeleteLink:
    def test_delete_link(self, client, db, test_user):
        link = create_test_link(db, owner_id=test_user.id, short_code="del1")
        resp = client.delete(f"/api/links/{link.id}")
        assert resp.status_code == 200
        # Soft delete — link should not appear in listing
        resp2 = client.get("/api/links/")
        codes = [l["short_code"] for l in resp2.json()]
        assert "del1" not in codes

    def test_delete_link_not_found(self, client):
        resp = client.delete("/api/links/99999")
        assert resp.status_code == 404


class TestBulkOperations:
    def test_create_links_bulk(self, client):
        resp = client.post("/api/links/bulk", json=[
            {"original_url": "https://bulk1.com"},
            {"original_url": "https://bulk2.com"},
            {"original_url": "https://bulk3.com"},
        ])
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 3

    def test_update_links_bulk(self, client, db, test_user):
        l1 = create_test_link(db, owner_id=test_user.id, short_code="bulk_u1")
        l2 = create_test_link(db, owner_id=test_user.id, short_code="bulk_u2")
        resp = client.put("/api/links/bulk", json={
            "link_ids": [l1.id, l2.id],
            "is_active": False,
            "tags": "bulk-tagged",
        })
        assert resp.status_code == 200
        data = resp.json()
        for link_data in data:
            assert link_data["is_active"] is False
            assert link_data["tags"] == "bulk-tagged"


class TestLinkStats:
    def test_link_stats(self, client, db, test_user):
        create_test_link(db, owner_id=test_user.id, short_code="stats1")
        resp = client.get("/api/links/stats1/stats")
        assert resp.status_code == 200
        data = resp.json()
        assert "clicks" in data
        assert "clicks_over_time" in data


class TestOwnershipIsolation:
    def test_link_ownership_isolation(self, db, test_user, other_user, test_org):
        create_test_link(db, owner_id=test_user.id, short_code="mine")
        create_test_link(db, owner_id=other_user.id, short_code="theirs")

        from tests.conftest import _make_client
        from main import app

        # Check as test_user
        c1 = _make_client(db, test_user, test_org)
        resp1 = c1.get("/api/links/")
        codes1 = [l["short_code"] for l in resp1.json()]
        assert "mine" in codes1
        assert "theirs" not in codes1

        # Check as other_user
        c2 = _make_client(db, other_user, test_org)
        resp2 = c2.get("/api/links/")
        codes2 = [l["short_code"] for l in resp2.json()]
        assert "theirs" in codes2
        assert "mine" not in codes2

        app.dependency_overrides.clear()

