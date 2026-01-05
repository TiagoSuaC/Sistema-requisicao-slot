from sqlalchemy import Column, Integer, String, JSON
from sqlalchemy.orm import relationship
from ..database import Base


class Unit(Base):
    __tablename__ = "units"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    city = Column(String, nullable=False)
    config_turnos = Column(JSON, nullable=False, default={
        "morning": {"start": "08:00", "end": "12:00"},
        "afternoon": {"start": "13:00", "end": "17:00"}
    })

    # Relationships
    macro_periods = relationship("MacroPeriod", back_populates="unit")
