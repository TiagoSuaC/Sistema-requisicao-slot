from sqlalchemy import Column, Integer, ForeignKey, CheckConstraint
from sqlalchemy.orm import relationship
from ..database import Base


class MacroPeriodUnit(Base):
    __tablename__ = "macro_period_units"

    id = Column(Integer, primary_key=True, index=True)
    macro_period_id = Column(Integer, ForeignKey("macro_periods.id", ondelete="CASCADE"), nullable=False, index=True)
    unit_id = Column(Integer, ForeignKey("units.id"), nullable=False)
    total_days = Column(Integer, nullable=False, default=0)
    order_position = Column(Integer, nullable=True)

    # Add constraint to ensure total_days is positive
    __table_args__ = (
        CheckConstraint('total_days > 0', name='check_total_days_positive'),
    )

    # Relationships
    macro_period = relationship("MacroPeriod", back_populates="units")
    unit = relationship("Unit")
    selections = relationship("MacroPeriodSelection", back_populates="macro_period_unit", cascade="all, delete-orphan")
