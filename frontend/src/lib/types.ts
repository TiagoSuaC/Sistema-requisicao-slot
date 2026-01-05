export type MacroPeriodStatus =
  | "AGUARDANDO"
  | "RESPONDIDO"
  | "EDICAO_LIBERADA"
  | "CONFIRMADO"
  | "CANCELADO"
  | "EXPIRADO";

export type Priority = "BAIXA" | "NORMAL" | "ALTA" | "URGENTE";

export type PartOfDay = "MORNING" | "AFTERNOON" | "FULL_DAY" | "CUSTOM";
export type SelectionType = "SURGERY" | "CONSULT";

export interface Unit {
  id: number;
  name: string;
  city: string;
  config_turnos: {
    morning: { start: string; end: string };
    afternoon: { start: string; end: string };
  };
}

export interface Doctor {
  id: number;
  name: string;
  email: string;
  active: boolean;
}

export interface MacroPeriodSelection {
  id?: number;
  date: string;
  part_of_day: PartOfDay;
  custom_start?: string;
  custom_end?: string;
  type: SelectionType;
}

export interface MacroPeriod {
  id: number;
  unit_id: number;
  doctor_id: number;
  start_date: string;
  end_date: string;
  suggested_surgery_min?: number;
  suggested_surgery_max?: number;
  suggested_consult_min?: number;
  suggested_consult_max?: number;
  status: MacroPeriodStatus;
  priority: Priority;
  deadline?: string;
  public_token: string;
  created_at: string;
  created_by: string;
  responded_at?: string;
}

export interface MacroPeriodListItem {
  id: number;
  unit_name: string;
  unit_city: string;
  doctor_name: string;
  start_date: string;
  end_date: string;
  status: MacroPeriodStatus;
  priority: Priority;
  deadline?: string;
  public_token: string;
  dias_em_aberto?: number;
  tempo_ate_resposta?: number;
  created_at: string;
  responded_at?: string;
}

export interface MacroPeriodDetail extends MacroPeriod {
  selections: MacroPeriodSelection[];
  audit_events: AuditEvent[];
}

export interface AuditEvent {
  id: number;
  event_type: string;
  created_at: string;
  created_by: string;
  payload?: any;
}

export interface MacroPeriodPublicView {
  id: number;
  unit_name: string;
  unit_city: string;
  doctor_name: string;
  start_date: string;
  end_date: string;
  status: MacroPeriodStatus;
  suggested_surgery_min?: number;
  suggested_surgery_max?: number;
  suggested_consult_min?: number;
  suggested_consult_max?: number;
  config_turnos: {
    morning: { start: string; end: string };
    afternoon: { start: string; end: string };
  };
  selections: MacroPeriodSelection[];
  can_edit: boolean;
}
