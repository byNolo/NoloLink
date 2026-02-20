from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime


class AuditLogBase(BaseModel):
    action: str
    target_type: str
    target_id: int
    details: Optional[str] = None


class AuditLog(AuditLogBase):
    id: int
    user_id: int
    timestamp: datetime
    username: Optional[str] = None  # Populated in the endpoint

    model_config = ConfigDict(from_attributes=True)
