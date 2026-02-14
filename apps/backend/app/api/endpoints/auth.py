from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
import requests
import secrets
from urllib.parse import urlencode

from app.core.config import settings
from app.db.session import get_db
from app.crud import user as crud_user
from app.schemas import user as user_schema

router = APIRouter()

@router.get("/login")
def login(request: Request):
    state = secrets.token_urlsafe(32)
    # In a real app, store state in session/cookie to validate in callback
    
    params = {
        "client_id": settings.KEYN_CLIENT_ID,
        "redirect_uri": settings.KEYN_REDIRECT_URI,
        "scope": "id,username,email,full_name",
        "state": state
    }
    auth_url = f"{settings.KEYN_AUTH_URL}/oauth/authorize?{urlencode(params)}"
    # We need to handle the fact that the callback URI must match what KeyN expects.
    # If KeyN expects /auth/callback, but we are now at /api/auth/callback, we need to be careful.
    # Assuming KEYN_REDIRECT_URI in env is correct.
    return RedirectResponse(auth_url)

@router.get("/callback")
def callback(code: str, state: str, db: Session = Depends(get_db)):
    # 1. Exchange code for token
    token_url = f"{settings.KEYN_AUTH_URL}/oauth/token"
    token_data = {
        "grant_type": "authorization_code",
        "code": code,
        "client_id": settings.KEYN_CLIENT_ID,
        "client_secret": settings.KEYN_CLIENT_SECRET,
        "redirect_uri": settings.KEYN_REDIRECT_URI,
    }
    
    try:
        token_res = requests.post(token_url, data=token_data)
        token_res.raise_for_status()
        token_json = token_res.json()
        access_token = token_json["access_token"]
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to exchange token: {str(e)}")

    # 2. Get user info
    user_info_url = f"{settings.KEYN_AUTH_URL}/api/user-scoped"
    headers = {"Authorization": f"Bearer {access_token}"}
    
    try:
        user_res = requests.get(user_info_url, headers=headers)
        user_res.raise_for_status()
        user_data = user_res.json()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to fetch user info: {str(e)}")

    # 3. Create or Update User in DB
    existing_user = crud_user.get_user_by_keyn_id(db, keyn_id=str(user_data["id"]))
    
    user_in = user_schema.UserCreate(
        keyn_id=str(user_data["id"]),
        email=user_data["email"],
        username=user_data["username"],
        full_name=user_data.get("full_name"),
        avatar_url=user_data.get("avatar_url") # Assuming KeyN provides this, otherwise None
    )

    if existing_user:
        # Update details if changed
        user_update = user_schema.UserUpdate(**user_in.dict())
        db_user = crud_user.update_user(db, existing_user, user_update)
    else:
        db_user = crud_user.create_user(db, user_in)

    # 4. Create Session/Token for Frontend (simplified for MVP)
    # For now, redirect to frontend with access_token or a session cookie
    # Ideally, issue our own JWT. For MVP speed, passing the existing data might be enough or just a simple cookie.
    # Let's redirect to frontend with the raw token for now (NOT SECURE FOR PROD, but okay for checking flow).
    # TODO: Implement proper JWT issuance.
    
    frontend_url = f"{settings.FRONTEND_URL}?token={access_token}&username={db_user.username}"
    return RedirectResponse(frontend_url)
