from sqlalchemy import Column, Integer, String, Date, Time, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
import enum
from ..database import Base


class PartOfDay(str, enum.Enum):
    MORNING = "MORNING"
    AFTERNOON = "AFTERNOON"
    FULL_DAY = "FULL_DAY"
    CUSTOM = "CUSTOM"


class MacroPeriodSelection(Base):
    __tablename__ = "macro_period_selections"

    id = Column(Integer, primary_key=True, index=True)
    macro_period_id = Column(Integer, ForeignKey("macro_periods.id"), nullable=False, index=True)
    macro_period_unit_id = Column(Integer, ForeignKey("macro_period_units.id"), nullable=True, index=True)
    date = Column(Date, nullable=False)
    part_of_day = Column(SQLEnum(PartOfDay), nullable=False)
    custom_start = Column(Time, nullable=True)
    custom_end = Column(Time, nullable=True)
    block_id = Column(String, nullable=True, index=True)

    # Relationships
    macro_period = relationship("MacroPeriod", back_populates="selections")
    macro_period_unit = relationship("MacroPeriodUnit", back_populates="selections")
