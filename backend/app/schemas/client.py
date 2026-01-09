from pydantic import BaseModel, ConfigDict, EmailStr
from datetime import datetime


class ClientCreate(BaseModel):
    full_name: str
    email: EmailStr | None = None
    cnpj: str | None = None
    address: str | None = None
    phone: str | None = None


class ClientResponse(BaseModel):
    id: int
    full_name: str
    email: EmailStr | None
    cnpj: str | None
    address: str | None
    phone: str | None
    organization_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
