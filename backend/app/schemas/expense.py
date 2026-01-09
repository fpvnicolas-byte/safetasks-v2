from pydantic import BaseModel, ConfigDict, Field


class ExpenseCreate(BaseModel):
    name: str
    value: int = Field(..., description="Expense value in cents")
    category: str | None = None
    paid_by: str | None = None


class ExpenseResponse(BaseModel):
    id: int
    production_id: int
    name: str
    value: int  # In cents
    category: str | None
    paid_by: str | None

    model_config = ConfigDict(from_attributes=True)
