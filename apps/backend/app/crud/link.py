from sqlalchemy.orm import Session
from app.models.link import Link
from app.schemas.link import LinkCreate, LinkUpdate
import shortuuid
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_link(db: Session, link_id: int):
    return db.query(Link).filter(Link.id == link_id).first()

def get_link_by_code(db: Session, short_code: str):
    return db.query(Link).filter(Link.short_code == short_code).first()

def get_links_by_owner(db: Session, owner_id: int, skip: int = 0, limit: int = 100):
    return db.query(Link).filter(Link.owner_id == owner_id).offset(skip).limit(limit).all()

def create_link(db: Session, link: LinkCreate, owner_id: int):
    code = link.short_code
    if code:
        # Check if code exists
        if get_link_by_code(db, code):
            return None # Indicate collision
    else:
        # Generate a short code if not provided
        code = shortuuid.ShortUUID().random(length=7)
        # Simple collision check for generated codes (rare but possible)
        while get_link_by_code(db, code):
             code = shortuuid.ShortUUID().random(length=7)
    
    # Hash password if provided
    password_hash = None
    if link.password:
        password_hash = pwd_context.hash(link.password)

    db_link = Link(
        short_code=code,
        original_url=str(link.original_url),
        owner_id=owner_id,
        is_active=link.is_active,
        require_login=link.require_login,
        allowed_emails=link.allowed_emails,
        password_hash=password_hash
    )
    db.add(db_link)
    db.commit()
    db.refresh(db_link)
    return db_link

def update_link(db: Session, db_link: Link, link_update: LinkUpdate):
    # If updating short_code, check collision
    if link_update.short_code and link_update.short_code != db_link.short_code:
        if get_link_by_code(db, link_update.short_code):
            return None # Collision

    if link_update.short_code:
        db_link.short_code = link_update.short_code
    
    db_link.original_url = str(link_update.original_url)
    db_link.is_active = link_update.is_active
    db_link.require_login = link_update.require_login
    db_link.allowed_emails = link_update.allowed_emails
    
    if link_update.password is not None:
        if link_update.password == "":
            db_link.password_hash = None
        else:
            db_link.password_hash = pwd_context.hash(link_update.password)
    
    db.add(db_link)
    db.commit()
    db.refresh(db_link)
    return db_link

def delete_link(db: Session, db_link: Link):
    db.delete(db_link)
    db.commit()

def increment_clicks(db: Session, db_link: Link):
    db_link.clicks += 1
    db.add(db_link)
    db.commit()
