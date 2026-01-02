from enum import Enum
from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.db.base_class import Base


class ProductionStatus(str, Enum):
    DRAFT = "draft"
    PROPOSAL_SENT = "proposal_sent"
    APPROVED = "approved"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELED = "canceled"


class Production(Base):
    __tablename__ = "productions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String, nullable=False)
    organization_id: Mapped[int] = mapped_column(Integer, ForeignKey("organizations.id"), nullable=False)
    client_id: Mapped[int] = mapped_column(Integer, ForeignKey("clients.id"), nullable=True)
    status: Mapped[ProductionStatus] = mapped_column(String, default=ProductionStatus.DRAFT)
    deadline: Mapped[DateTime] = mapped_column(DateTime, nullable=True)
    priority: Mapped[str] = mapped_column(String, nullable=True)  # Priority level (high, medium, low)
    locations: Mapped[str] = mapped_column(String, nullable=True)  # JSON string with filming locations
    filming_dates: Mapped[str] = mapped_column(String, nullable=True)  # JSON string with filming dates
    created_at: Mapped[DateTime] = mapped_column(DateTime, default=func.now())
    updated_at: Mapped[DateTime] = mapped_column(DateTime, default=func.now(), onupdate=func.now())

    # Financial fields
    subtotal: Mapped[int] = mapped_column(Integer, default=0)  # Sum of all items in cents
    discount: Mapped[int] = mapped_column(Integer, default=0)  # Discount in cents
    tax_rate: Mapped[float] = mapped_column(Float, default=0.0)  # Tax rate (e.g., 10.5 for 10.5%)
    tax_amount: Mapped[int] = mapped_column(Integer, default=0)  # Calculated tax amount in cents
    total_value: Mapped[int] = mapped_column(Integer, default=0)  # Final total in cents
    total_cost: Mapped[int] = mapped_column(Integer, default=0)  # Sum of all expenses in cents
    profit: Mapped[int] = mapped_column(Integer, default=0)  # total_value - total_cost in cents

    # Payment fields
    payment_method: Mapped[str] = mapped_column(String, nullable=True)  # PIX, Crédito, Débito, Link, Crypto, Boleto
    payment_status: Mapped[str] = mapped_column(String, default="pending")  # pending, paid, overdue
    due_date: Mapped[DateTime] = mapped_column(DateTime, nullable=True)  # Payment due date

    # Notes field for additional information
    notes: Mapped[str] = mapped_column(String, nullable=True)  # Additional notes about the production

    # Relationships with eager loading
    organization = relationship("Organization", back_populates="productions")
    client = relationship("Client", back_populates="productions")
    items = relationship("ProductionItem", back_populates="production", cascade="all, delete-orphan", lazy="selectin")
    expenses = relationship("Expense", back_populates="production", cascade="all, delete-orphan", lazy="selectin")
    crew = relationship("ProductionCrew", back_populates="production", cascade="all, delete-orphan", lazy="selectin")
