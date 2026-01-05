from pydantic import BaseModel, EmailStr
from typing import Optional


class DoctorBase(BaseModel):
    name: str
    email: EmailStr
    active: bool = True


class DoctorCreate(DoctorBase):
    pass


class DoctorUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    active: Optional[bool] = None


class Doctor(DoctorBase):
    id: int

    class Config:
        from_attributes = True
