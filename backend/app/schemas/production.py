from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field, field_validator  # type: ignore

from app.core.utils import make_datetime_naive
from app.models.production import ProductionStatus
from app.schemas.client import ClientResponse
from app.schemas.expense import ExpenseResponse
from app.schemas.production_crew import ProductionCrewResponse, ProductionCrewMember, ProductionCrewMemberRestricted
from app.schemas.production_item import ProductionItemResponse, ProductionItemCrewResponse


class ProductionCreate(BaseModel):
    title: str
    client_id: Optional[int] = None
    status: Optional[ProductionStatus] = ProductionStatus.DRAFT
    deadline: Optional[datetime] = None
    shooting_sessions: Optional[List[dict]] = None
    payment_method: Optional[str] = None
    due_date: Optional[datetime] = None
    notes: Optional[str] = None

    @field_validator('deadline', 'due_date', mode='before')
    @classmethod
    def validate_dates(cls, v):
        return make_datetime_naive(v)


class ProductionUpdate(BaseModel):
    title: Optional[str] = None
    client_id: Optional[int] = None
    status: Optional[ProductionStatus] = None
    deadline: Optional[datetime] = None
    shooting_sessions: Optional[List[dict]] = None
    priority: Optional[str] = None
    subtotal: Optional[int] = Field(None, ge=0, description="Subtotal in cents, must be >= 0")
    total_cost: Optional[int] = Field(None, ge=0, description="Total cost in cents, must be >= 0")
    total_value: Optional[int] = Field(None, ge=0, description="Total value in cents, must be >= 0")
    discount: Optional[int] = Field(None, ge=0, description="Discount in cents, must be >= 0")
    tax_rate: Optional[float] = Field(None, ge=0, le=100, description="Tax rate as percentage (0-100)")
    payment_method: Optional[str] = None
    payment_status: Optional[str] = None
    due_date: Optional[datetime] = None
    notes: Optional[str] = None

    @field_validator('deadline', 'due_date', mode='before')
    @classmethod
    def validate_dates(cls, v):
        return make_datetime_naive(v)
    
    @field_validator('tax_rate')
    @classmethod
    def validate_tax_rate_range(cls, v):
        """Validate tax rate is within 0-100 range."""
        if v is not None and (v < 0 or v > 100):
            raise ValueError(f"Tax rate must be between 0 and 100, got {v}")
        return v


class ProductionResponse(BaseModel):
    id: int
    title: str
    organization_id: int
    client_id: Optional[int] = None
    client: Optional[ClientResponse] = None
    status: ProductionStatus
    deadline: Optional[datetime] = None
    shooting_sessions: Optional[List[dict]] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    # Payment fields
    payment_method: Optional[str] = None
    payment_status: str = "pending"
    due_date: Optional[datetime] = None

    # Financial fields
    subtotal: int = 0
    discount: int = 0
    tax_rate: float = 0.0
    tax_amount: int = 0
    total_value: int = 0
    total_cost: int = 0
    profit: int = 0

    # Related items
    items: List[ProductionItemResponse] = []
    expenses: List[ExpenseResponse] = []
    crew: List[ProductionCrewResponse] = []

    class Config:
        from_attributes = True


class ProductionCrewResponse(BaseModel):
    """Schema for crew members - omits financial fields entirely"""
    id: int
    title: str
    status: ProductionStatus
    deadline: Optional[datetime] = None
    locations: Optional[str] = None
    filming_dates: Optional[str] = None
    created_at: datetime

    # Payment fields - crew can see payment status and due date
    payment_status: str = "pending"
    due_date: Optional[datetime] = None

    # Related items - financial fields explicitly omitted
    # Items without pricing information
    items: List[ProductionItemCrewResponse] = []
    # expenses field COMPLETELY REMOVED for crew
    # Only their own crew information
    crew: List[ProductionCrewMemberRestricted] = []

    class Config:
        from_attributes = True
