"""Tests for the Verify endpoint (/api/verify/{short_code})."""

import json
import pytest
from passlib.context import CryptContext
from tests.conftest import create_test_link

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class TestPasswordVerification:
    def test_verify_correct_password(self, client, db, test_user):
        create_test_link(
            db, owner_id=test_user.id, short_code="pwdok",
            original_url="https://secret.example.com",
            password_hash=pwd_context.hash("correct"),
        )
        resp = client.post("/api/verify/pwdok", json={"password": "correct"})
        assert resp.status_code == 200
        assert resp.json()["original_url"] == "https://secret.example.com"

    def test_verify_wrong_password(self, client, db, test_user):
        create_test_link(
            db, owner_id=test_user.id, short_code="pwdbad",
            password_hash=pwd_context.hash("correct"),
        )
        resp = client.post("/api/verify/pwdbad", json={"password": "wrong"})
        assert resp.status_code == 401

    def test_verify_no_password(self, client, db, test_user):
        create_test_link(
            db, owner_id=test_user.id, short_code="pwdmiss",
            password_hash=pwd_context.hash("correct"),
        )
        resp = client.post("/api/verify/pwdmiss", json={})
        assert resp.status_code == 401


class TestLoginVerification:
    def test_verify_login_required_authenticated(self, client, db, test_user):
        create_test_link(
            db, owner_id=test_user.id, short_code="login1",
            original_url="https://members.example.com",
            require_login=True,
        )
        resp = client.post("/api/verify/login1", json={})
        assert resp.status_code == 200
        assert resp.json()["original_url"] == "https://members.example.com"

    def test_verify_login_required_no_auth(self, anon_client, db, test_user):
        create_test_link(
            db, owner_id=test_user.id, short_code="loginno",
            require_login=True,
        )
        resp = anon_client.post("/api/verify/loginno", json={})
        assert resp.status_code == 403


class TestAllowlistVerification:
    def test_verify_allowlist_allowed(self, client, db, test_user):
        create_test_link(
            db, owner_id=test_user.id, short_code="allow1",
            original_url="https://private.example.com",
            require_login=True,
            allowed_emails=json.dumps(["testuser@example.com"]),
        )
        resp = client.post("/api/verify/allow1", json={})
        assert resp.status_code == 200
        assert resp.json()["original_url"] == "https://private.example.com"

    def test_verify_allowlist_denied(self, client, db, test_user):
        create_test_link(
            db, owner_id=test_user.id, short_code="deny1",
            require_login=True,
            allowed_emails=json.dumps(["other@example.com"]),
        )
        resp = client.post("/api/verify/deny1", json={})
        assert resp.status_code == 403


class TestDualProtection:
    def test_verify_dual_password_ok(self, client, db, test_user):
        """Both password and login required — correct password alone should grant access (OR logic)."""
        create_test_link(
            db, owner_id=test_user.id, short_code="dual1",
            original_url="https://dual.example.com",
            password_hash=pwd_context.hash("pass123"),
            require_login=True,
        )
        resp = client.post("/api/verify/dual1", json={"password": "pass123"})
        assert resp.status_code == 200

    def test_verify_dual_login_ok(self, client, db, test_user):
        """Both protections — valid login alone should grant access (OR logic)."""
        create_test_link(
            db, owner_id=test_user.id, short_code="dual2",
            original_url="https://dual.example.com",
            password_hash=pwd_context.hash("pass123"),
            require_login=True,
        )
        # Authenticated user, no password — should pass via login
        resp = client.post("/api/verify/dual2", json={})
        assert resp.status_code == 200


class TestVerifyEdgeCases:
    def test_verify_inactive_link(self, client, db, test_user):
        create_test_link(
            db, owner_id=test_user.id, short_code="inactive_v",
            is_active=False, password_hash=pwd_context.hash("pass"),
        )
        resp = client.post("/api/verify/inactive_v", json={"password": "pass"})
        assert resp.status_code == 400

    def test_verify_not_found(self, client):
        resp = client.post("/api/verify/nosuchcode", json={"password": "x"})
        assert resp.status_code == 404
