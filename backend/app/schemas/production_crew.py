from pydantic import BaseModel, ConfigDict, Field


class ProductionCrewCreate(BaseModel):
    user_id: str
    role: str
    fee: int = Field(..., description="Fee in cents")  # In cents


class ProductionCrewResponse(BaseModel):
    id: int
    production_id: int
    user_id: str
    role: str
    fee: int  # In cents
    full_name: str | None = None  # Add full_name field

    model_config = ConfigDict(from_attributes=True)


class ProductionCrewMember(BaseModel):
    """Schema for showing crew member info to team members (shows only their own fee)"""
    id: int
    user_id: str
    full_name: str | None = None  # Allow None if user relationship not loaded
    role: str
    fee: int | None = None  # Only show fee if it's the current user's assignment

    model_config = ConfigDict(from_attributes=True)


class ProductionCrewMemberRestricted(BaseModel):
    """Schema for crew members - shows only their own information"""
    full_name: str | None = None
    role: str
    fee: int | None = None  # Only their own fee

    model_config = ConfigDict(from_attributes=True)
