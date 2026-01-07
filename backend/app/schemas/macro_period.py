from pydantic import BaseModel, field_validator
from datetime import date, datetime
from typing import Optional, List
from ..models.macro_period import MacroPeriodStatus, Priority
from .selection import MacroPeriodSelection, MacroPeriodSelectionCreate
from .audit import AuditEvent
from .macro_period_unit import MacroPeriodUnitCreate, MacroPeriodUnitResponse


class MacroPeriodBase(BaseModel):
    doctor_id: int
    start_date: date
    end_date: date
    priority: Optional[Priority] = Priority.NORMAL
    deadline: Optional[date] = None

    @field_validator('end_date')
    @classmethod
    def validate_dates(cls, v, info):
        if 'start_date' in info.data and v < info.data['start_date']:
            raise ValueError('end_date must be after start_date')
        return v


class MacroPeriodCreate(MacroPeriodBase):
    units: List[MacroPeriodUnitCreate]

    @field_validator('units')
    @classmethod
    def validate_units(cls, v):
        if len(v) < 1:
            raise ValueError('Pelo menos 1 unidade é obrigatória')
        return v


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
    units: List[MacroPeriodUnitResponse] = []
    selections: List[MacroPeriodSelection] = []
    audit_events: List[AuditEvent] = []

    class Config:
        from_attributes = True


class MacroPeriodListItem(BaseModel):
    id: int
    doctor_name: str
    units: List[dict] = []  # Simple dict for list view: [{unit_name, unit_city, surgery_days, consult_days}]
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
    doctor_name: str
    start_date: date
    end_date: date
    status: MacroPeriodStatus
    units: List[MacroPeriodUnitResponse] = []
    selections: List[MacroPeriodSelection] = []
    can_edit: bool


class DoctorResponseSubmit(BaseModel):
    selections: List[MacroPeriodSelectionCreate]
    confirm: bool = False  # If False, saves draft; if True, confirms and locks
