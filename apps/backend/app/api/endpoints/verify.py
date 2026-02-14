from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.crud import link as crud_link
from passlib.context import CryptContext
from pydantic import BaseModel
from typing import Optional

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

from app.api import deps
from app.models.user import User

class VerifyPasswordRequest(BaseModel):
    password: Optional[str] = None

@router.post("/{short_code}")
def verify_link_access(
    short_code: str,
    password_in: VerifyPasswordRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(deps.get_current_active_user_optional)
):
    link = crud_link.get_link_by_code(db, short_code=short_code)
    if not link:
        raise HTTPException(status_code=404, detail="Link not found")
    
    if not link.is_active:
        raise HTTPException(status_code=400, detail="Link is inactive")
        
    # OR Logic: Use a "passed" flag
    passed_password = False
    passed_login = False
    
    # Check Password if configured
    if link.password_hash:
        if password_in.password and pwd_context.verify(password_in.password, link.password_hash):
            passed_password = True
    
    # Check Login if configured
    if link.require_login:
        if current_user:
            # Check allowlist
            allowed_check = True
            if link.allowed_emails:
                import json
                try:
                    allowed = json.loads(link.allowed_emails)
                except:
                    allowed = [e.strip() for e in link.allowed_emails.split(',')]
                
                if current_user.email not in allowed:
                    allowed_check = False
            
            if allowed_check:
                passed_login = True

    # Decision Logic
    is_authorized = False

    if link.password_hash and link.require_login:
        # Dual protection: OR logic (User requested "either")
        if passed_password or passed_login:
            is_authorized = True
        else:
            # Determine detailed error
            if not password_in.password and not current_user:
                 raise HTTPException(status_code=401, detail="Authentication required (Password or Login)")
            if password_in.password and not passed_password:
                 raise HTTPException(status_code=401, detail="Incorrect password")
            if current_user and not passed_login:
                 raise HTTPException(status_code=403, detail="Access denied for this account")
            raise HTTPException(status_code=401, detail="Authentication failed")

    elif link.password_hash:
        # Password only
        if passed_password:
            is_authorized = True
        else:
             if not password_in.password:
                  raise HTTPException(status_code=401, detail="Password required")
             raise HTTPException(status_code=401, detail="Incorrect password")

    elif link.require_login:
        # Login only
        if passed_login:
            is_authorized = True
        else:
            if not current_user:
                raise HTTPException(status_code=403, detail="Login required")
            raise HTTPException(status_code=403, detail="Access denied for this account")
            
    else:
        # No protection (shouldn't happen for verify endpoint usually, but safe fallback)
        is_authorized = True

    if not is_authorized:
        raise HTTPException(status_code=403, detail="Access denied")

    # Increment statistics
    crud_link.increment_clicks(db, link)

    return {"original_url": link.original_url}
