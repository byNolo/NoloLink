from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api import deps
from app.crud import user as crud_user
from app.schemas import user as user_schema
from app.models.user import User

router = APIRouter()

@router.get("/me", response_model=user_schema.User)
def read_user_me(
    current_user: User = Depends(deps.get_current_active_user),
):
    """
    Get current user.
    """
    return current_user

@router.post("/request-access", response_model=user_schema.User)
def request_access(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """
    User requests access to create links.
    """
    if current_user.is_approved:
        raise HTTPException(status_code=400, detail="User already approved")
    if current_user.request_status == "pending":
        raise HTTPException(status_code=400, detail="Request already pending")
    
    user = crud_user.set_approval_status(db, db_user=current_user, is_approved=False, request_status="pending")
    return user

@router.get("/requests", response_model=List[user_schema.User])
def list_requests(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_superuser),
):
    """
    List all pending access requests.
    """
    # Assuming we want to filter by pending status. 
    # For simplicity, we can just query all users with pending status.
    # But for now, let's just return all users and filter in frontend or add a CRUD method.
    # Let's add a basic filter here using SQLAlchemy directly since CRUD might be limited.
    users = db.query(User).filter(User.request_status == "pending").all()
    return users

@router.post("/{user_id}/approve", response_model=user_schema.User)
def approve_user(
    user_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_superuser),
):
    """
    Approve a user's access request.
    """
    user = crud_user.get_user(db, user_id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user = crud_user.set_approval_status(db, db_user=user, is_approved=True, request_status="approved")
    return user

@router.post("/{user_id}/reject", response_model=user_schema.User)
def reject_user(
    user_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_superuser),
):
    """
    Reject a user's access request.
    """
    user = crud_user.get_user(db, user_id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user = crud_user.set_approval_status(db, db_user=user, is_approved=False, request_status="rejected")
    return user
