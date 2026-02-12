from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db
from app.crud import link as crud_link
from app.schemas import link as link_schema
from app.api import deps
from app.models.user import User

router = APIRouter()

@router.get("/", response_model=List[link_schema.Link])
def read_links(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(deps.get_current_active_user)
):
    # If superuser, maybe show all? Or just own?
    # For now, let's keep it to own links, or strict "My Links" behavior.
    # If we want admin view, we'd add a separate endpoint or query param.
    return crud_link.get_links_by_owner(db, owner_id=current_user.id, skip=skip, limit=limit)

@router.post("/", response_model=link_schema.Link)
def create_link(
    link: link_schema.LinkCreate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(deps.get_current_active_user)
):
    if not current_user.is_approved and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="User not approved to create links")

    db_link = crud_link.create_link(db=db, link=link, owner_id=current_user.id)
    if not db_link:
        raise HTTPException(status_code=400, detail="Short code already exists")
    return db_link

@router.put("/{link_id}", response_model=link_schema.Link)
def update_link(
    link_id: int,
    link_in: link_schema.LinkCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    if not current_user.is_approved and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="User not approved to update links")

    link = crud_link.get_link(db, link_id=link_id)
    if not link:
        raise HTTPException(status_code=404, detail="Link not found")
    if link.owner_id != current_user.id and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    updated_link = crud_link.update_link(db=db, db_link=link, link_update=link_in)
    if not updated_link:
        raise HTTPException(status_code=400, detail="Short code already exists")
    return updated_link

@router.delete("/{link_id}", response_model=link_schema.Link)
def delete_link(
    link_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    link = crud_link.get_link(db, link_id=link_id)
    if not link:
        raise HTTPException(status_code=404, detail="Link not found")
    if link.owner_id != current_user.id and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    crud_link.delete_link(db=db, db_link=link)
    return link
