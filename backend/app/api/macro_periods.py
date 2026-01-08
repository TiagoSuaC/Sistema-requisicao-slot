from fastapi import APIRouter, Depends, HTTPException, Response, File, UploadFile
from sqlalchemy.orm import Session
from sqlalchemy import desc, or_, func, case
from typing import List, Optional, Dict, Any
from datetime import datetime, date, timedelta, timezone
from io import StringIO
import csv
import secrets
import os
from pathlib import Path
from ..database import get_db
from ..auth import get_current_user
from ..models import MacroPeriod, Unit, Doctor, AuditEvent, MacroPeriodSelection, AdminEditEvidence
from ..models.macro_period import MacroPeriodStatus
from ..models.audit import EventType
from ..schemas.macro_period import (
    MacroPeriodCreate, MacroPeriodResponse, MacroPeriodDetail,
    MacroPeriodListItem
)
from ..schemas.admin_edit_evidence import (
    AdminEditEvidenceCreate, AdminEditEvidenceResponse,
    EnableAdminEditRequest, EnableAdminEditResponse
)
from ..utils import generate_public_token

router = APIRouter(prefix="/macro-periods", tags=["macro-periods"])


def calculate_dias_em_aberto(macro_period: MacroPeriod) -> Optional[int]:
    """Calculate days open if status is AGUARDANDO"""
    if macro_period.status == MacroPeriodStatus.AGUARDANDO:
        return (datetime.now(timezone.utc) - macro_period.created_at).days
    return None


def calculate_tempo_ate_resposta(macro_period: MacroPeriod) -> Optional[int]:
    """Calculate days until response if responded"""
    if macro_period.responded_at:
        return (macro_period.responded_at - macro_period.created_at).days
    return None


@router.post("", response_model=MacroPeriodResponse)
def create_macro_period(
    macro_period: MacroPeriodCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    # Verify doctor exists
    doctor = db.query(Doctor).filter(Doctor.id == macro_period.doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")

    # Verify all units exist
    unit_ids = [u.unit_id for u in macro_period.units]
    units = db.query(Unit).filter(Unit.id.in_(unit_ids)).all()
    if len(units) != len(unit_ids):
        raise HTTPException(status_code=404, detail="One or more units not found")

    # Generate public token
    public_token = generate_public_token()

    # Create macro period (without units in model_dump)
    macro_period_data = macro_period.model_dump(exclude={'units'})
    db_macro_period = MacroPeriod(
        **macro_period_data,
        public_token=public_token,
        created_by=current_user["email"],
        status=MacroPeriodStatus.AGUARDANDO
    )
    db.add(db_macro_period)
    db.flush()

    # Create macro_period_units
    from ..models.macro_period_unit import MacroPeriodUnit
    for idx, unit_data in enumerate(macro_period.units):
        db_unit = MacroPeriodUnit(
            macro_period_id=db_macro_period.id,
            unit_id=unit_data.unit_id,
            total_days=unit_data.total_days,
            order_position=idx
        )
        db.add(db_unit)

    # Create audit event
    unit_names = [u.name for u in units]
    audit_event = AuditEvent(
        macro_period_id=db_macro_period.id,
        event_type=EventType.CREATED,
        created_by=current_user["email"],
        payload={
            "units": unit_names,
            "doctor_name": doctor.name,
            "start_date": str(macro_period.start_date),
            "end_date": str(macro_period.end_date)
        }
    )
    db.add(audit_event)
    db.commit()
    db.refresh(db_macro_period)

    return db_macro_period


@router.put("/{macro_period_id}", response_model=MacroPeriodResponse)
def update_macro_period(
    macro_period_id: int,
    macro_period: MacroPeriodCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    db_macro_period = db.query(MacroPeriod).filter(MacroPeriod.id == macro_period_id).first()
    if not db_macro_period:
        raise HTTPException(status_code=404, detail="Macro period not found")

    # Only allow editing if status is AGUARDANDO
    if db_macro_period.status != MacroPeriodStatus.AGUARDANDO:
        raise HTTPException(status_code=400, detail="Can only edit periods in AGUARDANDO status")

    # Verify doctor exists
    doctor = db.query(Doctor).filter(Doctor.id == macro_period.doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")

    # Verify all units exist
    unit_ids = [u.unit_id for u in macro_period.units]
    units = db.query(Unit).filter(Unit.id.in_(unit_ids)).all()
    if len(units) != len(unit_ids):
        raise HTTPException(status_code=404, detail="One or more units not found")

    # Update macro period fields
    db_macro_period.doctor_id = macro_period.doctor_id
    db_macro_period.start_date = macro_period.start_date
    db_macro_period.end_date = macro_period.end_date
    db_macro_period.priority = macro_period.priority
    db_macro_period.deadline = macro_period.deadline

    # Delete existing macro_period_units
    from ..models.macro_period_unit import MacroPeriodUnit
    db.query(MacroPeriodUnit).filter(MacroPeriodUnit.macro_period_id == macro_period_id).delete()

    # Delete existing selections (if dates changed)
    db.query(MacroPeriodSelection).filter(MacroPeriodSelection.macro_period_id == macro_period_id).delete()

    # Create new macro_period_units
    for idx, unit_data in enumerate(macro_period.units):
        db_unit = MacroPeriodUnit(
            macro_period_id=db_macro_period.id,
            unit_id=unit_data.unit_id,
            total_days=unit_data.total_days,
            order_position=idx
        )
        db.add(db_unit)

    # Create audit event
    unit_names = [u.name for u in units]
    audit_event = AuditEvent(
        macro_period_id=db_macro_period.id,
        event_type=EventType.UPDATED,
        created_by=current_user["email"],
        payload={
            "units": unit_names,
            "doctor_name": doctor.name,
            "start_date": str(macro_period.start_date),
            "end_date": str(macro_period.end_date),
            "action": "admin_edited"
        }
    )
    db.add(audit_event)
    db.commit()
    db.refresh(db_macro_period)

    return db_macro_period


@router.get("", response_model=List[MacroPeriodListItem])
def list_macro_periods(
    skip: int = 0,
    limit: int = 100,
    unit_id: Optional[int] = None,
    doctor_id: Optional[int] = None,
    status: Optional[MacroPeriodStatus] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    sort_by_dias_aberto: bool = False,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    from ..models.macro_period_unit import MacroPeriodUnit

    query = db.query(MacroPeriod, Doctor.name.label("doctor_name")).join(Doctor)

    # Filters
    if unit_id:
        # Filter by macro periods that have this specific unit
        query = query.join(MacroPeriodUnit).filter(MacroPeriodUnit.unit_id == unit_id)
    if doctor_id:
        query = query.filter(MacroPeriod.doctor_id == doctor_id)
    if status:
        query = query.filter(MacroPeriod.status == status)
    if start_date:
        query = query.filter(MacroPeriod.created_at >= datetime.combine(start_date, datetime.min.time()))
    if end_date:
        query = query.filter(MacroPeriod.created_at <= datetime.combine(end_date, datetime.max.time()))

    # Sorting
    if sort_by_dias_aberto:
        query = query.filter(MacroPeriod.status == MacroPeriodStatus.AGUARDANDO)
        query = query.order_by(MacroPeriod.created_at.asc())
    else:
        query = query.order_by(desc(MacroPeriod.created_at))

    results = query.offset(skip).limit(limit).all()

    # Format response
    items = []
    for macro_period, doctor_name in results:
        # Get units for this macro period
        units_data = []
        for mp_unit in macro_period.units:
            units_data.append({
                "unit_name": mp_unit.unit.name,
                "unit_city": mp_unit.unit.city,
                "total_days": mp_unit.total_days
            })

        items.append(MacroPeriodListItem(
            id=macro_period.id,
            doctor_name=doctor_name,
            units=units_data,
            start_date=macro_period.start_date,
            end_date=macro_period.end_date,
            status=macro_period.status,
            priority=macro_period.priority,
            deadline=macro_period.deadline,
            public_token=macro_period.public_token,
            dias_em_aberto=calculate_dias_em_aberto(macro_period),
            tempo_ate_resposta=calculate_tempo_ate_resposta(macro_period),
            created_at=macro_period.created_at,
            responded_at=macro_period.responded_at
        ))

    return items


@router.get("/{macro_period_id}", response_model=MacroPeriodDetail)
def get_macro_period(
    macro_period_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    from ..schemas.macro_period_unit import MacroPeriodUnitResponse

    macro_period = db.query(MacroPeriod).filter(MacroPeriod.id == macro_period_id).first()
    if not macro_period:
        raise HTTPException(status_code=404, detail="Macro period not found")

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

    # Get doctor for response
    doctor = db.query(Doctor).filter(Doctor.id == macro_period.doctor_id).first()

    return MacroPeriodDetail(
        id=macro_period.id,
        doctor_id=macro_period.doctor_id,
        start_date=macro_period.start_date,
        end_date=macro_period.end_date,
        status=macro_period.status,
        priority=macro_period.priority,
        deadline=macro_period.deadline,
        public_token=macro_period.public_token,
        created_at=macro_period.created_at,
        created_by=macro_period.created_by,
        responded_at=macro_period.responded_at,
        units=units_response,
        selections=macro_period.selections,
        audit_events=macro_period.audit_events
    )


@router.post("/{macro_period_id}/unlock")
def unlock_macro_period(
    macro_period_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    macro_period = db.query(MacroPeriod).filter(MacroPeriod.id == macro_period_id).first()
    if not macro_period:
        raise HTTPException(status_code=404, detail="Macro period not found")

    if macro_period.status not in [MacroPeriodStatus.RESPONDIDO, MacroPeriodStatus.CONFIRMADO]:
        raise HTTPException(status_code=400, detail="Can only unlock responded or confirmed periods")

    macro_period.status = MacroPeriodStatus.EDICAO_LIBERADA

    # Create audit event
    audit_event = AuditEvent(
        macro_period_id=macro_period.id,
        event_type=EventType.UNLOCKED,
        created_by=current_user["email"]
    )
    db.add(audit_event)
    db.commit()

    return {"message": "Macro period unlocked for editing"}


@router.post("/{macro_period_id}/confirm")
def confirm_macro_period(
    macro_period_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    macro_period = db.query(MacroPeriod).filter(MacroPeriod.id == macro_period_id).first()
    if not macro_period:
        raise HTTPException(status_code=404, detail="Macro period not found")

    if macro_period.status not in [MacroPeriodStatus.RESPONDIDO, MacroPeriodStatus.EDICAO_LIBERADA]:
        raise HTTPException(status_code=400, detail="Can only confirm responded periods")

    macro_period.status = MacroPeriodStatus.CONFIRMADO

    # Create audit event
    audit_event = AuditEvent(
        macro_period_id=macro_period.id,
        event_type=EventType.CONFIRMED,
        created_by=current_user["email"]
    )
    db.add(audit_event)
    db.commit()

    return {"message": "Macro period confirmed"}


@router.post("/{macro_period_id}/cancel")
def cancel_macro_period(
    macro_period_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    macro_period = db.query(MacroPeriod).filter(MacroPeriod.id == macro_period_id).first()
    if not macro_period:
        raise HTTPException(status_code=404, detail="Macro period not found")

    macro_period.status = MacroPeriodStatus.CANCELADO

    # Create audit event
    audit_event = AuditEvent(
        macro_period_id=macro_period.id,
        event_type=EventType.CANCELLED,
        created_by=current_user["email"]
    )
    db.add(audit_event)
    db.commit()

    return {"message": "Macro period cancelled"}


@router.get("/{macro_period_id}/export.csv")
def export_macro_period_csv(
    macro_period_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    macro_period = db.query(MacroPeriod).filter(MacroPeriod.id == macro_period_id).first()
    if not macro_period:
        raise HTTPException(status_code=404, detail="Macro period not found")

    # Get selections
    selections = db.query(MacroPeriodSelection).filter(
        MacroPeriodSelection.macro_period_id == macro_period_id
    ).all()

    # Create CSV
    output = StringIO()
    writer = csv.writer(output)
    writer.writerow(["Data", "Tipo", "Período", "Início", "Fim"])

    for selection in selections:
        period = selection.part_of_day.value
        start = str(selection.custom_start) if selection.custom_start else "-"
        end = str(selection.custom_end) if selection.custom_end else "-"

        writer.writerow([
            str(selection.date),
            selection.type.value,
            period,
            start,
            end
        ])

    output.seek(0)
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename=macro_period_{macro_period_id}_export.csv"
        }
    )


@router.post("/export-batch.csv")
def export_batch_csv(
    macro_period_ids: List[int],
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Export multiple macro periods to a single CSV file
    """
    # Get all macro periods with their related data
    macro_periods = db.query(MacroPeriod, Unit.name, Doctor.name).join(Unit).join(Doctor).filter(
        MacroPeriod.id.in_(macro_period_ids)
    ).all()

    if not macro_periods:
        raise HTTPException(status_code=404, detail="No macro periods found")

    # Create CSV
    output = StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Macro Período ID",
        "Unidade",
        "Médico",
        "Período Início",
        "Período Fim",
        "Status",
        "Prioridade",
        "Data Seleção",
        "Tipo",
        "Parte do Dia",
        "Horário Início",
        "Horário Fim"
    ])

    for macro_period, unit_name, doctor_name in macro_periods:
        # Get selections for this macro period
        selections = db.query(MacroPeriodSelection).filter(
            MacroPeriodSelection.macro_period_id == macro_period.id
        ).all()

        if selections:
            for selection in selections:
                period = selection.part_of_day.value
                start = str(selection.custom_start) if selection.custom_start else "-"
                end = str(selection.custom_end) if selection.custom_end else "-"

                writer.writerow([
                    macro_period.id,
                    unit_name,
                    doctor_name,
                    str(macro_period.start_date),
                    str(macro_period.end_date),
                    macro_period.status.value,
                    macro_period.priority.value,
                    str(selection.date),
                    selection.type.value,
                    period,
                    start,
                    end
                ])
        else:
            # If no selections, still add the macro period info
            writer.writerow([
                macro_period.id,
                unit_name,
                doctor_name,
                str(macro_period.start_date),
                str(macro_period.end_date),
                macro_period.status.value,
                macro_period.priority.value,
                "-",
                "-",
                "-",
                "-",
                "-"
            ])

    output.seek(0)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename=macro_periods_batch_{timestamp}.csv"
        }
    )


@router.get("/metrics/dashboard")
def get_dashboard_metrics(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Get aggregated metrics for dashboard
    """
    # Default to last 30 days if no dates provided
    if not end_date:
        end_date = date.today()
    if not start_date:
        start_date = end_date - timedelta(days=30)

    # Convert to datetime for comparison
    start_datetime = datetime.combine(start_date, datetime.min.time())
    end_datetime = datetime.combine(end_date, datetime.max.time())

    # Base query with date filter
    base_query = db.query(MacroPeriod).filter(
        MacroPeriod.created_at >= start_datetime,
        MacroPeriod.created_at <= end_datetime
    )

    # Total counts by status
    total_periods = base_query.count()
    aguardando_count = base_query.filter(MacroPeriod.status == MacroPeriodStatus.AGUARDANDO).count()
    respondido_count = base_query.filter(MacroPeriod.status == MacroPeriodStatus.RESPONDIDO).count()
    edicao_liberada_count = base_query.filter(MacroPeriod.status == MacroPeriodStatus.EDICAO_LIBERADA).count()
    confirmado_count = base_query.filter(MacroPeriod.status == MacroPeriodStatus.CONFIRMADO).count()
    cancelado_count = base_query.filter(MacroPeriod.status == MacroPeriodStatus.CANCELADO).count()

    # Taxa de resposta (respondidos + confirmados + edicao_liberada) / total
    respondidos_total = respondido_count + confirmado_count + edicao_liberada_count
    taxa_resposta = (respondidos_total / total_periods * 100) if total_periods > 0 else 0

    # Tempo médio de resposta (apenas para períodos com responded_at)
    periodos_respondidos = base_query.filter(MacroPeriod.responded_at.isnot(None)).all()
    if periodos_respondidos:
        tempos_resposta = [
            (p.responded_at - p.created_at).total_seconds() / (60 * 60 * 24)
            for p in periodos_respondidos
        ]
        tempo_medio_resposta = sum(tempos_resposta) / len(tempos_resposta)
    else:
        tempo_medio_resposta = 0

    # Períodos urgentes (aguardando > 3 dias)
    periodos_aguardando = base_query.filter(MacroPeriod.status == MacroPeriodStatus.AGUARDANDO).all()
    urgentes_count = sum(
        1 for p in periodos_aguardando
        if (datetime.now(timezone.utc) - p.created_at).days >= 3
    )

    # Distribuição por status
    distribuicao_status = {
        "AGUARDANDO": aguardando_count,
        "RESPONDIDO": respondido_count,
        "EDICAO_LIBERADA": edicao_liberada_count,
        "CONFIRMADO": confirmado_count,
        "CANCELADO": cancelado_count
    }

    # Top 5 médicos com menor tempo de resposta
    top_medicos_rapidos = db.query(
        Doctor.name,
        func.avg(
            func.extract('epoch', MacroPeriod.responded_at - MacroPeriod.created_at) / 86400
        ).label("tempo_medio")
    ).join(MacroPeriod).filter(
        MacroPeriod.responded_at.isnot(None),
        MacroPeriod.created_at >= start_datetime,
        MacroPeriod.created_at <= end_datetime
    ).group_by(Doctor.id).order_by("tempo_medio").limit(5).all()

    # Top 5 médicos com maior tempo de resposta
    top_medicos_lentos = db.query(
        Doctor.name,
        func.avg(
            func.extract('epoch', MacroPeriod.responded_at - MacroPeriod.created_at) / 86400
        ).label("tempo_medio")
    ).join(MacroPeriod).filter(
        MacroPeriod.responded_at.isnot(None),
        MacroPeriod.created_at >= start_datetime,
        MacroPeriod.created_at <= end_datetime
    ).group_by(Doctor.id).order_by(desc("tempo_medio")).limit(5).all()

    # Tendência semanal (baseada nas datas reais de disponibilidade selecionadas pelos médicos)
    # Buscar todas as seleções de disponibilidade no período filtrado
    selections_query = db.query(MacroPeriodSelection).join(MacroPeriod).filter(
        MacroPeriod.created_at >= start_datetime,
        MacroPeriod.created_at <= end_datetime
    ).all()

    # Agrupar datas únicas por semana
    from collections import defaultdict
    weeks_data = defaultdict(set)  # Usar set para contar dias únicos

    for selection in selections_query:
        # Encontrar o início da semana (segunda-feira) da data de seleção
        selection_date = selection.date
        week_start = selection_date - timedelta(days=selection_date.weekday())
        week_end = week_start + timedelta(days=6)
        week_key = (week_start, week_end)
        weeks_data[week_key].add(selection_date)  # Adicionar ao set (dias únicos)

    # Ordenar por data e limitar a 12 semanas
    sorted_weeks = sorted(weeks_data.items(), key=lambda x: x[0][0])[:12]

    tendencia_semanal = [
        {
            "periodo": f"{week_start.strftime('%d/%m')} - {week_end.strftime('%d/%m')}",
            "total": len(dates)  # Contar dias únicos no set
        }
        for (week_start, week_end), dates in sorted_weeks
    ]

    # Análise por médico
    medicos_ativos = db.query(Doctor).filter(Doctor.active == True).all()
    analise_por_medico = []

    for medico in medicos_ativos:
        # Períodos do médico no intervalo
        periodos_medico = base_query.filter(MacroPeriod.doctor_id == medico.id).all()
        total_solicitacoes = len(periodos_medico)

        if total_solicitacoes == 0:
            continue  # Pular médicos sem solicitações no período

        # Contadores
        respondidas = sum(1 for p in periodos_medico if p.responded_at is not None)
        aguardando = sum(1 for p in periodos_medico if p.status == MacroPeriodStatus.AGUARDANDO)
        urgentes = sum(
            1 for p in periodos_medico
            if p.status == MacroPeriodStatus.AGUARDANDO and
            (datetime.now(timezone.utc) - p.created_at).days >= 3
        )

        # Taxa de resposta
        taxa_resposta_medico = (respondidas / total_solicitacoes * 100) if total_solicitacoes > 0 else 0

        # Tempo médio de resposta
        tempos_resposta_medico = [
            (p.responded_at - p.created_at).days
            for p in periodos_medico if p.responded_at
        ]
        tempo_medio_medico = (
            sum(tempos_resposta_medico) / len(tempos_resposta_medico)
        ) if tempos_resposta_medico else None

        # Última resposta
        periodos_respondidos = [p for p in periodos_medico if p.responded_at]
        ultima_resposta = max(
            (p.responded_at for p in periodos_respondidos),
            default=None
        )

        # Dias desde última resposta
        dias_desde_ultima = (
            (datetime.now(timezone.utc) - ultima_resposta).days
        ) if ultima_resposta else None

        analise_por_medico.append({
            "medico_id": medico.id,
            "medico_nome": medico.name,
            "total_solicitacoes": total_solicitacoes,
            "total_respondidas": respondidas,
            "taxa_resposta": round(taxa_resposta_medico, 1),
            "tempo_medio_resposta": round(tempo_medio_medico, 1) if tempo_medio_medico else None,
            "aguardando": aguardando,
            "urgentes": urgentes,
            "ultima_resposta": ultima_resposta.isoformat() if ultima_resposta else None,
            "dias_desde_ultima_resposta": dias_desde_ultima
        })

    # Ordenar por urgentes (desc) e depois por aguardando (desc)
    analise_por_medico.sort(key=lambda x: (x["urgentes"], x["aguardando"]), reverse=True)

    return {
        "periodo": {
            "inicio": start_date.isoformat(),
            "fim": end_date.isoformat()
        },
        "totais": {
            "total_periodos": total_periods,
            "aguardando": aguardando_count,
            "respondido": respondido_count,
            "edicao_liberada": edicao_liberada_count,
            "confirmado": confirmado_count,
            "cancelado": cancelado_count,
            "urgentes": urgentes_count
        },
        "metricas": {
            "taxa_resposta": round(taxa_resposta, 1),
            "tempo_medio_resposta": round(tempo_medio_resposta, 1)
        },
        "distribuicao_status": distribuicao_status,
        "top_medicos_rapidos": [
            {"nome": nome, "tempo_medio_dias": round(tempo, 1)}
            for nome, tempo in top_medicos_rapidos
        ],
        "top_medicos_lentos": [
            {"nome": nome, "tempo_medio_dias": round(tempo, 1)}
            for nome, tempo in top_medicos_lentos
        ],
        "tendencia_semanal": tendencia_semanal,
        "analise_por_medico": analise_por_medico
    }


@router.post("/{macro_period_id}/upload-admin-evidence", response_model=AdminEditEvidenceResponse)
async def upload_admin_evidence(
    macro_period_id: int,
    file: UploadFile = File(...),
    notes: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Upload evidence file (screenshot/PDF) to justify admin edit.
    This is MANDATORY before enabling admin edit mode.
    """
    # Verify macro period exists
    macro_period = db.query(MacroPeriod).filter(MacroPeriod.id == macro_period_id).first()
    if not macro_period:
        raise HTTPException(status_code=404, detail="Macro period not found")

    # Validate status - only allow for RESPONDIDO
    if macro_period.status != MacroPeriodStatus.RESPONDIDO:
        raise HTTPException(
            status_code=400,
            detail="Can only upload evidence for periods in RESPONDIDO status"
        )

    # Validate file type (images and PDFs only)
    allowed_types = ["image/jpeg", "image/jpg", "image/png", "image/gif", "application/pdf"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"File type {file.content_type} not allowed. Only images (JPG, PNG, GIF) and PDF are accepted."
        )

    # Validate file size (max 5MB)
    contents = await file.read()
    file_size = len(contents)
    if file_size > 5 * 1024 * 1024:  # 5MB
        raise HTTPException(status_code=400, detail="File size exceeds 5MB limit")

    # Generate unique filename
    file_extension = Path(file.filename).suffix
    unique_filename = f"{secrets.token_urlsafe(16)}{file_extension}"

    # Save file to uploads/evidence
    upload_dir = Path("uploads/evidence")
    upload_dir.mkdir(parents=True, exist_ok=True)
    file_path = upload_dir / unique_filename

    with open(file_path, "wb") as f:
        f.write(contents)

    # Create database record
    evidence = AdminEditEvidence(
        macro_period_id=macro_period_id,
        file_path=str(file_path),
        original_filename=file.filename,
        file_size=file_size,
        mime_type=file.content_type,
        notes=notes,
        uploaded_by=current_user["email"]
    )
    db.add(evidence)

    # Create audit event
    audit_event = AuditEvent(
        macro_period_id=macro_period_id,
        event_type=EventType.UPDATED,
        created_by=current_user["email"],
        payload={
            "action": "evidence_uploaded",
            "filename": file.filename,
            "notes": notes
        }
    )
    db.add(audit_event)
    db.commit()
    db.refresh(evidence)

    return evidence


@router.post("/{macro_period_id}/enable-admin-edit", response_model=EnableAdminEditResponse)
def enable_admin_edit(
    macro_period_id: int,
    request: EnableAdminEditRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Enable admin edit mode by generating a temporary token.
    Requires evidence_file_id from prior upload.
    Token valid for 30 minutes.
    """
    # Verify macro period exists
    macro_period = db.query(MacroPeriod).filter(MacroPeriod.id == macro_period_id).first()
    if not macro_period:
        raise HTTPException(status_code=404, detail="Macro period not found")

    # Validate status
    if macro_period.status != MacroPeriodStatus.RESPONDIDO:
        raise HTTPException(
            status_code=400,
            detail="Can only enable admin edit for periods in RESPONDIDO status"
        )

    # Verify evidence exists
    evidence = db.query(AdminEditEvidence).filter(
        AdminEditEvidence.id == request.evidence_file_id,
        AdminEditEvidence.macro_period_id == macro_period_id
    ).first()
    if not evidence:
        raise HTTPException(status_code=404, detail="Evidence file not found")

    # Generate temporary admin token (30 minutes validity)
    admin_token = secrets.token_urlsafe(32)
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=30)

    # Store token in audit event payload for validation later
    audit_event = AuditEvent(
        macro_period_id=macro_period_id,
        event_type=EventType.UPDATED,
        created_by=current_user["email"],
        payload={
            "action": "admin_edit_enabled",
            "admin_token": admin_token,
            "expires_at": expires_at.isoformat(),
            "evidence_file_id": request.evidence_file_id,
            "notes": request.notes
        }
    )
    db.add(audit_event)
    db.commit()

    return EnableAdminEditResponse(
        token=admin_token,
        expires_at=expires_at
    )


@router.get("/{macro_period_id}/evidences", response_model=List[AdminEditEvidenceResponse])
def list_admin_evidences(
    macro_period_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    List all evidence files for a macro period
    """
    macro_period = db.query(MacroPeriod).filter(MacroPeriod.id == macro_period_id).first()
    if not macro_period:
        raise HTTPException(status_code=404, detail="Macro period not found")

    evidences = db.query(AdminEditEvidence).filter(
        AdminEditEvidence.macro_period_id == macro_period_id
    ).order_by(desc(AdminEditEvidence.uploaded_at)).all()

    return evidences
