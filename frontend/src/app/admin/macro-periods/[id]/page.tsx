"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  getMacroPeriodDetail,
  unlockMacroPeriod,
  confirmMacroPeriod,
  cancelMacroPeriod,
  exportMacroPeriodCSV,
} from "@/lib/api";
import type { MacroPeriodDetail, AuditEvent } from "@/lib/types";

export default function MacroPeriodDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = parseInt(params.id as string);
  const [macroPeriod, setMacroPeriod] = useState<MacroPeriodDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const data = await getMacroPeriodDetail(id);
      setMacroPeriod(data);
    } catch (error) {
      console.error("Error loading macro period:", error);
      alert("Erro ao carregar macro período");
      router.push("/admin/macro-periods");
    } finally {
      setLoading(false);
    }
  };

  const handleUnlock = async () => {
    if (!confirm("Deseja liberar a edição deste macro período?")) return;
    try {
      await unlockMacroPeriod(id);
      alert("Edição liberada com sucesso!");
      loadData();
    } catch (error: any) {
      alert("Erro: " + (error.response?.data?.detail || error.message));
    }
  };

  const handleConfirm = async () => {
    if (!confirm("Deseja confirmar este macro período?")) return;
    try {
      await confirmMacroPeriod(id);
      alert("Macro período confirmado!");
      loadData();
    } catch (error: any) {
      alert("Erro: " + (error.response?.data?.detail || error.message));
    }
  };

  const handleCancel = async () => {
    if (!confirm("Deseja cancelar este macro período?")) return;
    try {
      await cancelMacroPeriod(id);
      alert("Macro período cancelado!");
      loadData();
    } catch (error: any) {
      alert("Erro: " + (error.response?.data?.detail || error.message));
    }
  };

  const handleExport = async () => {
    try {
      const blob = await exportMacroPeriodCSV(id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `macro_period_${id}_export.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      alert("Erro ao exportar: " + (error.response?.data?.detail || error.message));
    }
  };

  const copyLink = () => {
    const link = `${window.location.origin}/p/${macroPeriod?.public_token}`;
    navigator.clipboard.writeText(link);
    alert("Link copiado para a área de transferência!");
  };

  const formatEventPayload = (eventType: string, payload: any): string | null => {
    if (!payload) return null;

    switch (eventType) {
      case "CREATED":
        return `Período criado para ${payload.doctor_name} na unidade ${payload.unit_name} de ${new Date(payload.start_date).toLocaleDateString("pt-BR")} a ${new Date(payload.end_date).toLocaleDateString("pt-BR")}`;

      case "RESPONDED":
      case "UPDATED":
        const dates = payload.dates?.join(", ") || "";
        return `${payload.total_selections || 0} seleção(ões) registrada(s)${dates ? `: ${dates}` : ""}`;

      case "LINK_VIEWED":
        return "Link visualizado pelo médico";

      case "UNLOCKED":
        return "Edição liberada pelo administrador";

      case "CONFIRMED":
        return "Período confirmado pelo administrador";

      case "CANCELLED":
        return "Período cancelado pelo administrador";

      default:
        return null;
    }
  };

  if (loading) return <div className="p-4">Carregando...</div>;
  if (!macroPeriod) return <div className="p-4">Macro período não encontrado</div>;

  const diasEmAberto =
    macroPeriod.status === "AGUARDANDO"
      ? Math.floor(
          (new Date().getTime() - new Date(macroPeriod.created_at).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : null;

  const tempoAteResposta = macroPeriod.responded_at
    ? Math.floor(
        (new Date(macroPeriod.responded_at).getTime() -
          new Date(macroPeriod.created_at).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : null;

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="text-blue-600 hover:text-blue-900"
        >
          ← Voltar
        </button>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <div className="border-b pb-4 mb-4">
          <h1 className="text-2xl font-semibold">Detalhes do Macro Período</h1>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-500 mb-2">Unidades</label>
            {macroPeriod.units?.map((unit, idx) => (
              <div key={idx} className="bg-gray-50 p-3 rounded mb-2">
                <p className="font-medium">{unit.unit_name} - {unit.unit_city}</p>
                <p className="text-sm text-gray-600">
                  {unit.surgery_days}🔪 + {unit.consult_days}👨‍⚕️ dias
                  {unit.order === "SURGERY_FIRST" ? " (Cirurgias primeiro)" : " (Consultas primeiro)"}
                </p>
              </div>
            ))}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">Médico ID</label>
            <p className="mt-1 text-lg">{macroPeriod.doctor_id}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">Período</label>
            <p className="mt-1 text-lg">
              {new Date(macroPeriod.start_date).toLocaleDateString("pt-BR")} -{" "}
              {new Date(macroPeriod.end_date).toLocaleDateString("pt-BR")}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">Status</label>
            <p className="mt-1 text-lg font-semibold">{macroPeriod.status}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">Criado em</label>
            <p className="mt-1">
              {new Date(macroPeriod.created_at).toLocaleString("pt-BR")}
            </p>
            <p className="text-sm text-gray-500">Por: {macroPeriod.created_by}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">
              {diasEmAberto !== null ? "Dias em Aberto" : "Tempo até Resposta"}
            </label>
            <p className="mt-1 text-lg">
              {diasEmAberto !== null ? (
                <span className={diasEmAberto >= 4 ? "text-red-600" : ""}>
                  {diasEmAberto} dias
                </span>
              ) : tempoAteResposta !== null ? (
                <span className="text-green-600">{tempoAteResposta} dias</span>
              ) : (
                "-"
              )}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mb-6 flex-wrap">
          <button
            onClick={copyLink}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Copiar Link
          </button>
          <button
            onClick={handleUnlock}
            disabled={!["RESPONDIDO", "CONFIRMADO"].includes(macroPeriod.status)}
            className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Liberar Edição
          </button>
          <button
            onClick={handleConfirm}
            disabled={!["RESPONDIDO", "EDICAO_LIBERADA"].includes(macroPeriod.status)}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Confirmar
          </button>
          <button
            onClick={handleCancel}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Cancelar
          </button>
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Exportar CSV
          </button>
        </div>

        {/* Selections */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3">Resposta do Médico</h2>
          {macroPeriod.selections.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Data
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Tipo
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Período
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Horário
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {macroPeriod.selections.map((selection, idx) => (
                    <tr key={idx}>
                      <td className="px-4 py-2 text-sm">
                        {new Date(selection.date).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="px-4 py-2 text-sm">
                        {selection.type === "SURGERY" ? "Cirurgia" : "Consulta"}
                      </td>
                      <td className="px-4 py-2 text-sm">
                        {selection.part_of_day === "MORNING"
                          ? "Manhã"
                          : selection.part_of_day === "AFTERNOON"
                          ? "Tarde"
                          : selection.part_of_day === "FULL_DAY"
                          ? "Dia Inteiro"
                          : "Customizado"}
                      </td>
                      <td className="px-4 py-2 text-sm">
                        {selection.custom_start && selection.custom_end
                          ? `${selection.custom_start} - ${selection.custom_end}`
                          : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500">Nenhuma seleção registrada ainda</p>
          )}
        </div>

        {/* Audit Trail */}
        <div>
          <h2 className="text-lg font-semibold mb-3">Histórico de Eventos</h2>
          <div className="space-y-2">
            {macroPeriod.audit_events.map((event: AuditEvent) => (
              <div key={event.id} className="border-l-4 border-blue-500 pl-4 py-2">
                <div className="flex justify-between">
                  <span className="font-medium">{event.event_type}</span>
                  <span className="text-sm text-gray-500">
                    {new Date(event.created_at).toLocaleString("pt-BR")}
                  </span>
                </div>
                <div className="text-sm text-gray-600">Por: {event.created_by}</div>
                {formatEventPayload(event.event_type, event.payload) && (
                  <div className="text-sm text-gray-600 mt-1">
                    {formatEventPayload(event.event_type, event.payload)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
