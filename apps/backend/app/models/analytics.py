from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base

class ClickEvent(Base):
    __tablename__ = "click_events"

    id = Column(Integer, primary_key=True, index=True)
    link_id = Column(Integer, ForeignKey("links.id"), nullable=False, index=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    
    # Analytics Data
    ip_address = Column(String, nullable=True)
    country_code = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)
    referrer = Column(String, nullable=True)
    
    # Derived Data (can be filled by background task or on-the-fly)
    device_type = Column(String, nullable=True) # mobile, tablet, desktop
    browser = Column(String, nullable=True)
    os = Column(String, nullable=True)

    # Relationships
    link = relationship("Link", back_populates="events")
