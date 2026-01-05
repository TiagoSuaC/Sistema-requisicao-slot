from pydantic import BaseModel
from datetime import datetime
from ..models.audit import EventType


class AuditEventBase(BaseModel):
    event_type: EventType
    payload: dict | None = None
    created_by: str


class AuditEventCreate(AuditEventBase):
    macro_period_id: int


class AuditEvent(AuditEventBase):
    id: int
    macro_period_id: int
    created_at: datetime

    class Config:
        from_attributes = True
