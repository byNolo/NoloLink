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
         raise HTTPException(status_code=400, detail="Link is inactive")

    # Increment statistics (async task in prod)
    crud_link.increment_clicks(db, link)
    
    return RedirectResponse(link.original_url, status_code=status.HTTP_302_FOUND)
