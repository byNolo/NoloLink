from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.api.endpoints import auth
from app.models.user import User


def test_oauth_callback_sets_cross_site_session_cookie(
    admin_client: TestClient,
    db: Session,
    test_user: User,
    monkeypatch,
):
    class TokenResponse:
        def raise_for_status(self):
            return None

        def json(self):
            return {"access_token": "oauth-access-token"}

    class UserResponse:
        def raise_for_status(self):
            return None

        def json(self):
            return {
                "id": test_user.keyn_id,
                "email": test_user.email,
                "username": test_user.username,
                "full_name": test_user.full_name,
            }

    monkeypatch.setattr(auth.requests, "post", lambda *args, **kwargs: TokenResponse())
    monkeypatch.setattr(auth.requests, "get", lambda *args, **kwargs: UserResponse())
    monkeypatch.setattr(auth.settings, "FRONTEND_URL", "https://nololink.bynolo.ca")

    response = admin_client.get(
        "/api/auth/callback?code=oauth-code&state=oauth-state",
        follow_redirects=False,
    )

    assert response.status_code == 307
    assert response.headers["location"] == "https://nololink.bynolo.ca"
    set_cookie = response.headers["set-cookie"]
    assert "access_token=oauth-access-token" in set_cookie
    assert "HttpOnly" in set_cookie
    assert "samesite=none" in set_cookie.lower()
    assert ("Secure" in set_cookie) == auth.settings.FRONTEND_URL.startswith("https://")
