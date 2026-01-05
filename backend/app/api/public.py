from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from typing import List
from ..database import get_db
from ..models import MacroPeriod, Unit, Doctor, AuditEvent, MacroPeriodSelection
from ..models.macro_period import MacroPeriodStatus
from ..models.audit import EventType
from ..schemas.macro_period import MacroPeriodPublicView, DoctorResponseSubmit
from ..schemas.selection import MacroPeriodSelectionCreate

router = APIRouter(prefix="/public", tags=["public"])


@router.get("/macro-period/{token}", response_model=MacroPeriodPublicView)
def get_macro_period_by_token(
    token: str,
    db: Session = Depends(get_db)
):
    macro_period = db.query(MacroPeriod).filter(MacroPeriod.public_token == token).first()
    if not macro_period:
        raise HTTPException(status_code=404, detail="Invalid or expired link")

    # Get unit and doctor
    unit = db.query(Unit).filter(Unit.id == macro_period.unit_id).first()
    doctor = db.query(Doctor).filter(Doctor.id == macro_period.doctor_id).first()

    # Check if can edit
    can_edit = macro_period.status in [
        MacroPeriodStatus.AGUARDANDO,
        MacroPeriodStatus.EDICAO_LIBERADA
    ]

    # Log link viewed
    existing_view = db.query(AuditEvent).filter(
        AuditEvent.macro_period_id == macro_period.id,
        AuditEvent.event_type == EventType.LINK_VIEWED
    ).first()

    if not existing_view:
        audit_event = AuditEvent(
            macro_period_id=macro_period.id,
            event_type=EventType.LINK_VIEWED,
            created_by="doctor"
        )
        db.add(audit_event)
        db.commit()

    return MacroPeriodPublicView(
        id=macro_period.id,
        unit_name=unit.name,
        unit_city=unit.city,
        doctor_name=doctor.name,
        start_date=macro_period.start_date,
        end_date=macro_period.end_date,
        status=macro_period.status,
        suggested_surgery_min=macro_period.suggested_surgery_min,
        suggested_surgery_max=macro_period.suggested_surgery_max,
        suggested_consult_min=macro_period.suggested_consult_min,
        suggested_consult_max=macro_period.suggested_consult_max,
        config_turnos=unit.config_turnos,
        selections=macro_period.selections,
        can_edit=can_edit
    )


@router.post("/macro-period/{token}/response")
def submit_doctor_response(
    token: str,
    response: DoctorResponseSubmit,
    db: Session = Depends(get_db)
):
    macro_period = db.query(MacroPeriod).filter(MacroPeriod.public_token == token).first()
    if not macro_period:
        raise HTTPException(status_code=404, detail="Invalid or expired link")

    # Check if can edit
    if macro_period.status not in [MacroPeriodStatus.AGUARDANDO, MacroPeriodStatus.EDICAO_LIBERADA]:
        raise HTTPException(status_code=400, detail="This period is locked and cannot be edited")

    # Validate dates are within macro period
    for selection in response.selections:
        if selection.date < macro_period.start_date or selection.date > macro_period.end_date:
            raise HTTPException(
                status_code=400,
                detail=f"Date {selection.date} is outside the allowed period"
            )

    # Delete existing selections
    db.query(MacroPeriodSelection).filter(
        MacroPeriodSelection.macro_period_id == macro_period.id
    ).delete()

    # Create new selections
    for selection_data in response.selections:
        selection = MacroPeriodSelection(
            macro_period_id=macro_period.id,
            **selection_data.model_dump()
        )
        db.add(selection)

    # Update status and response time
    was_first_response = macro_period.status == MacroPeriodStatus.AGUARDANDO
    if was_first_response:
        macro_period.responded_at = datetime.now(timezone.utc)
        event_type = EventType.RESPONDED
    else:
        event_type = EventType.UPDATED

    macro_period.status = MacroPeriodStatus.RESPONDIDO

    # Create audit event
    audit_event = AuditEvent(
        macro_period_id=macro_period.id,
        event_type=event_type,
        created_by="doctor",
        payload={
            "total_selections": len(response.selections),
            "dates": [str(s.date) for s in response.selections]
        }
    )
    db.add(audit_event)
    db.commit()

    return {
        "message": "Response submitted successfully",
        "status": macro_period.status
    }
