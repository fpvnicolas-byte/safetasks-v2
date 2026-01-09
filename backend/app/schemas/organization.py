from datetime import datetime
from pydantic import BaseModel, ConfigDict
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
    subscription_plan: str
    subscription_status: str
    trial_ends_at: Optional[datetime]
    subscription_ends_at: Optional[datetime]
    billing_id: Optional[str]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
