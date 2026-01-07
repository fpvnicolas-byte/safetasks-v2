from sqlalchemy import Column, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base


class ProductionItem(Base):
    __tablename__ = "production_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    production_id: Mapped[int] = mapped_column(Integer, ForeignKey("productions.id", ondelete="CASCADE"), nullable=False)
    service_id: Mapped[int] = mapped_column(Integer, ForeignKey("services.id", ondelete="SET NULL"), nullable=True)  # Historical reference
    name: Mapped[str] = mapped_column(String, nullable=False)
    quantity: Mapped[float] = mapped_column(Float, default=1.0)
    unit_price: Mapped[int] = mapped_column(Integer, nullable=False)  # In cents
    total_price: Mapped[int] = mapped_column(Integer, nullable=False)  # quantity * unit_price in cents

    # Relationships
    production = relationship("Production", back_populates="items")
    service = relationship("Service")  # Optional: for historical reference
