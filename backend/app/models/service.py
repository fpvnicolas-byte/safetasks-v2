from sqlalchemy import Column, Integer, String, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base


class Service(Base):
    __tablename__ = "services"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    default_price: Mapped[int] = mapped_column(Integer, nullable=False)  # In cents
    unit: Mapped[str] = mapped_column(String, nullable=True)  # e.g., "diária", "hora", "projeto"
    organization_id: Mapped[int] = mapped_column(Integer, ForeignKey("organizations.id"), nullable=False)

    # Relationship
    organization = relationship("Organization", back_populates="services")
