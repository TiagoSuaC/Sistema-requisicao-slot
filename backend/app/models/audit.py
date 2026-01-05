from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import enum
from ..database import Base


class EventType(str, enum.Enum):
    CREATED = "CREATED"
    LINK_VIEWED = "LINK_VIEWED"
    RESPONDED = "RESPONDED"
    UNLOCKED = "UNLOCKED"
    UPDATED = "UPDATED"
    CONFIRMED = "CONFIRMED"
    CANCELLED = "CANCELLED"


class AuditEvent(Base):
    __tablename__ = "audit_events"

    id = Column(Integer, primary_key=True, index=True)
    macro_period_id = Column(Integer, ForeignKey("macro_periods.id"), nullable=False, index=True)
    event_type = Column(SQLEnum(EventType), nullable=False)
    payload = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    created_by = Column(String, nullable=False)  # "admin" or "doctor"

    # Relationships
    macro_period = relationship("MacroPeriod", back_populates="audit_events")
