from pydantic import BaseModel, field_validator
from typing import Optional


class MacroPeriodUnitCreate(BaseModel):
    unit_id: int
    total_days: int

    @field_validator('total_days')
    @classmethod
    def validate_positive(cls, v):
        if v <= 0:
            raise ValueError('total_days deve ser maior que 0')
        return v


class MacroPeriodUnitResponse(BaseModel):
    id: int
    macro_period_id: int
    unit_id: int
    unit_name: str
    unit_city: str
    total_days: int
    order_position: Optional[int] = None
    config_turnos: dict

    class Config:
        from_attributes = True
