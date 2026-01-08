export type MacroPeriodStatus =
  | "AGUARDANDO"
  | "RESPONDIDO"
  | "EDICAO_LIBERADA"
  | "CONFIRMADO"
  | "CANCELADO"
  | "EXPIRADO";

export type Priority = "BAIXA" | "NORMAL" | "ALTA" | "URGENTE";

export type PartOfDay = "MORNING" | "AFTERNOON" | "FULL_DAY" | "CUSTOM";

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

export interface MacroPeriodUnit {
  id: number;
  macro_period_id: number;
  unit_id: number;
  unit_name: string;
  unit_city: string;
  total_days: number;
  order_position?: number;
  config_turnos: {
    morning: { start: string; end: string };
    afternoon: { start: string; end: string };
  };
}

export interface MacroPeriodSelection {
  id?: number;
  macro_period_unit_id?: number;
  date: string;
  part_of_day: PartOfDay;
  custom_start?: string;
  custom_end?: string;
  block_id?: string;
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
  doctor_name: string;
  units: Array<{
    unit_name: string;
    unit_city: string;
    total_days: number;
  }>;
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
  doctor_name: string;
  start_date: string;
  end_date: string;
  status: MacroPeriodStatus;
  units: MacroPeriodUnit[];
  selections: MacroPeriodSelection[];
  can_edit: boolean;
}

export interface AdminEditEvidence {
  id: number;
  macro_period_id: number;
  file_path: string;
  original_filename?: string;
  file_size?: number;
  mime_type?: string;
  notes?: string;
  uploaded_by: string;
  uploaded_at: string;
}

export interface EnableAdminEditResponse {
  token: string;
  expires_at: string;
}
