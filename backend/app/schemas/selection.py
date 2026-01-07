from pydantic import BaseModel, field_validator
from datetime import date, time
from typing import Optional
from ..models.selection import PartOfDay


class MacroPeriodSelectionBase(BaseModel):
    date: date
    part_of_day: PartOfDay
    custom_start: Optional[time] = None
    custom_end: Optional[time] = None

    @field_validator('custom_start', 'custom_end', mode='before')
    @classmethod
    def validate_custom_times(cls, v):
        # Accept both time objects and string representations
        if v is None or v == '':
            return None
        if isinstance(v, str):
            # Parse "HH:MM" format
            try:
                hours, minutes = v.split(':')
                return time(int(hours), int(minutes))
            except:
                return None
        return v


class MacroPeriodSelectionCreate(MacroPeriodSelectionBase):
    macro_period_unit_id: int
    block_id: Optional[str] = None


class MacroPeriodSelection(MacroPeriodSelectionBase):
    id: int
    macro_period_id: int
    macro_period_unit_id: Optional[int] = None
    block_id: Optional[str] = None

    class Config:
        from_attributes = True
