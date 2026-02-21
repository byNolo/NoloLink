from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base
import secrets


class Organization(Base):
    __tablename__ = "organizations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    slug = Column(String, unique=True, index=True, nullable=False)
    plan = Column(String, default="free")  # free | pro | enterprise
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    memberships = relationship("OrgMembership", back_populates="organization", cascade="all, delete-orphan")
    invites = relationship("OrgInvite", back_populates="organization", cascade="all, delete-orphan")
    links = relationship("Link", back_populates="organization")
    campaigns = relationship("Campaign", back_populates="organization")


class OrgMembership(Base):
    __tablename__ = "org_memberships"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    org_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)
    role = Column(String, nullable=False, default="member")  # owner | admin | member
    joined_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", backref="memberships")
    organization = relationship("Organization", back_populates="memberships")


class OrgInvite(Base):
    __tablename__ = "org_invites"

    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)
    invited_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    email = Column(String, nullable=False)
    role = Column(String, nullable=False, default="member")  # admin | member
    token = Column(String, unique=True, index=True, nullable=False, default=lambda: secrets.token_urlsafe(32))
    status = Column(String, default="pending")  # pending | accepted | expired
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    organization = relationship("Organization", back_populates="invites")
    inviter = relationship("User", backref="sent_invites")
