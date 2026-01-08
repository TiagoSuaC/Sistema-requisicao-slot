from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class AdminEditEvidenceBase(BaseModel):
    notes: Optional[str] = None


class AdminEditEvidenceCreate(AdminEditEvidenceBase):
    macro_period_id: int
    file_path: str
    original_filename: Optional[str] = None
    file_size: Optional[int] = None
    mime_type: Optional[str] = None
    uploaded_by: str


class AdminEditEvidenceResponse(AdminEditEvidenceBase):
    id: int
    macro_period_id: int
    file_path: str
    original_filename: Optional[str]
    file_size: Optional[int]
    mime_type: Optional[str]
    uploaded_by: str
    uploaded_at: datetime

    class Config:
        from_attributes = True


class EnableAdminEditRequest(BaseModel):
    evidence_file_id: int
    notes: Optional[str] = None


class EnableAdminEditResponse(BaseModel):
    token: str
    expires_at: datetime
