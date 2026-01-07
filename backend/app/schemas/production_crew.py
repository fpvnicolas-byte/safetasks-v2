from pydantic import BaseModel, Field


class ProductionCrewCreate(BaseModel):
    user_id: int
    role: str
    fee: int = Field(..., gt=0, description="Fee must be greater than 0")  # In cents


class ProductionCrewResponse(BaseModel):
    id: int
    production_id: int
    user_id: int
    role: str
    fee: int  # In cents
    full_name: str | None = None  # Add full_name field

    class Config:
        from_attributes = True
        orm_mode = True


class ProductionCrewMember(BaseModel):
    """Schema for showing crew member info to team members (shows only their own fee)"""
    id: int
    user_id: int
    full_name: str | None = None  # Allow None if user relationship not loaded
    role: str
    fee: int | None = None  # Only show fee if it's the current user's assignment

    class Config:
        from_attributes = True


class ProductionCrewMemberRestricted(BaseModel):
    """Schema for crew members - shows only their own information"""
    full_name: str | None = None
    role: str
    fee: int | None = None  # Only their own fee

    class Config:
        from_attributes = True
