from pydantic import BaseModel, ConfigDict, EmailStr


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    organization_name: str
    supabase_user_id: str | None = None  # Optional field for Supabase integration

    model_config = ConfigDict(extra="forbid")  # Explicitly forbid extra fields for security


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

    model_config = ConfigDict(from_attributes=True)


class UserLogin(BaseModel):
    username: str  # email
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str
