from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    organization_name: str


class UserInvite(BaseModel):
    """Schema for inviting crew members (created by owners)"""
    email: EmailStr
    password: str
    full_name: str
    role: str = "crew"  # Default to crew role


class UserResponse(BaseModel):
    id: int
    email: EmailStr
    full_name: str
    organization_id: int
    role: str
    is_active: bool

    class Config:
        from_attributes = True


class UserLogin(BaseModel):
    username: str  # email
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str
