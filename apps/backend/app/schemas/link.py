from pydantic import BaseModel, HttpUrl
from typing import Optional
from datetime import datetime

from pydantic import BaseModel, HttpUrl, field_validator

class LinkBase(BaseModel):
    original_url: str
    short_code: Optional[str] = None # Optional on creation, can be auto-generated
    is_active: Optional[bool] = True
    require_login: Optional[bool] = False
    allowed_emails: Optional[str] = None # JSON string
    expires_at: Optional[datetime] = None

class LinkCreate(LinkBase):
    password: Optional[str] = None

    @field_validator('password')
    @classmethod
    def password_max_length(cls, v: Optional[str]) -> Optional[str]:
        if v and len(v.encode('utf-8')) > 72:
            raise ValueError('Password must be 72 bytes or less')
        return v

class LinkUpdate(LinkBase):
    password: Optional[str] = None # If provided, updates the hash

    @field_validator('password')
    @classmethod
    def password_max_length(cls, v: Optional[str]) -> Optional[str]:
        if v and len(v.encode('utf-8')) > 72:
            raise ValueError('Password must be 72 bytes or less')
        return v

class Link(LinkBase):
    id: int
    short_code: str
    owner_id: int
    clicks: int
    created_at: datetime
    # We don't return password_hash

    class Config:
        from_attributes = True
