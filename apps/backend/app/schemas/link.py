from pydantic import BaseModel, HttpUrl
from typing import Optional
from datetime import datetime

class LinkBase(BaseModel):
    original_url: str
    short_code: Optional[str] = None # Optional on creation, can be auto-generated
    is_active: Optional[bool] = True

class LinkCreate(LinkBase):
    pass

class LinkUpdate(LinkBase):
    pass

class Link(LinkBase):
    id: int
    short_code: str
    owner_id: int
    clicks: int
    created_at: datetime

    class Config:
        from_attributes = True
