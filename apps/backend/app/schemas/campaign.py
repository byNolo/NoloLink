from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime

class CampaignBase(BaseModel):
    name: str
    color: Optional[str] = None

class CampaignCreate(CampaignBase):
    pass

class CampaignUpdate(CampaignBase):
    name: Optional[str] = None
    color: Optional[str] = None

class Campaign(CampaignBase):
    id: int
    owner_id: int
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)
