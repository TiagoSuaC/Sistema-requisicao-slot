from pydantic import BaseModel, field_validator
from datetime import date, datetime
from typing import Optional, List
from ..models.macro_period import MacroPeriodStatus, Priority
from .selection import MacroPeriodSelection, MacroPeriodSelectionCreate
from .audit import AuditEvent


class MacroPeriodBase(BaseModel):
    unit_id: int
    doctor_id: int
    start_date: date
    end_date: date
    suggested_surgery_min: Optional[int] = None
    suggested_surgery_max: Optional[int] = None
    suggested_consult_min: Optional[int] = None
    suggested_consult_max: Optional[int] = None
    priority: Optional[Priority] = Priority.NORMAL
    deadline: Optional[date] = None

    @field_validator('end_date')
    @classmethod
    def validate_dates(cls, v, info):
        if 'start_date' in info.data and v < info.data['start_date']:
            raise ValueError('end_date must be after start_date')
        return v


class MacroPeriodCreate(MacroPeriodBase):
    pass


class MacroPeriodResponse(MacroPeriodBase):
    id: int
    status: MacroPeriodStatus
    priority: Priority
    deadline: Optional[date] = None
    public_token: str
    created_at: datetime
    created_by: str
    responded_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class MacroPeriodDetail(MacroPeriodResponse):
    selections: List[MacroPeriodSelection] = []
    audit_events: List[AuditEvent] = []

    class Config:
        from_attributes = True


class MacroPeriodListItem(BaseModel):
    id: int
    unit_name: str
    unit_city: str
    doctor_name: str
    start_date: date
    end_date: date
    status: MacroPeriodStatus
    priority: Priority
    deadline: Optional[date] = None
    public_token: str
    dias_em_aberto: Optional[int] = None
    tempo_ate_resposta: Optional[int] = None
    created_at: datetime
    responded_at: Optional[datetime] = None


class MacroPeriodPublicView(BaseModel):
    id: int
    unit_name: str
    unit_city: str
    doctor_name: str
    start_date: date
    end_date: date
    status: MacroPeriodStatus
    suggested_surgery_min: Optional[int] = None
    suggested_surgery_max: Optional[int] = None
    suggested_consult_min: Optional[int] = None
    suggested_consult_max: Optional[int] = None
    config_turnos: dict
    selections: List[MacroPeriodSelection] = []
    can_edit: bool


class DoctorResponseSubmit(BaseModel):
    selections: List[MacroPeriodSelectionCreate]
