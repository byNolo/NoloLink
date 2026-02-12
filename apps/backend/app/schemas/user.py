from pydantic import BaseModel, EmailStr
from typing import Optional

class UserBase(BaseModel):
    email: Optional[EmailStr] = None
    username: Optional[str] = None
    full_name: Optional[str] = None
    keyn_id: Optional[str] = None
    avatar_url: Optional[str] = None
    is_approved: bool = False
    request_status: str = "none"

class UserCreate(UserBase):
    keyn_id: str
    email: EmailStr

class UserUpdate(UserBase):
    pass

class User(UserBase):
    id: int
    is_active: bool
    is_superuser: bool
    is_approved: bool
    request_status: str

    class Config:
        from_attributes = True
