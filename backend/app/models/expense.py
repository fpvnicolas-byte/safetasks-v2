from sqlalchemy import Column, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base


class Expense(Base):
    __tablename__ = "expenses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    production_id: Mapped[int] = mapped_column(Integer, ForeignKey("productions.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    value: Mapped[int] = mapped_column(Integer, nullable=False)  # In cents
    category: Mapped[str] = mapped_column(String, nullable=True)  # e.g., "equipment", "labor", "travel"
    paid_by: Mapped[str] = mapped_column(String, nullable=True)  # e.g., "company", "freelancer"

    # Relationship
    production = relationship("Production", back_populates="expenses")
