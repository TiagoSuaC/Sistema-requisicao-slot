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
    from ..schemas.macro_period_unit import MacroPeriodUnitResponse

    macro_period = db.query(MacroPeriod).filter(MacroPeriod.public_token == token).first()
    if not macro_period:
        raise HTTPException(status_code=404, detail="Invalid or expired link")

    # Get doctor
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

    # Build units response
    units_response = []
    for mp_unit in macro_period.units:
        units_response.append(MacroPeriodUnitResponse(
            id=mp_unit.id,
            macro_period_id=mp_unit.macro_period_id,
            unit_id=mp_unit.unit_id,
            unit_name=mp_unit.unit.name,
            unit_city=mp_unit.unit.city,
            total_days=mp_unit.total_days,
            order_position=mp_unit.order_position,
            config_turnos=mp_unit.unit.config_turnos
        ))

    return MacroPeriodPublicView(
        id=macro_period.id,
        doctor_name=doctor.name,
        start_date=macro_period.start_date,
        end_date=macro_period.end_date,
        status=macro_period.status,
        units=units_response,
        selections=macro_period.selections,
        can_edit=can_edit
    )


@router.post("/macro-period/{token}/response")
def submit_doctor_response(
    token: str,
    response: DoctorResponseSubmit,
    db: Session = Depends(get_db)
):
    from ..models.macro_period_unit import MacroPeriodUnit
    from collections import defaultdict

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

    # Validate macro_period_unit_id exists
    mp_unit_ids = {u.id for u in macro_period.units}
    for selection in response.selections:
        if selection.macro_period_unit_id not in mp_unit_ids:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid macro_period_unit_id: {selection.macro_period_unit_id}"
            )

    # Validate time overlap (no conflicts on same day)
    validate_time_overlap(response.selections)

    # Validate consecutive blocks
    validate_consecutive_blocks(response.selections)

    # Validate unit requirements (surgery_days and consult_days)
    validate_unit_requirements(response.selections, macro_period.units)

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

    # Update status based on confirm flag
    if response.confirm:
        # Doctor is confirming - lock the period
        was_first_response = macro_period.status == MacroPeriodStatus.AGUARDANDO
        if was_first_response:
            macro_period.responded_at = datetime.now(timezone.utc)
            event_type = EventType.RESPONDED
        else:
            event_type = EventType.UPDATED
        macro_period.status = MacroPeriodStatus.RESPONDIDO
    else:
        # Doctor is saving draft - keep status as AGUARDANDO or EDICAO_LIBERADA
        event_type = EventType.DRAFT_SAVED
        # Status remains unchanged

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


def validate_time_overlap(selections: List[MacroPeriodSelectionCreate]):
    """Validate that there are no time overlaps on the same day"""
    from collections import defaultdict

    day_periods = defaultdict(list)
    for sel in selections:
        day_periods[sel.date].append(sel.part_of_day)

    for date, periods in day_periods.items():
        # FULL_DAY cannot coexist with other periods
        if "FULL_DAY" in periods and len(periods) > 1:
            raise HTTPException(
                status_code=400,
                detail=f"Date {date}: FULL_DAY cannot have other periods on the same day"
            )

        # MORNING and AFTERNOON can coexist
        # Count each period type
        period_counts = {}
        for p in periods:
            period_counts[p] = period_counts.get(p, 0) + 1

        # Cannot have duplicate periods (e.g., two MORNING slots)
        for period, count in period_counts.items():
            if count > 1 and period != "CUSTOM":
                raise HTTPException(
                    status_code=400,
                    detail=f"Date {date}: Cannot have multiple {period} periods"
                )


def validate_consecutive_blocks(selections: List[MacroPeriodSelectionCreate]):
    """Validate that days with same block_id are consecutive"""
    from collections import defaultdict

    blocks = defaultdict(list)
    for sel in selections:
        if sel.block_id:
            # Get unique dates for each block (a day can have multiple selections)
            blocks[sel.block_id].append(sel.date)

    for block_id, dates in blocks.items():
        # Get unique dates only
        unique_dates = sorted(set(dates))
        for i in range(len(unique_dates) - 1):
            diff = (unique_dates[i+1] - unique_dates[i]).days
            if diff != 1:
                raise HTTPException(
                    status_code=400,
                    detail=f"Block {block_id} has non-consecutive dates"
                )


def validate_unit_requirements(selections: List[MacroPeriodSelectionCreate], macro_period_units):
    """Validate that each unit has the correct number of total days (counting UNIQUE days)"""
    from collections import defaultdict

    # Count UNIQUE days by unit
    unit_days = defaultdict(set)

    for sel in selections:
        # Add the date to the set for this unit
        unit_days[sel.macro_period_unit_id].add(sel.date)

    # Validate each unit
    for mp_unit in macro_period_units:
        day_count = len(unit_days.get(mp_unit.id, set()))

        if day_count != mp_unit.total_days:
            raise HTTPException(
                status_code=400,
                detail=f"Unit {mp_unit.unit.name} requires {mp_unit.total_days} days, but got {day_count}"
            )
