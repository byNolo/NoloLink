from sqlalchemy import Column, Integer, String, Boolean
from app.db.base import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    keyn_id = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    username = Column(String)
    full_name = Column(String)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    is_approved = Column(Boolean, default=False)
    request_status = Column(String, default="none") # none, pending, approved, rejected
    avatar_url = Column(String, nullable=True)
