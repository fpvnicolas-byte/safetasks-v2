from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.db.base_class import Base


class Organization(Base):
    __tablename__ = "organizations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    cnpj: Mapped[str] = mapped_column(String, nullable=True)
    phone: Mapped[str] = mapped_column(String, nullable=True)
    email: Mapped[str] = mapped_column(String, nullable=True)
    address: Mapped[str] = mapped_column(String, nullable=True)
    default_tax_rate: Mapped[float] = mapped_column(Float, default=0.0)
    created_at: Mapped[DateTime] = mapped_column(DateTime, default=func.now())

    # Subscription Management
    subscription_plan: Mapped[str] = mapped_column(String, default="free")
    subscription_status: Mapped[str] = mapped_column(String, default="trialing")
    trial_ends_at: Mapped[DateTime] = mapped_column(DateTime, nullable=True)
    subscription_ends_at: Mapped[DateTime] = mapped_column(DateTime, nullable=True)
    billing_id: Mapped[str] = mapped_column(String, nullable=True) # e.g., Stripe Customer ID

    # Relationships
    users = relationship("User", back_populates="organization")
    clients = relationship("Client", back_populates="organization")
    services = relationship("Service", back_populates="organization")
    productions = relationship("Production", back_populates="organization")


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String, nullable=False)
    full_name: Mapped[str] = mapped_column(String, nullable=True)
    organization_id: Mapped[int] = mapped_column(Integer, ForeignKey("organizations.id"), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    role: Mapped[str] = mapped_column(String, default="user")

    # Relationships
    organization = relationship("Organization", back_populates="users")
    crew_assignments = relationship("ProductionCrew", back_populates="user", cascade="all, delete-orphan")
