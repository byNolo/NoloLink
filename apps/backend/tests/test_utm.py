"""Tests for UTM Builder functionality."""

import pytest
from tests.conftest import create_test_link, create_test_campaign
import io
import csv

class TestUTMBuilder:
    def test_create_link_with_utm(self, client):
        payload = {
            "original_url": "https://example.com/target",
            "utm_source": "newsletter",
            "utm_medium": "email",
            "utm_campaign": "spring_sale",
            "utm_term": "shoes",
            "utm_content": "header_link"
        }
        resp = client.post("/api/links/", json=payload)
        assert resp.status_code == 200
        data = resp.json()
        assert data["utm_source"] == "newsletter"
        assert data["utm_medium"] == "email"
        assert data["utm_campaign"] == "spring_sale"
        assert data["utm_term"] == "shoes"
        assert data["utm_content"] == "header_link"

    def test_update_link_utm(self, client, db, test_user):
        link = create_test_link(db, owner_id=test_user.id, utm_source="old_source")
        resp = client.put(f"/api/links/{link.id}", json={
            "original_url": link.original_url,
            "utm_source": "new_source"
        })
        assert resp.status_code == 200
        assert resp.json()["utm_source"] == "new_source"

    def test_redirect_appends_utm(self, client, db, test_user):
        link = create_test_link(db, owner_id=test_user.id, 
                                original_url="https://example.com/page?existing=1",
                                utm_source="google", 
                                utm_medium="cpc")
        # Ensure we don't have dependency overrides issues (client fixture should handle it)
        resp = client.get(f"/{link.short_code}", follow_redirects=False)
        assert resp.status_code == 302
        location = resp.headers["Location"]
        assert "utm_source=google" in location
        assert "utm_medium=cpc" in location
        assert "existing=1" in location

    def test_csv_export_includes_utm(self, client, db, test_user):
        create_test_link(db, owner_id=test_user.id, short_code="utm_csv",
                         utm_source="csv_source", utm_campaign="csv_campaign")
        
        resp = client.get("/api/export/csv")
        assert resp.status_code == 200
        
        content = resp.read().decode("utf-8")
        reader = csv.DictReader(io.StringIO(content))
        rows = list(reader)
        utm_row = next(r for r in rows if r["short_code"] == "utm_csv")
        
        assert utm_row["utm_source"] == "csv_source"
        assert utm_row["utm_campaign"] == "csv_campaign"

    def test_csv_import_with_utm(self, client, db, test_user):
        csv_content = (
            "original_url,utm_source,utm_medium,utm_campaign\n"
            "https://imported.com,imp_source,imp_medium,imp_camp"
        )
        files = {"file": ("import.csv", csv_content, "text/csv")}
        resp = client.post("/api/export/csv", files=files)
        assert resp.status_code == 200
        
        # Verify link created
        resp_links = client.get("/api/links/")
        links = resp_links.json()
        imp_link = next(l for l in links if l["original_url"] == "https://imported.com")
        assert imp_link["utm_source"] == "imp_source"
        assert imp_link["utm_medium"] == "imp_medium"
        assert imp_link["utm_campaign"] == "imp_camp"

    def test_bulk_update_utm(self, client, db, test_user):
        l1 = create_test_link(db, owner_id=test_user.id, short_code="bu1")
        l2 = create_test_link(db, owner_id=test_user.id, short_code="bu2")
        
        resp = client.put("/api/links/bulk", json={
            "link_ids": [l1.id, l2.id],
            "utm_source": "bulk_source",
            "utm_medium": "bulk_medium"
        })
        assert resp.status_code == 200
        for link_data in resp.json():
            assert link_data["utm_source"] == "bulk_source"
            assert link_data["utm_medium"] == "bulk_medium"
