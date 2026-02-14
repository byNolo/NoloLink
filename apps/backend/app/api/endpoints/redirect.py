from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.crud import link as crud_link

router = APIRouter()

@router.get("/{short_code}")
def redirect_to_url(short_code: str, db: Session = Depends(get_db)):
    # Check for favico or common browser requests to ignore
    if short_code == "favicon.ico":
        raise HTTPException(status_code=404)
        
    link = crud_link.get_link_by_code(db, short_code=short_code)
    if not link:
        # Redirect to frontend 404 page
        return RedirectResponse("http://localhost:3070/404", status_code=status.HTTP_302_FOUND)
    
    if not link.is_active:
         # Simplified for now, eventually redirect to disabled page
         return RedirectResponse("http://localhost:3070/error?type=disabled", status_code=status.HTTP_302_FOUND)

    # Build verification params
    verify_params = []
    if link.password_hash:
        verify_params.append("pwd=1")
    if link.require_login:
        verify_params.append("login=1")

    if verify_params:
        query_string = "&".join(verify_params)
        return RedirectResponse(
            f"http://localhost:3070/verify/{short_code}?{query_string}", 
            status_code=status.HTTP_302_FOUND
        )

    # Increment statistics (async task in prod)
    crud_link.increment_clicks(db, link)
    
    return RedirectResponse(link.original_url, status_code=status.HTTP_302_FOUND)
