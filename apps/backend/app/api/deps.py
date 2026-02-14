from typing import Generator, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
import requests

from app.core.config import settings
from app.db.session import get_db
from app.models.user import User
from app.crud.user import get_user_by_keyn_id

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")
oauth2_scheme_optional = OAuth2PasswordBearer(tokenUrl="token", auto_error=False)

def get_current_user(
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
) -> User:
    # Validate token with KeyN
    user_info_url = f"{settings.KEYN_AUTH_URL}/api/user-scoped"
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        # Verify token and get user info from KeyN
        res = requests.get(user_info_url, headers=headers)
        if res.status_code == 401:
             raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        res.raise_for_status()
        user_data = res.json()
    except Exception as e:
        # Fallback/Error handling
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Validate that this KeyN user exists in our local DB
    # (They should have been created during the callback flow)
    user = get_user_by_keyn_id(db, keyn_id=str(user_data["id"]))
    
    if not user:
        # Secure fallback: if user has a valid token but isn't in DB, maybe create them?
        # For now, raise unauthorized as they should have gone through /login
        raise HTTPException(status_code=404, detail="User not found")
        
    return user

def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

def get_current_active_superuser(
    current_user: User = Depends(get_current_active_user),
) -> User:
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=400, detail="The user doesn't have enough privileges"
        )
    return current_user

def get_current_user_optional(
    db: Session = Depends(get_db),
    token: Optional[str] = Depends(oauth2_scheme_optional)
) -> Optional[User]:
    if not token:
        return None
    try:
        return get_current_user(db, token)
    except HTTPException:
        return None

def get_current_active_user_optional(
    current_user: Optional[User] = Depends(get_current_user_optional),
) -> Optional[User]:
    if current_user and not current_user.is_active:
        return None
    return current_user
