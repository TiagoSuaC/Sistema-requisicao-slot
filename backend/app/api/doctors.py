from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..auth import get_current_user
from ..models.doctor import Doctor
from ..schemas.doctor import Doctor as DoctorSchema, DoctorCreate, DoctorUpdate

router = APIRouter(prefix="/doctors", tags=["doctors"])


@router.get("", response_model=List[DoctorSchema])
def list_doctors(
    skip: int = 0,
    limit: int = 100,
    active_only: bool = True,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    query = db.query(Doctor)
    if active_only:
        query = query.filter(Doctor.active == True)
    doctors = query.offset(skip).limit(limit).all()
    return doctors


@router.post("", response_model=DoctorSchema)
def create_doctor(
    doctor: DoctorCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    # Check if email already exists
    existing = db.query(Doctor).filter(Doctor.email == doctor.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    db_doctor = Doctor(**doctor.model_dump())
    db.add(db_doctor)
    db.commit()
    db.refresh(db_doctor)
    return db_doctor


@router.get("/{doctor_id}", response_model=DoctorSchema)
def get_doctor(
    doctor_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    return doctor


@router.put("/{doctor_id}", response_model=DoctorSchema)
def update_doctor(
    doctor_id: int,
    doctor_update: DoctorUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")

    # Check email uniqueness if updating email
    if doctor_update.email and doctor_update.email != doctor.email:
        existing = db.query(Doctor).filter(Doctor.email == doctor_update.email).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered")

    for key, value in doctor_update.model_dump(exclude_unset=True).items():
        setattr(doctor, key, value)

    db.commit()
    db.refresh(doctor)
    return doctor


@router.delete("/{doctor_id}")
def delete_doctor(
    doctor_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")

    db.delete(doctor)
    db.commit()
    return {"message": "Doctor deleted successfully"}
