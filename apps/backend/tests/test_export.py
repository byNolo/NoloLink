"""Tests for the Export API endpoints (/api/export/)."""

import csv
import io
import pytest
from tests.conftest import create_test_link, create_test_campaign


class TestExportCSV:
    def test_export_csv(self, client, db, test_user):
        create_test_link(db, owner_id=test_user.id, short_code="exp1",
                         original_url="https://export1.com", title="Export One")
        create_test_link(db, owner_id=test_user.id, short_code="exp2",
                         original_url="https://export2.com", title="Export Two")

        resp = client.get("/api/export/csv")
        assert resp.status_code == 200
        assert "text/csv" in resp.headers["content-type"]

        # Parse CSV content
        reader = csv.DictReader(io.StringIO(resp.text))
        rows = list(reader)

        # Should have correct headers
        assert "short_code" in reader.fieldnames
        assert "original_url" in reader.fieldnames
        assert "title" in reader.fieldnames

        # Should contain our links
        codes = [r["short_code"] for r in rows]
        assert "exp1" in codes
        assert "exp2" in codes

    def test_export_csv_content(self, client, db, test_user):
        camp = create_test_campaign(db, owner_id=test_user.id, name="ExportCamp")
        create_test_link(db, owner_id=test_user.id, short_code="detailed",
                         original_url="https://detailed.com", title="Detailed Link",
                         tags="a,b", campaign_id=camp.id)

        resp = client.get("/api/export/csv")
        reader = csv.DictReader(io.StringIO(resp.text))
        rows = list(reader)

        row = next(r for r in rows if r["short_code"] == "detailed")
        assert row["original_url"] == "https://detailed.com"
        assert row["title"] == "Detailed Link"
        assert row["tags"] == "a,b"
        assert row["campaign_name"] == "ExportCamp"


class TestImportCSV:
    def _make_csv(self, rows: list[dict]) -> bytes:
        """Build a CSV file in-memory for upload."""
        output = io.StringIO()
        fieldnames = [
            "short_code", "original_url", "title", "tags", "is_active",
            "redirect_type", "campaign_name", "require_login", "allowed_emails",
            "expires_at", "clicks", "created_at"
        ]
        writer = csv.DictWriter(output, fieldnames=fieldnames)
        writer.writeheader()
        for row in rows:
            writer.writerow(row)
        return output.getvalue().encode("utf-8")

    def test_import_csv_success(self, client):
        csv_data = self._make_csv([
            {"original_url": "https://import1.com", "short_code": "imp1", "title": "Import 1"},
            {"original_url": "https://import2.com", "short_code": "imp2", "title": "Import 2"},
        ])

        resp = client.post(
            "/api/export/csv",
            files={"file": ("import.csv", csv_data, "text/csv")},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["created"] == 2
        assert data["skipped"] == 0

    def test_import_csv_duplicate_skip(self, client, db, test_user):
        create_test_link(db, owner_id=test_user.id, short_code="existing")
        csv_data = self._make_csv([
            {"original_url": "https://new.com", "short_code": "existing"},
        ])

        resp = client.post(
            "/api/export/csv",
            files={"file": ("import.csv", csv_data, "text/csv")},
        )
        assert resp.status_code == 200
        assert resp.json()["skipped"] == 1

    def test_import_csv_missing_url(self, client):
        csv_data = self._make_csv([
            {"original_url": "", "short_code": "nope"},
        ])

        resp = client.post(
            "/api/export/csv",
            files={"file": ("import.csv", csv_data, "text/csv")},
        )
        assert resp.status_code == 200
        assert resp.json()["skipped"] == 1

    def test_import_csv_invalid_file(self, client):
        resp = client.post(
            "/api/export/csv",
            files={"file": ("data.txt", b"not csv content", "text/plain")},
        )
        assert resp.status_code == 400

    def test_import_csv_campaign_resolution(self, client, db, test_user):
        create_test_campaign(db, owner_id=test_user.id, name="MyCamp")
        csv_data = self._make_csv([
            {"original_url": "https://camp.com", "short_code": "campimp",
             "campaign_name": "MyCamp"},
        ])

        resp = client.post(
            "/api/export/csv",
            files={"file": ("import.csv", csv_data, "text/csv")},
        )
        assert resp.status_code == 200
        assert resp.json()["created"] == 1

        # Verify the link was created with the correct campaign
        links_resp = client.get("/api/links/")
        imported = next(
            (l for l in links_resp.json() if l["short_code"] == "campimp"), None
        )
        assert imported is not None
        assert imported["campaign_id"] is not None


class TestExportImportRoundtrip:
    def test_roundtrip(self, client, db, test_user):
        """Export links, import them (with different codes) — data should match."""
        create_test_link(db, owner_id=test_user.id, short_code="rt1",
                         original_url="https://roundtrip.com", title="Roundtrip",
                         tags="x,y")

        # Export
        export_resp = client.get("/api/export/csv")
        assert export_resp.status_code == 200

        # Modify CSV to change short codes (avoid duplicates)
        reader = csv.DictReader(io.StringIO(export_resp.text))
        rows = list(reader)
        for row in rows:
            row["short_code"] = "rt_copy_" + row["short_code"]

        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=reader.fieldnames)
        writer.writeheader()
        writer.writerows(rows)
        csv_bytes = output.getvalue().encode("utf-8")

        # Import
        import_resp = client.post(
            "/api/export/csv",
            files={"file": ("roundtrip.csv", csv_bytes, "text/csv")},
        )
        assert import_resp.status_code == 200
        assert import_resp.json()["created"] >= 1
