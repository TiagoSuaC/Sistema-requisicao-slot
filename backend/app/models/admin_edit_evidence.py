from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from ..database import Base


class AdminEditEvidence(Base):
    __tablename__ = "admin_edit_evidences"

    id = Column(Integer, primary_key=True, index=True)
    macro_period_id = Column(Integer, ForeignKey("macro_periods.id", ondelete="CASCADE"), nullable=False)
    file_path = Column(String(500), nullable=False)
    original_filename = Column(String(255))
    file_size = Column(Integer)
    mime_type = Column(String(100))
    notes = Column(Text)
    uploaded_by = Column(String(255))
    uploaded_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relationship
    macro_period = relationship("MacroPeriod", back_populates="admin_evidences")
