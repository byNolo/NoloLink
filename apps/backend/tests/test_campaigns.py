"""Tests for the Campaigns API endpoints (/api/campaigns/)."""

import pytest
from tests.conftest import create_test_campaign


class TestCreateCampaign:
    def test_create_campaign(self, client):
        resp = client.post("/api/campaigns/", json={
            "name": "Summer Sale",
            "color": "#FF6600",
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["name"] == "Summer Sale"
        assert data["color"] == "#FF6600"
        assert data["id"] is not None


class TestReadCampaigns:
    def test_read_campaigns(self, client, db, test_user):
        create_test_campaign(db, owner_id=test_user.id, name="Camp A")
        create_test_campaign(db, owner_id=test_user.id, name="Camp B")
        resp = client.get("/api/campaigns/")
        assert resp.status_code == 200
        names = [c["name"] for c in resp.json()]
        assert "Camp A" in names
        assert "Camp B" in names

    def test_read_single_campaign(self, client, db, test_user):
        camp = create_test_campaign(db, owner_id=test_user.id, name="Single Camp")
        resp = client.get(f"/api/campaigns/{camp.id}")
        assert resp.status_code == 200
        assert resp.json()["name"] == "Single Camp"

    def test_read_campaign_not_found(self, client):
        resp = client.get("/api/campaigns/99999")
        assert resp.status_code == 404


class TestUpdateCampaign:
    def test_update_campaign(self, client, db, test_user):
        camp = create_test_campaign(db, owner_id=test_user.id, name="Old Name")
        resp = client.put(f"/api/campaigns/{camp.id}", json={
            "name": "New Name",
            "color": "#00FF00",
        })
        assert resp.status_code == 200
        assert resp.json()["name"] == "New Name"
        assert resp.json()["color"] == "#00FF00"

    def test_update_campaign_not_owner(self, other_client, db, test_user):
        camp = create_test_campaign(db, owner_id=test_user.id, name="Not Mine")
        resp = other_client.put(f"/api/campaigns/{camp.id}", json={
            "name": "Hijacked",
        })
        assert resp.status_code == 403


class TestDeleteCampaign:
    def test_delete_campaign(self, client, db, test_user):
        camp = create_test_campaign(db, owner_id=test_user.id, name="To Delete")
        resp = client.delete(f"/api/campaigns/{camp.id}")
        assert resp.status_code == 200
        # Confirm it's gone
        resp2 = client.get(f"/api/campaigns/{camp.id}")
        assert resp2.status_code == 404

    def test_delete_campaign_not_owner(self, other_client, db, test_user):
        camp = create_test_campaign(db, owner_id=test_user.id, name="Protected")
        resp = other_client.delete(f"/api/campaigns/{camp.id}")
        assert resp.status_code == 403
