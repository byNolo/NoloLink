from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


# --- Organization ---
class OrgCreate(BaseModel):
    name: str


class OrgUpdate(BaseModel):
    name: Optional[str] = None


class Organization(BaseModel):
    id: int
    name: str
    slug: str
    plan: str
    is_active: bool
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# --- Membership ---
class MembershipResponse(BaseModel):
    id: int
    user_id: int
    org_id: int
    role: str
    joined_at: Optional[datetime] = None
    # Denormalized user info for display
    email: Optional[str] = None
    username: Optional[str] = None
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None

    class Config:
        from_attributes = True


class RoleUpdate(BaseModel):
    role: str  # admin | member


# --- Invite ---
class InviteCreate(BaseModel):
    email: str
    role: str = "member"  # admin | member


class InviteResponse(BaseModel):
    id: int
    org_id: int
    email: str
    role: str
    status: str
    created_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class InviteAccept(BaseModel):
    token: str
