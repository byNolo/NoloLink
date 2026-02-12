from sqlalchemy.orm import Session
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate

def get_user(db: Session, user_id: int):
    return db.query(User).filter(User.id == user_id).first()

def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()

def get_user_by_keyn_id(db: Session, keyn_id: str):
    return db.query(User).filter(User.keyn_id == keyn_id).first()

def create_user(db: Session, user: UserCreate):
    db_user = User(
        keyn_id=user.keyn_id,
        email=user.email,
        username=user.username,
        full_name=user.full_name,
        avatar_url=user.avatar_url
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def update_user(db: Session, db_user: User, user_update: UserUpdate):
    update_data = user_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_user, key, value)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def set_approval_status(db: Session, db_user: User, is_approved: bool, request_status: str):
    db_user.is_approved = is_approved
    db_user.request_status = request_status
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user
