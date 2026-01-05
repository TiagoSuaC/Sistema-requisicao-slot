from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..auth import get_current_user
from ..models.unit import Unit
from ..schemas.unit import Unit as UnitSchema, UnitCreate, UnitUpdate

router = APIRouter(prefix="/units", tags=["units"])


@router.get("", response_model=List[UnitSchema])
def list_units(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    units = db.query(Unit).offset(skip).limit(limit).all()
    return units


@router.post("", response_model=UnitSchema)
def create_unit(
    unit: UnitCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    db_unit = Unit(**unit.model_dump())
    db.add(db_unit)
    db.commit()
    db.refresh(db_unit)
    return db_unit


@router.get("/{unit_id}", response_model=UnitSchema)
def get_unit(
    unit_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    unit = db.query(Unit).filter(Unit.id == unit_id).first()
    if not unit:
        raise HTTPException(status_code=404, detail="Unit not found")
    return unit


@router.put("/{unit_id}", response_model=UnitSchema)
def update_unit(
    unit_id: int,
    unit_update: UnitUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    unit = db.query(Unit).filter(Unit.id == unit_id).first()
    if not unit:
        raise HTTPException(status_code=404, detail="Unit not found")

    for key, value in unit_update.model_dump(exclude_unset=True).items():
        setattr(unit, key, value)

    db.commit()
    db.refresh(unit)
    return unit


@router.delete("/{unit_id}")
def delete_unit(
    unit_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    unit = db.query(Unit).filter(Unit.id == unit_id).first()
    if not unit:
        raise HTTPException(status_code=404, detail="Unit not found")

    db.delete(unit)
    db.commit()
    return {"message": "Unit deleted successfully"}
