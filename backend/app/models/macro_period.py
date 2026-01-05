from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import enum
from ..database import Base


class MacroPeriodStatus(str, enum.Enum):
    AGUARDANDO = "AGUARDANDO"
    RESPONDIDO = "RESPONDIDO"
    EDICAO_LIBERADA = "EDICAO_LIBERADA"
    CONFIRMADO = "CONFIRMADO"
    CANCELADO = "CANCELADO"
    EXPIRADO = "EXPIRADO"


class Priority(str, enum.Enum):
    BAIXA = "BAIXA"
    NORMAL = "NORMAL"
    ALTA = "ALTA"
    URGENTE = "URGENTE"


class MacroPeriod(Base):
    __tablename__ = "macro_periods"

    id = Column(Integer, primary_key=True, index=True)
    unit_id = Column(Integer, ForeignKey("units.id"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("doctors.id"), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    suggested_surgery_min = Column(Integer, nullable=True)
    suggested_surgery_max = Column(Integer, nullable=True)
    suggested_consult_min = Column(Integer, nullable=True)
    suggested_consult_max = Column(Integer, nullable=True)
    status = Column(SQLEnum(MacroPeriodStatus), default=MacroPeriodStatus.AGUARDANDO, nullable=False, index=True)
    priority = Column(SQLEnum(Priority), default=Priority.NORMAL, nullable=False, index=True)
    deadline = Column(Date, nullable=True)
    public_token = Column(String, unique=True, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    created_by = Column(String, nullable=False)
    responded_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    unit = relationship("Unit", back_populates="macro_periods")
    doctor = relationship("Doctor", back_populates="macro_periods")
    selections = relationship("MacroPeriodSelection", back_populates="macro_period", cascade="all, delete-orphan")
    audit_events = relationship("AuditEvent", back_populates="macro_period", cascade="all, delete-orphan")
