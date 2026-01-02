from pydantic import BaseModel, Field


class ExpenseCreate(BaseModel):
    name: str
    value: int = Field(..., gt=0, description="Expense value must be greater than 0")  # In cents
    category: str | None = None
    paid_by: str | None = None


class ExpenseResponse(BaseModel):
    id: int
    production_id: int
    name: str
    value: int  # In cents
    category: str | None
    paid_by: str | None

    class Config:
        from_attributes = True
