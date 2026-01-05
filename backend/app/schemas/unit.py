from pydantic import BaseModel
from typing import Optional


class UnitBase(BaseModel):
    name: str
    city: str
    config_turnos: Optional[dict] = {
        "morning": {"start": "08:00", "end": "12:00"},
        "afternoon": {"start": "13:00", "end": "17:00"}
    }


class UnitCreate(UnitBase):
    pass


class UnitUpdate(UnitBase):
    name: Optional[str] = None
    city: Optional[str] = None


class Unit(UnitBase):
    id: int

    class Config:
        from_attributes = True
