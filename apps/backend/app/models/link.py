from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base

class Link(Base):
    __tablename__ = "links"

    id = Column(Integer, primary_key=True, index=True)
    short_code = Column(String, unique=True, index=True, nullable=False)
    original_url = Column(String, nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    is_active = Column(Boolean, default=True)
    is_deleted = Column(Boolean, default=False)
    track_activity = Column(Boolean, default=True) # New: Enable/Disable detailed tracking
    
    # New Features
    title = Column(String, nullable=True)
    tags = Column(String, nullable=True) # JSON list of tags
    redirect_type = Column(Integer, default=302)

    clicks = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Access Control
    password_hash = Column(String, nullable=True)
    require_login = Column(Boolean, default=False)
    allowed_emails = Column(String, nullable=True)  # JSON list of emails
    expires_at = Column(DateTime(timezone=True), nullable=True)



    # Relationships
    owner = relationship("User", backref="links") # simplistic backref
    events = relationship("ClickEvent", back_populates="link", cascade="all, delete-orphan")
