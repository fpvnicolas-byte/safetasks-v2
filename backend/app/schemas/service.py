from pydantic import BaseModel, ConfigDict


class ServiceCreate(BaseModel):
    name: str
    description: str | None = None
    default_price: int  # In cents
    unit: str | None = None


class ServiceResponse(BaseModel):
    id: int
    name: str
    description: str | None
    default_price: int  # In cents
    unit: str | None
    organization_id: int

    model_config = ConfigDict(from_attributes=True)


class ServiceCrewRead(BaseModel):
    """Service schema for crew members - omits financial fields"""
    id: int
    name: str
    description: str | None
    unit: str | None
    organization_id: int

    model_config = ConfigDict(from_attributes=True)
