from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.crud import link as crud_link
from datetime import datetime

router = APIRouter()

from app.core.config import settings

from fastapi import APIRouter, Depends, HTTPException, status, Request
from app.utils.analytics import capture_click

@router.get("/{short_code}")
def redirect_to_url(short_code: str, request: Request, db: Session = Depends(get_db)):
    print(f"DEBUG: Redirecting short_code='{short_code}'")
    # Check for stats request (glory to the +)
    if short_code.endswith("+"):
        real_code = short_code[:-1]
        # Redirect to Frontend Stats Page
        # The frontend will handle auth check and redirect back here if needed
        return RedirectResponse(f"{settings.FRONTEND_URL}/stats/{real_code}", status_code=status.HTTP_302_FOUND)

    # Check for favico or common browser requests to ignore
    if short_code == "favicon.ico":
        raise HTTPException(status_code=404)
        
    link = crud_link.get_link_by_code(db, short_code=short_code)
    if not link:
        # Redirect to frontend 404 page
        return RedirectResponse(f"{settings.FRONTEND_URL}/404", status_code=status.HTTP_302_FOUND)
    
    if not link.is_active:
         return RedirectResponse(f"{settings.FRONTEND_URL}/error?type=disabled", status_code=status.HTTP_302_FOUND)



    if link.expires_at and link.expires_at.replace(tzinfo=None) < datetime.utcnow():
         return RedirectResponse(f"{settings.FRONTEND_URL}/error?type=expired", status_code=status.HTTP_302_FOUND)

    # Build verification params
    verify_params = []
    if link.password_hash:
        verify_params.append("pwd=1")
    if link.require_login:
        verify_params.append("login=1")

    if verify_params:
        query_string = "&".join(verify_params)
        return RedirectResponse(
            f"{settings.FRONTEND_URL}/verify/{short_code}?{query_string}", 
            status_code=status.HTTP_302_FOUND
        )

    # Increment statistics (async task in prod)
    crud_link.increment_clicks(db, link)

    # Capture detailed analytics
    try:
        capture_click(db, link, request)
    except Exception as e:
        print(f"Error capturing click analytics: {e}")
    
    return RedirectResponse(link.original_url, status_code=status.HTTP_302_FOUND)
