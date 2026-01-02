from datetime import datetime
from pydantic import BaseModel
from typing import Optional


class OrganizationUpdate(BaseModel):
    cnpj: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    default_tax_rate: Optional[float] = None


class OrganizationResponse(BaseModel):
    id: int
    name: str
    cnpj: Optional[str]
    phone: Optional[str]
    email: Optional[str]
    address: Optional[str]
    default_tax_rate: float
    created_at: datetime

    class Config:
        from_attributes = True
