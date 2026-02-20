"""Tests for the Redirect endpoint (/{short_code})."""

import pytest
from datetime import datetime, timedelta
from passlib.context import CryptContext
from app.models.link import Link
from app.models.analytics import ClickEvent
from tests.conftest import create_test_link

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class TestBasicRedirect:
    def test_redirect_basic(self, client, db, test_user):
        create_test_link(db, owner_id=test_user.id, short_code="go",
                         original_url="https://destination.com")
        resp = client.get("/go", follow_redirects=False)
        assert resp.status_code == 302
        assert resp.headers["location"] == "https://destination.com"

    def test_redirect_not_found(self, client):
        resp = client.get("/nonexistent", follow_redirects=False)
        assert resp.status_code == 302
        assert "/404" in resp.headers["location"]

    def test_redirect_favicon(self, client):
        resp = client.get("/favicon.ico")
        assert resp.status_code == 404


class TestRedirectProtections:
    def test_redirect_inactive(self, client, db, test_user):
        create_test_link(db, owner_id=test_user.id, short_code="off",
                         is_active=False)
        resp = client.get("/off", follow_redirects=False)
        assert resp.status_code == 302
        assert "type=disabled" in resp.headers["location"]

    def test_redirect_expired(self, client, db, test_user):
        create_test_link(db, owner_id=test_user.id, short_code="old",
                         expires_at=datetime.utcnow() - timedelta(days=1))
        resp = client.get("/old", follow_redirects=False)
        assert resp.status_code == 302
        assert "type=expired" in resp.headers["location"]

    def test_redirect_password_protected(self, client, db, test_user):
        create_test_link(db, owner_id=test_user.id, short_code="locked",
                         password_hash=pwd_context.hash("secret123"))
        resp = client.get("/locked", follow_redirects=False)
        assert resp.status_code == 302
        assert "pwd=1" in resp.headers["location"]
        assert "/verify/locked" in resp.headers["location"]

    def test_redirect_login_required(self, client, db, test_user):
        create_test_link(db, owner_id=test_user.id, short_code="loginreq",
                         require_login=True)
        resp = client.get("/loginreq", follow_redirects=False)
        assert resp.status_code == 302
        assert "login=1" in resp.headers["location"]
        assert "/verify/loginreq" in resp.headers["location"]


class TestRedirectStats:
    def test_redirect_stats_plus(self, client, db, test_user):
        create_test_link(db, owner_id=test_user.id, short_code="info")
        resp = client.get("/info+", follow_redirects=False)
        assert resp.status_code == 302
        assert "/stats/info" in resp.headers["location"]

    def test_redirect_click_tracking(self, client, db, test_user):
        link = create_test_link(db, owner_id=test_user.id, short_code="cnt",
                                original_url="https://count.example.com")
        # Count existing click events
        initial_events = db.query(ClickEvent).filter(ClickEvent.link_id == link.id).count()
        client.get("/cnt", follow_redirects=False)
        # A ClickEvent should have been created
        new_events = db.query(ClickEvent).filter(ClickEvent.link_id == link.id).count()
        assert new_events == initial_events + 1
