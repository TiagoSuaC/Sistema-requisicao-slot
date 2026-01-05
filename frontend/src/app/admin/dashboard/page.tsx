"use client";

import { useState, useEffect } from "react";
import { getDashboardMetrics } from "@/lib/api";

interface AnaliseMedico {
  medico_id: number;
  medico_nome: string;
  total_solicitacoes: number;
  total_respondidas: number;
  taxa_resposta: number;
  tempo_medio_resposta: number | null;
  aguardando: number;
  urgentes: number;
  ultima_resposta: string | null;
  dias_desde_ultima_resposta: number | null;
}

interface DashboardMetrics {
  periodo: {
    inicio: string;
    fim: string;
  };
  totais: {
    total_periodos: number;
    aguardando: number;
    respondido: number;
    edicao_liberada: number;
    confirmado: number;
    cancelado: number;
    urgentes: number;
  };
  metricas: {
    taxa_resposta: number;
    tempo_medio_resposta: number;
  };
  distribuicao_status: Record<string, number>;
  top_medicos_rapidos: Array<{ nome: string; tempo_medio_dias: number }>;
  top_medicos_lentos: Array<{ nome: string; tempo_medio_dias: number }>;
  tendencia_semanal: Array<{ periodo: string; total: number }>;
  analise_por_medico: AnaliseMedico[];
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [quickFilter, setQuickFilter] = useState("30");
  const [sortField, setSortField] = useState<keyof AnaliseMedico>("urgentes");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [showOnlyPendentes, setShowOnlyPendentes] = useState(false);

  useEffect(() => {
    loadMetrics();
  }, [startDate, endDate]);

  const loadMetrics = async () => {
    try {
      const params: any = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const data = await getDashboardMetrics(params);
      setMetrics(data);
    } catch (error) {
      console.error("Error loading metrics:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFilter = (days: string) => {
    setQuickFilter(days);
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - parseInt(days));

    setEndDate(end.toISOString().split("T")[0]);
    setStartDate(start.toISOString().split("T")[0]);
  };

  const handleSort = (field: keyof AnaliseMedico) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const getTaxaRespostaColor = (taxa: number) => {
    if (taxa >= 80) return "text-green-600 font-semibold";
    if (taxa >= 50) return "text-yellow-600 font-semibold";
    return "text-red-600 font-semibold";
  };

  const getTempoMedioColor = (tempo: number | null) => {
    if (tempo === null) return "text-gray-500";
    if (tempo < 2) return "text-green-600 font-semibold";
    if (tempo <= 5) return "text-yellow-600 font-semibold";
    return "text-red-600 font-semibold";
  };

  const getSortedAndFilteredMedicos = () => {
    if (!metrics) return [];

    let filtered = metrics.analise_por_medico;

    // Filtrar apenas pendentes
    if (showOnlyPendentes) {
      filtered = filtered.filter((m) => m.aguardando > 0);
    }

    // Ordenar
    return [...filtered].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];

      if (aVal === null && bVal === null) return 0;
      if (aVal === null) return 1;
      if (bVal === null) return -1;

      if (sortDirection === "asc") {
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      } else {
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
      }
    });
  };

  if (loading) {
    return <div className="p-4">Carregando métricas...</div>;
  }

  if (!metrics) {
    return <div className="p-4">Erro ao carregar métricas</div>;
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard Gerencial</h1>
          <p className="mt-2 text-sm text-gray-700">
            Visão consolidada de métricas e indicadores
          </p>
        </div>
      </div>

      {/* Filtros de Período */}
      <div className="bg-white shadow rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Filtro Rápido</label>
            <select
              value={quickFilter}
              onChange={(e) => handleQuickFilter(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm px-3 py-2 border"
            >
              <option value="7">Últimos 7 dias</option>
              <option value="30">Últimos 30 dias</option>
              <option value="60">Últimos 60 dias</option>
              <option value="90">Últimos 90 dias</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Data Início</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setQuickFilter("");
              }}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm px-3 py-2 border"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Data Fim</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setQuickFilter("");
              }}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm px-3 py-2 border"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">&nbsp;</label>
            <button
              onClick={() => {
                setStartDate("");
                setEndDate("");
                setQuickFilter("30");
                handleQuickFilter("30");
              }}
              className="mt-1 w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Limpar
            </button>
          </div>
        </div>
        <div className="mt-2 text-xs text-gray-500">
          Período: {new Date(metrics.periodo.inicio).toLocaleDateString("pt-BR")} até{" "}
          {new Date(metrics.periodo.fim).toLocaleDateString("pt-BR")}
        </div>
      </div>

      {/* Cards de KPIs */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-1">
                <dt className="text-sm font-medium text-gray-500 truncate">Total de Períodos</dt>
                <dd className="mt-1 text-3xl font-semibold text-gray-900">
                  {metrics.totais.total_periodos}
                </dd>
              </div>
              <div className="text-4xl">📊</div>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 overflow-hidden shadow rounded-lg border border-yellow-200">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-1">
                <dt className="text-sm font-medium text-yellow-700 truncate">Aguardando Resposta</dt>
                <dd className="mt-1 text-3xl font-semibold text-yellow-900">
                  {metrics.totais.aguardando}
                </dd>
              </div>
              <div className="text-4xl">⏳</div>
            </div>
          </div>
        </div>

        <div className="bg-red-50 overflow-hidden shadow rounded-lg border border-red-200">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-1">
                <dt className="text-sm font-medium text-red-700 truncate">Urgentes (&gt; 3 dias)</dt>
                <dd className="mt-1 text-3xl font-semibold text-red-900">
                  {metrics.totais.urgentes}
                </dd>
              </div>
              <div className="text-4xl">🚨</div>
            </div>
          </div>
        </div>

        <div className="bg-green-50 overflow-hidden shadow rounded-lg border border-green-200">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-1">
                <dt className="text-sm font-medium text-green-700 truncate">Taxa de Resposta</dt>
                <dd className="mt-1 text-3xl font-semibold text-green-900">
                  {metrics.metricas.taxa_resposta}%
                </dd>
              </div>
              <div className="text-4xl">✅</div>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 overflow-hidden shadow rounded-lg border border-blue-200">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-1">
                <dt className="text-sm font-medium text-blue-700 truncate">Tempo Médio Resposta</dt>
                <dd className="mt-1 text-3xl font-semibold text-blue-900">
                  {metrics.metricas.tempo_medio_resposta} dias
                </dd>
              </div>
              <div className="text-4xl">⏱️</div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-1">
                <dt className="text-sm font-medium text-gray-500 truncate">Precisa Revisar</dt>
                <dd className="mt-1 text-3xl font-semibold text-gray-900">
                  {metrics.totais.respondido + metrics.totais.edicao_liberada}
                </dd>
              </div>
              <div className="text-4xl">📥</div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-1">
                <dt className="text-sm font-medium text-gray-500 truncate">Confirmados</dt>
                <dd className="mt-1 text-3xl font-semibold text-gray-900">
                  {metrics.totais.confirmado}
                </dd>
              </div>
              <div className="text-4xl">✔️</div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-1">
                <dt className="text-sm font-medium text-gray-500 truncate">Cancelados</dt>
                <dd className="mt-1 text-3xl font-semibold text-gray-900">
                  {metrics.totais.cancelado}
                </dd>
              </div>
              <div className="text-4xl">❌</div>
            </div>
          </div>
        </div>
      </div>

      {/* Gráficos e Tabelas */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Tendência Semanal */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Tendência Semanal</h3>
          <div className="space-y-3">
            {metrics.tendencia_semanal.map((item, idx) => (
              <div key={idx}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">{item.periodo}</span>
                  <span className="font-semibold">{item.total}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{
                      width: `${
                        Math.max(...metrics.tendencia_semanal.map((i) => i.total)) > 0
                          ? (item.total /
                              Math.max(...metrics.tendencia_semanal.map((i) => i.total))) *
                            100
                          : 0
                      }%`,
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Distribuição por Status */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Distribuição por Status</h3>
          <div className="space-y-3">
            {Object.entries(metrics.distribuicao_status).map(([status, count]) => {
              const statusLabels: Record<string, string> = {
                AGUARDANDO: "Aguardando",
                RESPONDIDO: "Respondido",
                EDICAO_LIBERADA: "Edição Liberada",
                CONFIRMADO: "Confirmado",
                CANCELADO: "Cancelado",
              };
              const statusColors: Record<string, string> = {
                AGUARDANDO: "bg-yellow-500",
                RESPONDIDO: "bg-green-500",
                EDICAO_LIBERADA: "bg-blue-500",
                CONFIRMADO: "bg-gray-500",
                CANCELADO: "bg-red-500",
              };
              return (
                <div key={status}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{statusLabels[status] || status}</span>
                    <span className="font-semibold">{count}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`${statusColors[status]} h-2 rounded-full`}
                      style={{
                        width: `${
                          metrics.totais.total_periodos > 0
                            ? (count / metrics.totais.total_periodos) * 100
                            : 0
                        }%`,
                      }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Médicos Mais Rápidos */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">🏆 Top 5 Médicos Mais Rápidos</h3>
          {metrics.top_medicos_rapidos.length > 0 ? (
            <div className="space-y-2">
              {metrics.top_medicos_rapidos.map((medico, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center p-3 bg-green-50 rounded border border-green-200"
                >
                  <span className="font-medium text-gray-900">
                    {idx + 1}. {medico.nome}
                  </span>
                  <span className="text-sm text-green-700 font-semibold">
                    {medico.tempo_medio_dias} dias
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Sem dados suficientes</p>
          )}
        </div>

        {/* Top Médicos Mais Lentos */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">⚠️ Top 5 Médicos Mais Lentos</h3>
          {metrics.top_medicos_lentos.length > 0 ? (
            <div className="space-y-2">
              {metrics.top_medicos_lentos.map((medico, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center p-3 bg-red-50 rounded border border-red-200"
                >
                  <span className="font-medium text-gray-900">
                    {idx + 1}. {medico.nome}
                  </span>
                  <span className="text-sm text-red-700 font-semibold">
                    {medico.tempo_medio_dias} dias
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Sem dados suficientes</p>
          )}
        </div>
      </div>

      {/* Análise por Médico */}
      <div className="mt-8 bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Análise Estratégica por Médico</h2>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showOnlyPendentes}
              onChange={(e) => setShowOnlyPendentes(e.target.checked)}
              className="rounded"
            />
            <span>Apenas com pendências</span>
          </label>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("medico_nome")}
                >
                  Médico {sortField === "medico_nome" && (sortDirection === "asc" ? "↑" : "↓")}
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("total_solicitacoes")}
                >
                  Enviado {sortField === "total_solicitacoes" && (sortDirection === "asc" ? "↑" : "↓")}
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("total_respondidas")}
                >
                  Respondido {sortField === "total_respondidas" && (sortDirection === "asc" ? "↑" : "↓")}
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("taxa_resposta")}
                >
                  Taxa % {sortField === "taxa_resposta" && (sortDirection === "asc" ? "↑" : "↓")}
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("tempo_medio_resposta")}
                >
                  Tempo Médio {sortField === "tempo_medio_resposta" && (sortDirection === "asc" ? "↑" : "↓")}
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("aguardando")}
                >
                  Aguardando {sortField === "aguardando" && (sortDirection === "asc" ? "↑" : "↓")}
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("urgentes")}
                >
                  Urgentes {sortField === "urgentes" && (sortDirection === "asc" ? "↑" : "↓")}
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("dias_desde_ultima_resposta")}
                >
                  Última Resposta {sortField === "dias_desde_ultima_resposta" && (sortDirection === "asc" ? "↑" : "↓")}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {getSortedAndFilteredMedicos().map((medico) => (
                <tr key={medico.medico_id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 text-sm font-medium text-gray-900">
                    {medico.medico_nome}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900">
                    {medico.total_solicitacoes}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900">
                    {medico.total_respondidas}
                  </td>
                  <td className={`px-4 py-4 text-sm ${getTaxaRespostaColor(medico.taxa_resposta)}`}>
                    {medico.taxa_resposta}%
                  </td>
                  <td className={`px-4 py-4 text-sm ${getTempoMedioColor(medico.tempo_medio_resposta)}`}>
                    {medico.tempo_medio_resposta !== null
                      ? `${medico.tempo_medio_resposta} dias`
                      : "-"}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900">
                    {medico.aguardando > 0 ? (
                      <span className="text-yellow-600 font-semibold">{medico.aguardando}</span>
                    ) : (
                      <span className="text-gray-500">0</span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-sm">
                    {medico.urgentes > 0 ? (
                      <span className="text-red-600 font-bold">🚨 {medico.urgentes}</span>
                    ) : (
                      <span className="text-gray-500">0</span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-500">
                    {medico.ultima_resposta ? (
                      <>
                        <div>{new Date(medico.ultima_resposta).toLocaleDateString("pt-BR")}</div>
                        {medico.dias_desde_ultima_resposta !== null && (
                          <div className="text-xs text-gray-400">
                            há {medico.dias_desde_ultima_resposta} dias
                          </div>
                        )}
                      </>
                    ) : (
                      <span className="text-gray-400">Nunca respondeu</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {getSortedAndFilteredMedicos().length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {showOnlyPendentes
                ? "Nenhum médico com pendências no período"
                : "Nenhum médico com solicitações no período"}
            </div>
          )}
        </div>

        <div className="mt-4 text-xs text-gray-500">
          <p><strong>Legenda:</strong></p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li><span className="text-green-600 font-semibold">Verde</span>: Ótimo desempenho (Taxa ≥80% ou Tempo &lt;2 dias)</li>
            <li><span className="text-yellow-600 font-semibold">Amarelo</span>: Desempenho moderado (Taxa 50-80% ou Tempo 2-5 dias)</li>
            <li><span className="text-red-600 font-semibold">Vermelho</span>: Atenção necessária (Taxa &lt;50% ou Tempo &gt;5 dias)</li>
            <li><span className="text-red-600 font-bold">🚨 Urgentes</span>: Solicitações aguardando há mais de 3 dias</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
