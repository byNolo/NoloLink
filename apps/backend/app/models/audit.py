from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    org_id = Column(Integer, ForeignKey("organizations.id"), nullable=True, index=True)
    action = Column(String, nullable=False, index=True)  # create, update, delete, disable, enable
    target_type = Column(String, nullable=False)  # link, campaign
    target_id = Column(Integer, nullable=False)
    details = Column(String, nullable=True)  # JSON string of changed fields
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    # Relationships
    user = relationship("User", backref="audit_logs")
