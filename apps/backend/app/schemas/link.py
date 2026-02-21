from pydantic import BaseModel, HttpUrl
from typing import Optional
from datetime import datetime

from pydantic import BaseModel, HttpUrl, field_validator

class LinkBase(BaseModel):
    original_url: str
    short_code: Optional[str] = None # Optional on creation, can be auto-generated
    title: Optional[str] = None
    tags: Optional[str] = None
    redirect_type: Optional[int] = 302
    campaign_id: Optional[int] = None
    is_active: Optional[bool] = True
    track_activity: Optional[bool] = True
    require_login: Optional[bool] = False
    allowed_emails: Optional[str] = None # JSON string
    expires_at: Optional[datetime] = None
    is_deleted: Optional[bool] = False
    # UTM Parameters
    utm_source: Optional[str] = None
    utm_medium: Optional[str] = None
    utm_campaign: Optional[str] = None
    utm_term: Optional[str] = None
    utm_content: Optional[str] = None

class LinkCreate(LinkBase):
    password: Optional[str] = None

    @field_validator('password')
    @classmethod
    def password_max_length(cls, v: Optional[str]) -> Optional[str]:
        if v and len(v.encode('utf-8')) > 72:
            raise ValueError('Password must be 72 bytes or less')
        return v

    @field_validator('short_code')
    @classmethod
    def validate_short_code(cls, v: Optional[str]) -> Optional[str]:
        if v and v.endswith("+"):
             raise ValueError("Short code cannot end with '+'")
        return v

class LinkUpdate(LinkBase):
    password: Optional[str] = None # If provided, updates the hash

    @field_validator('password')
    @classmethod
    def password_max_length(cls, v: Optional[str]) -> Optional[str]:
        if v and len(v.encode('utf-8')) > 72:
            raise ValueError('Password must be 72 bytes or less')
        return v

    @field_validator('short_code')
    @classmethod
    def validate_short_code(cls, v: Optional[str]) -> Optional[str]:
        if v and v.endswith("+"):
             raise ValueError("Short code cannot end with '+'")
        return v

class LinkBulkUpdate(BaseModel):
    link_ids: list[int]
    campaign_id: Optional[int] = None
    is_active: Optional[bool] = None
    tags: Optional[str] = None
    require_login: Optional[bool] = None
    password: Optional[str] = None
    redirect_type: Optional[int] = None
    track_activity: Optional[bool] = None
    expires_at: Optional[datetime] = None
    # UTM Parameters
    utm_source: Optional[str] = None
    utm_medium: Optional[str] = None
    utm_campaign: Optional[str] = None
    utm_term: Optional[str] = None
    utm_content: Optional[str] = None
    
    # We use a special value to indicate "clear this field" if needed, 
    # but for simplicity in this version, purely optional means "don't update if null".
    # To clear a campaign, the frontend can send campaign_id=-1 or similar, handled in CRUD.
    # For now, we'll assume explicit values update, None means "no change".

class Link(LinkBase):
    id: int
    short_code: str
    owner_id: int
    org_id: Optional[int] = None
    clicks: int
    created_at: datetime
    title: Optional[str] = None
    tags: Optional[str] = None
    redirect_type: Optional[int] = 302
    campaign_id: Optional[int] = None
    # We don't return password_hash

    # Analytics Data (Optional, populated in stats endpoint)
    clicks_over_time: Optional[list] = None
    top_countries: Optional[list] = None
    top_referrers: Optional[list] = None
    device_breakdown: Optional[list] = None

    class Config:
        from_attributes = True
