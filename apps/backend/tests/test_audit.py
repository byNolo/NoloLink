"""Tests for the Audit Log API endpoints (/api/audit/)."""

import json
import pytest
from tests.conftest import create_test_link, create_test_campaign


class TestAuditOnLinkCRUD:
    def test_audit_log_on_create_link(self, client):
        resp = client.post("/api/links/", json={
            "original_url": "https://audit-create.com",
            "short_code": "audc1",
        })
        assert resp.status_code == 200

        # Check audit log
        audit_resp = client.get("/api/audit/", params={"action": "create", "target_type": "link"})
        assert audit_resp.status_code == 200
        entries = audit_resp.json()
        matching = [e for e in entries if "audc1" in (e.get("details") or "")]
        assert len(matching) >= 1

    def test_audit_log_on_update_link(self, client, db, test_user):
        link = create_test_link(db, owner_id=test_user.id, short_code="audu1",
                                original_url="https://old.com")
        resp = client.put(f"/api/links/{link.id}", json={
            "original_url": "https://new.com",
            "short_code": "audu1",
        })
        assert resp.status_code == 200

        audit_resp = client.get("/api/audit/", params={"action": "update", "target_type": "link"})
        assert audit_resp.status_code == 200
        entries = audit_resp.json()
        matching = [e for e in entries if "audu1" in (e.get("details") or "")]
        assert len(matching) >= 1

    def test_audit_log_on_delete_link(self, client, db, test_user):
        link = create_test_link(db, owner_id=test_user.id, short_code="auddel")
        resp = client.delete(f"/api/links/{link.id}")
        assert resp.status_code == 200

        audit_resp = client.get("/api/audit/", params={"action": "delete", "target_type": "link"})
        assert audit_resp.status_code == 200
        entries = audit_resp.json()
        matching = [e for e in entries if "auddel" in (e.get("details") or "")]
        assert len(matching) >= 1


class TestAuditOnCampaignCRUD:
    def test_audit_log_on_campaign_create(self, client):
        resp = client.post("/api/campaigns/", json={"name": "AuditCamp", "color": "#123456"})
        assert resp.status_code == 200

        audit_resp = client.get("/api/audit/", params={"action": "create", "target_type": "campaign"})
        assert audit_resp.status_code == 200
        entries = audit_resp.json()
        matching = [e for e in entries if "AuditCamp" in (e.get("details") or "")]
        assert len(matching) >= 1

    def test_audit_log_on_campaign_update(self, client, db, test_user):
        camp = create_test_campaign(db, owner_id=test_user.id, name="AudUpdCamp")
        resp = client.put(f"/api/campaigns/{camp.id}", json={"name": "AudUpdCampNew"})
        assert resp.status_code == 200

        audit_resp = client.get("/api/audit/", params={"action": "update", "target_type": "campaign"})
        assert audit_resp.status_code == 200
        entries = audit_resp.json()
        matching = [e for e in entries if "AudUpdCamp" in (e.get("details") or "")]
        assert len(matching) >= 1

    def test_audit_log_on_campaign_delete(self, client, db, test_user):
        camp = create_test_campaign(db, owner_id=test_user.id, name="AudDelCamp")
        resp = client.delete(f"/api/campaigns/{camp.id}")
        assert resp.status_code == 200

        audit_resp = client.get("/api/audit/", params={"action": "delete", "target_type": "campaign"})
        assert audit_resp.status_code == 200
        entries = audit_resp.json()
        matching = [e for e in entries if "AudDelCamp" in (e.get("details") or "")]
        assert len(matching) >= 1


class TestAuditFiltering:
    def test_audit_filter_by_action(self, client):
        # Create a link to generate audit entry
        client.post("/api/links/", json={
            "original_url": "https://filter-action.com",
            "short_code": "filtact",
        })

        # Filter by create
        resp = client.get("/api/audit/", params={"action": "create"})
        assert resp.status_code == 200
        for entry in resp.json():
            assert entry["action"] == "create"

    def test_audit_filter_by_target(self, client):
        client.post("/api/campaigns/", json={"name": "FilterTarget", "color": "#000"})

        resp = client.get("/api/audit/", params={"target_type": "campaign"})
        assert resp.status_code == 200
        for entry in resp.json():
            assert entry["target_type"] == "campaign"


class TestAuditIsolation:
    def test_audit_user_isolation(self, db, test_user, other_user):
        """Regular users should only see their own audit entries."""
        from tests.conftest import _make_client
        from main import app

        # Create a link as test_user
        c1 = _make_client(db, test_user)
        c1.post("/api/links/", json={
            "original_url": "https://mine.com",
            "short_code": "myaudit",
        })

        # Create a link as other_user
        c2 = _make_client(db, other_user)
        c2.post("/api/links/", json={
            "original_url": "https://theirs.com",
            "short_code": "theiraudit",
        })

        # Check as test_user — should only see their entries
        c1 = _make_client(db, test_user)
        resp = c1.get("/api/audit/")
        assert resp.status_code == 200
        for entry in resp.json():
            details = entry.get("details", "")
            assert "theiraudit" not in details

        app.dependency_overrides.clear()

    def test_audit_admin_sees_all(self, db, test_user, test_superuser):
        """Admin should see all users' audit entries."""
        from tests.conftest import _make_client
        from main import app

        # Create as regular user
        c1 = _make_client(db, test_user)
        c1.post("/api/links/", json={
            "original_url": "https://visible.com",
            "short_code": "adminvis",
        })

        # Check as admin
        c2 = _make_client(db, test_superuser)
        resp = c2.get("/api/audit/")
        assert resp.status_code == 200
        assert len(resp.json()) >= 1

        app.dependency_overrides.clear()


class TestAuditDetailSummary:
    def test_audit_detail_summary(self, client, db, test_user):
        """Audit entries should contain a human-readable summary field."""
        link = create_test_link(db, owner_id=test_user.id, short_code="sumtest",
                                original_url="https://summary.com")
        client.put(f"/api/links/{link.id}", json={
            "original_url": "https://updated.com",
            "short_code": "sumtest",
        })

        audit_resp = client.get("/api/audit/", params={"action": "update", "target_type": "link"})
        entries = audit_resp.json()
        matching = [e for e in entries if "sumtest" in (e.get("details") or "")]
        assert len(matching) >= 1

        details = json.loads(matching[0]["details"])
        assert "summary" in details
        assert len(details["summary"]) > 0
