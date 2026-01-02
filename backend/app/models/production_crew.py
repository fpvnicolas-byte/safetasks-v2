from sqlalchemy import Column, ForeignKey, Integer, String
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base


class ProductionCrew(Base):
    __tablename__ = "production_crew"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    production_id: Mapped[int] = mapped_column(Integer, ForeignKey("productions.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    role: Mapped[str] = mapped_column(String, nullable=False)  # e.g., "cameraman", "director", "editor"
    fee: Mapped[int] = mapped_column(Integer, nullable=False)  # Fee in cents, must be > 0

    # Relationships
    production = relationship("Production", back_populates="crew")
    user = relationship("User", back_populates="crew_assignments", lazy="selectin")

    @hybrid_property
    def full_name(self):
        """Get the full name from the related user."""
        return self.user.full_name if self.user else None

    __table_args__ = (
        {'schema': None}
    )
