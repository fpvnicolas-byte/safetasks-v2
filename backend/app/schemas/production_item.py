from pydantic import BaseModel, ConfigDict, Field


class ProductionItemCreate(BaseModel):
    # Either link to existing service OR provide manual details
    service_id: int | None = None
    name: str | None = None
    quantity: float = Field(1.0, description="Quantity")
    unit_price: int | None = Field(None, description="Unit price in cents")  # In cents


class ProductionItemResponse(BaseModel):
    id: int
    production_id: int
    name: str
    quantity: float
    unit_price: int  # In cents
    total_price: int  # In cents

    model_config = ConfigDict(from_attributes=True)


class ProductionItemCrewResponse(BaseModel):
    """Schema for crew members - hides pricing information"""
    id: int
    production_id: int
    name: str
    quantity: float
    # unit_price and total_price explicitly omitted for crew privacy

    model_config = ConfigDict(from_attributes=True)
