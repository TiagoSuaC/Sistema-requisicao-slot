"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  createMacroPeriod,
  getMacroPeriods,
  getUnits,
  getDoctors,
  exportBatchCSV,
  inactivateBatchMacroPeriods,
} from "@/lib/api";
import type {
  MacroPeriodListItem,
  Unit,
  Doctor,
  MacroPeriodStatus,
} from "@/lib/types";

export default function MacroPeriodsPage() {
  const router = useRouter();
  const [macroPeriods, setMacroPeriods] = useState<MacroPeriodListItem[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    doctor_id: "",
    start_date: "",
    end_date: "",
    priority: "NORMAL",
    deadline: "",
    units: [
      { unit_id: "", total_days: 0 }
    ]
  });

  // Função para calcular deadline padrão (hoje + 2 dias)
  const getDefaultDeadline = () => {
    const today = new Date();
    const deadline = new Date(today);
    deadline.setDate(today.getDate() + 2);
    return deadline.toISOString().split('T')[0]; // Formato YYYY-MM-DD
  };

  // Filters
  const [filterUnit, setFilterUnit] = useState("");
  const [filterDoctor, setFilterDoctor] = useState("");
  const [filterStatus, setFilterStatus] = useState<MacroPeriodStatus | "">("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [quickMonth, setQuickMonth] = useState("");
  const [sortByDiasAberto, setSortByDiasAberto] = useState(false);
  const [activeTab, setActiveTab] = useState<"aguardando" | "revisar" | "concluido" | "inativos" | "todos">("aguardando");
  const [selectedPeriods, setSelectedPeriods] = useState<number[]>([]);

  useEffect(() => {
    loadData();
  }, [filterUnit, filterDoctor, filterStatus, filterStartDate, filterEndDate]);

  const loadData = async () => {
    try {
      const [periodsData, unitsData, doctorsData] = await Promise.all([
        getMacroPeriods({
          unit_id: filterUnit || undefined,
          doctor_id: filterDoctor || undefined,
          status: filterStatus || undefined,
          start_date: filterStartDate || undefined,
          end_date: filterEndDate || undefined,
        }),
        getUnits(),
        getDoctors(),
      ]);
      setMacroPeriods(periodsData);
      setUnits(unitsData);
      setDoctors(doctorsData);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const addUnit = () => {
    setFormData({
      ...formData,
      units: [...formData.units, { unit_id: "", total_days: 0 }]
    });
  };

  const removeUnit = (index: number) => {
    if (formData.units.length === 1) {
      alert("Precisa ter pelo menos 1 unidade");
      return;
    }
    setFormData({
      ...formData,
      units: formData.units.filter((_, i) => i !== index)
    });
  };

  const updateUnit = (index: number, field: string, value: any) => {
    const newUnits = [...formData.units];
    newUnits[index] = { ...newUnits[index], [field]: value };
    setFormData({ ...formData, units: newUnits });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Validate units
      for (const unit of formData.units) {
        if (!unit.unit_id) {
          alert("Todas as unidades devem ter uma unidade selecionada");
          return;
        }
        if (unit.total_days === 0) {
          alert("Cada unidade deve ter pelo menos 1 dia");
          return;
        }
      }

      const payload: any = {
        doctor_id: parseInt(formData.doctor_id),
        start_date: formData.start_date,
        end_date: formData.end_date,
        units: formData.units.map(u => ({
          unit_id: parseInt(u.unit_id),
          total_days: parseInt(u.total_days.toString())
        })),
        priority: formData.priority,
      };

      if (formData.deadline)
        payload.deadline = formData.deadline;

      const result = await createMacroPeriod(payload);

      // Copy link to clipboard
      const link = `${window.location.origin}/p/${result.public_token}`;
      await navigator.clipboard.writeText(link);

      alert(`Macro Período criado com sucesso!\n\nLink copiado para a área de transferência:\n${link}`);

      setShowForm(false);
      setFormData({
        doctor_id: "",
        start_date: "",
        end_date: "",
        priority: "NORMAL",
        deadline: "",
        units: [{ unit_id: "", total_days: 0 }]
      });
      loadData();
    } catch (error: any) {
      alert("Erro ao criar macro período: " + (error.response?.data?.detail || error.message));
    }
  };

  const getStatusBadge = (status: MacroPeriodStatus) => {
    const colors = {
      AGUARDANDO: "bg-yellow-100 text-yellow-800",
      RESPONDIDO: "bg-green-100 text-green-800",
      EDICAO_LIBERADA: "bg-blue-100 text-blue-800",
      CONFIRMADO: "bg-gray-100 text-gray-800",
      CANCELADO: "bg-red-100 text-red-800",
      EXPIRADO: "bg-gray-100 text-gray-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getStatusLabel = (status: MacroPeriodStatus) => {
    const labels = {
      AGUARDANDO: "Aguardando",
      RESPONDIDO: "Respondido",
      EDICAO_LIBERADA: "Edição Liberada",
      CONFIRMADO: "Confirmado",
      CANCELADO: "Cancelado",
      EXPIRADO: "Expirado",
    };
    return labels[status] || status;
  };

  const getPriorityBadge = (priority: string) => {
    const colors = {
      BAIXA: "bg-gray-100 text-gray-800",
      NORMAL: "bg-blue-100 text-blue-800",
      ALTA: "bg-orange-100 text-orange-800",
      URGENTE: "bg-red-100 text-red-800",
    };
    const labels = {
      BAIXA: "Baixa",
      NORMAL: "Normal",
      ALTA: "Alta",
      URGENTE: "Urgente",
    };
    return { color: colors[priority] || colors.NORMAL, label: labels[priority] || priority };
  };

  const handleCopyLink = async (publicToken: string) => {
    try {
      const link = `${window.location.origin}/p/${publicToken}`;
      await navigator.clipboard.writeText(link);
      alert("Link copiado para a área de transferência!");
    } catch (error) {
      alert("Erro ao copiar link. Por favor, tente novamente.");
    }
  };

  const handleQuickMonthSelect = (value: string) => {
    setQuickMonth(value);

    if (!value) {
      setFilterStartDate("");
      setFilterEndDate("");
      return;
    }

    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    if (value === "current") {
      // Este mês
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    } else if (value === "last") {
      // Mês passado
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      endDate = new Date(now.getFullYear(), now.getMonth(), 0);
    } else {
      // Formato "YYYY-MM"
      const [year, month] = value.split("-").map(Number);
      startDate = new Date(year, month - 1, 1);
      endDate = new Date(year, month, 0);
    }

    setFilterStartDate(startDate.toISOString().split("T")[0]);
    setFilterEndDate(endDate.toISOString().split("T")[0]);
  };

  const handleClearFilters = () => {
    setFilterUnit("");
    setFilterDoctor("");
    setFilterStatus("");
    setFilterStartDate("");
    setFilterEndDate("");
    setQuickMonth("");
    setSortByDiasAberto(false);
  };

  const handleToggleSelection = (id: number) => {
    setSelectedPeriods((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]
    );
  };

  const handleToggleAll = () => {
    if (selectedPeriods.length === sortedPeriods.length) {
      setSelectedPeriods([]);
    } else {
      setSelectedPeriods(sortedPeriods.map((p) => p.id));
    }
  };

  const handleBatchExport = async () => {
    if (selectedPeriods.length === 0) {
      alert("Selecione pelo menos um período para exportar");
      return;
    }

    try {
      const blob = await exportBatchCSV(selectedPeriods);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `macro_periods_batch_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      alert(`${selectedPeriods.length} período(s) exportado(s) com sucesso!`);
      setSelectedPeriods([]);
    } catch (error: any) {
      alert("Erro ao exportar: " + (error.response?.data?.detail || error.message));
    }
  };

  const handleBatchInactivate = async () => {
    if (selectedPeriods.length === 0) {
      alert("Selecione pelo menos um período para inativar");
      return;
    }

    // Verificar se todas as seleções são AGUARDANDO
    const selectedItems = macroPeriods.filter(p => selectedPeriods.includes(p.id));
    const nonAguardando = selectedItems.filter(p => p.status !== "AGUARDANDO");

    if (nonAguardando.length > 0) {
      alert(`Não é possível inativar período(s) com status diferente de AGUARDANDO.\n${nonAguardando.length} período(s) não pode(m) ser inativado(s).`);
      return;
    }

    if (!confirm(`Tem certeza que deseja inativar ${selectedPeriods.length} período(s)?\n\nEsta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      const result = await inactivateBatchMacroPeriods(selectedPeriods);

      if (result.total_failed > 0) {
        alert(
          `${result.total_success} período(s) inativado(s) com sucesso.\n` +
          `${result.total_failed} período(s) falharam.`
        );
      } else {
        alert(`${result.total_success} período(s) inativado(s) com sucesso!`);
      }

      setSelectedPeriods([]);
      loadData(); // Recarregar lista
    } catch (error: any) {
      alert("Erro ao inativar: " + (error.response?.data?.detail || error.message));
    }
  };

  const handleTabChange = (tab: "aguardando" | "revisar" | "concluido" | "inativos" | "todos") => {
    setActiveTab(tab);
    // Abas fazem filtragem apenas no frontend (via filteredByTab)
    // Não alterar filterStatus para não recarregar dados do backend
    if (tab === "aguardando") {
      setSortByDiasAberto(true);
    } else {
      setSortByDiasAberto(false);
    }
  };

  // Calcular contadores por tab
  const tabCounts = {
    aguardando: macroPeriods.filter(p => p.status === "AGUARDANDO").length,
    aguardandoUrgente: macroPeriods.filter(p => p.status === "AGUARDANDO" && p.dias_em_aberto !== null && p.dias_em_aberto >= 3).length,
    revisar: macroPeriods.filter(p => p.status === "RESPONDIDO" || p.status === "EDICAO_LIBERADA").length,
    concluido: macroPeriods.filter(p => p.status === "CONFIRMADO" || p.status === "EXPIRADO").length,
    inativos: macroPeriods.filter(p => p.status === "CANCELADO").length,
    todos: macroPeriods.length
  };

  // Filtrar períodos baseado na tab ativa
  const filteredByTab = macroPeriods.filter(period => {
    if (activeTab === "aguardando") return period.status === "AGUARDANDO";
    if (activeTab === "revisar") return period.status === "RESPONDIDO" || period.status === "EDICAO_LIBERADA";
    if (activeTab === "concluido") return period.status === "CONFIRMADO" || period.status === "EXPIRADO";
    if (activeTab === "inativos") return period.status === "CANCELADO";
    return true; // todos
  });

  // Aplicar ordenação no frontend (se habilitado)
  const sortedPeriods = sortByDiasAberto
    ? [...filteredByTab].sort((a, b) => {
        const diasA = a.dias_em_aberto ?? -1;
        const diasB = b.dias_em_aberto ?? -1;
        return diasB - diasA; // Decrescente: maiores dias em aberto primeiro
      })
    : filteredByTab;

  if (loading) {
    return <div className="p-4">Carregando...</div>;
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Macro Períodos</h1>
          <p className="mt-2 text-sm text-gray-700">
            Gerencie os macro períodos de disponibilidade dos médicos
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            onClick={() => {
              if (!showForm) {
                // Ao abrir o formulário, preencher deadline com data + 2 dias
                setFormData({
                  ...formData,
                  deadline: getDefaultDeadline()
                });
              }
              setShowForm(!showForm);
            }}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
          >
            {showForm ? "Cancelar" : "Criar Macro Período"}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="mt-6 bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium mb-4">Novo Macro Período</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Médico *
                </label>
                <select
                  required
                  value={formData.doctor_id}
                  onChange={(e) => setFormData({ ...formData, doctor_id: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm px-3 py-2 border"
                >
                  <option value="">Selecione um médico</option>
                  {doctors.map((doctor) => (
                    <option key={doctor.id} value={doctor.id}>
                      {doctor.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Prioridade *
                </label>
                <select
                  required
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm px-3 py-2 border"
                >
                  <option value="BAIXA">Baixa</option>
                  <option value="NORMAL">Normal</option>
                  <option value="ALTA">Alta</option>
                  <option value="URGENTE">Urgente</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Data Início *
                </label>
                <input
                  type="date"
                  required
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm px-3 py-2 border"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Data Fim *
                </label>
                <input
                  type="date"
                  required
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm px-3 py-2 border"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Deadline para Resposta
                </label>
                <input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm px-3 py-2 border"
                />
                <p className="mt-1 text-xs text-gray-500">Padrão: 2 dias a partir do envio</p>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="mb-4">
                <h3 className="text-md font-medium text-gray-900">Unidades *</h3>
              </div>

              <div className="space-y-4">
                {formData.units.map((unit, index) => (
                  <div key={index} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-medium text-gray-700">Unidade {index + 1}</h4>
                      {formData.units.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeUnit(index)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Remover
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Unidade *
                        </label>
                        <select
                          required
                          value={unit.unit_id}
                          onChange={(e) => updateUnit(index, 'unit_id', e.target.value)}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm px-3 py-2 border"
                        >
                          <option value="">Selecione</option>
                          {units.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.name} - {u.city}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Total de Dias *
                        </label>
                        <input
                          type="number"
                          min="1"
                          required
                          value={unit.total_days}
                          onChange={(e) => updateUnit(index, 'total_days', parseInt(e.target.value) || 0)}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm px-3 py-2 border"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t pt-4 pb-4">
              <button
                type="button"
                onClick={addUnit}
                className="w-full inline-flex justify-center items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
              >
                ➕ Adicionar Unidade
              </button>
            </div>

            <div className="border-t pt-4">
              <button
                type="submit"
                className="w-full inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
              >
                Criar e Gerar Link
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tabs para Filtro Rápido */}
      <div className="mt-6 bg-white shadow rounded-lg overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => handleTabChange("aguardando")}
              className={`flex-1 py-4 px-1 text-center border-b-2 font-medium text-sm ${
                activeTab === "aguardando"
                  ? "border-yellow-500 text-yellow-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              ⏳ Aguardando Resposta
              <span className={`ml-2 py-0.5 px-2.5 rounded-full text-xs ${
                activeTab === "aguardando" ? "bg-yellow-100 text-yellow-800" : "bg-gray-100 text-gray-800"
              }`}>
                {tabCounts.aguardando}
              </span>
              {tabCounts.aguardandoUrgente > 0 && (
                <span className="ml-1 py-0.5 px-2 rounded-full text-xs bg-red-100 text-red-800 font-bold">
                  🚨 {tabCounts.aguardandoUrgente}
                </span>
              )}
            </button>
            <button
              onClick={() => handleTabChange("revisar")}
              className={`flex-1 py-4 px-1 text-center border-b-2 font-medium text-sm ${
                activeTab === "revisar"
                  ? "border-green-500 text-green-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              📥 Precisa Revisar
              <span className={`ml-2 py-0.5 px-2.5 rounded-full text-xs ${
                activeTab === "revisar" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
              }`}>
                {tabCounts.revisar}
              </span>
            </button>
            <button
              onClick={() => handleTabChange("concluido")}
              className={`flex-1 py-4 px-1 text-center border-b-2 font-medium text-sm ${
                activeTab === "concluido"
                  ? "border-gray-500 text-gray-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              ✅ Concluído
              <span className={`ml-2 py-0.5 px-2.5 rounded-full text-xs ${
                activeTab === "concluido" ? "bg-gray-200 text-gray-800" : "bg-gray-100 text-gray-800"
              }`}>
                {tabCounts.concluido}
              </span>
            </button>
            <button
              onClick={() => handleTabChange("inativos")}
              className={`flex-1 py-4 px-1 text-center border-b-2 font-medium text-sm ${
                activeTab === "inativos"
                  ? "border-red-500 text-red-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              🚫 Inativos
              <span className={`ml-2 py-0.5 px-2.5 rounded-full text-xs ${
                activeTab === "inativos" ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-800"
              }`}>
                {tabCounts.inativos}
              </span>
            </button>
            <button
              onClick={() => handleTabChange("todos")}
              className={`flex-1 py-4 px-1 text-center border-b-2 font-medium text-sm ${
                activeTab === "todos"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              📋 Todos
              <span className={`ml-2 py-0.5 px-2.5 rounded-full text-xs ${
                activeTab === "todos" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"
              }`}>
                {tabCounts.todos}
              </span>
            </button>
          </nav>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-6 bg-white shadow rounded-lg p-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Unidade</label>
            <select
              value={filterUnit}
              onChange={(e) => setFilterUnit(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm px-3 py-2 border"
            >
              <option value="">Todas</option>
              {units.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Médico</label>
            <select
              value={filterDoctor}
              onChange={(e) => setFilterDoctor(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm px-3 py-2 border"
            >
              <option value="">Todos</option>
              {doctors.map((doctor) => (
                <option key={doctor.id} value={doctor.id}>
                  {doctor.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as MacroPeriodStatus | "")}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm px-3 py-2 border"
            >
              <option value="">Todos</option>
              <option value="AGUARDANDO">Aguardando</option>
              <option value="RESPONDIDO">Respondido</option>
              <option value="EDICAO_LIBERADA">Edição Liberada</option>
              <option value="CONFIRMADO">Confirmado</option>
              <option value="CANCELADO">Cancelado</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Ordenação</label>
            <label className="mt-2 flex items-center">
              <input
                type="checkbox"
                checked={sortByDiasAberto}
                onChange={(e) => setSortByDiasAberto(e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm">Dias em aberto (desc)</span>
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Data Início</label>
            <input
              type="date"
              value={filterStartDate}
              onChange={(e) => setFilterStartDate(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm px-3 py-2 border"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Data Fim</label>
            <input
              type="date"
              value={filterEndDate}
              onChange={(e) => setFilterEndDate(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm px-3 py-2 border"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Seleção Rápida</label>
            <select
              value={quickMonth}
              onChange={(e) => handleQuickMonthSelect(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm px-3 py-2 border"
            >
              <option value="">Nenhum</option>
              <option value="current">Este mês</option>
              <option value="last">Mês passado</option>
              <option value="2025-12">Dezembro 2025</option>
              <option value="2025-11">Novembro 2025</option>
              <option value="2025-10">Outubro 2025</option>
              <option value="2025-09">Setembro 2025</option>
              <option value="2025-08">Agosto 2025</option>
              <option value="2025-07">Julho 2025</option>
              <option value="2025-06">Junho 2025</option>
              <option value="2025-05">Maio 2025</option>
              <option value="2025-04">Abril 2025</option>
              <option value="2025-03">Março 2025</option>
              <option value="2025-02">Fevereiro 2025</option>
              <option value="2025-01">Janeiro 2025</option>
              <option value="2024-12">Dezembro 2024</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">&nbsp;</label>
            <button
              onClick={handleClearFilters}
              className="mt-1 w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Limpar Filtros
            </button>
          </div>
        </div>
      </div>

      {/* Export Batch Button */}
      {selectedPeriods.length > 0 && (
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
          <span className="text-blue-700 font-medium">
            {selectedPeriods.length} período(s) selecionado(s)
          </span>
          <div className="flex gap-2">
            <button
              onClick={handleBatchExport}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              📥 Exportar Selecionados
            </button>
            <button
              onClick={handleBatchInactivate}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              🚫 Inativar Selecionados ({selectedPeriods.length})
            </button>
            <button
              onClick={() => setSelectedPeriods([])}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
            >
              Limpar Seleção
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="mt-6 bg-white shadow rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                <input
                  type="checkbox"
                  checked={selectedPeriods.length === sortedPeriods.length && sortedPeriods.length > 0}
                  onChange={handleToggleAll}
                  className="rounded"
                />
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Médico
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Unidades
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Período
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Prioridade
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Dias em Aberto
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-32">
                Última Ação
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedPeriods.map((period) => {
              const isUrgent = period.dias_em_aberto !== null && period.dias_em_aberto !== undefined && period.dias_em_aberto >= 3;
              return (
              <tr
                key={period.id}
                className={`${isUrgent ? "bg-red-50 hover:bg-red-100" : "hover:bg-gray-50"}`}
              >
                <td className="px-3 py-4 whitespace-nowrap text-sm">
                  <input
                    type="checkbox"
                    checked={selectedPeriods.includes(period.id)}
                    onChange={() => handleToggleSelection(period.id)}
                    className="rounded"
                  />
                </td>
                <td className="px-4 py-4 text-sm">
                  {period.doctor_name}
                </td>
                <td className="px-4 py-4 text-sm">
                  {period.units.map((u, idx) => (
                    <div key={idx} className="mb-1">
                      <span className="font-medium">{u.unit_name}</span>
                      <span className="text-gray-500"> - {u.unit_city}</span>
                      <div className="text-xs text-gray-600">
                        {u.total_days} {u.total_days === 1 ? 'dia' : 'dias'}
                      </div>
                    </div>
                  ))}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm">
                  {new Date(period.start_date).toLocaleDateString("pt-BR")} -{" "}
                  {new Date(period.end_date).toLocaleDateString("pt-BR")}
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(
                      period.status
                    )}`}
                  >
                    {getStatusLabel(period.status)}
                  </span>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityBadge(period.priority).color}`}
                  >
                    {getPriorityBadge(period.priority).label}
                  </span>
                  {period.deadline && (
                    <div className="text-xs text-gray-500 mt-1">
                      Prazo: {new Date(period.deadline + "T00:00:00").toLocaleDateString("pt-BR")}
                    </div>
                  )}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm">
                  {period.dias_em_aberto !== null && period.dias_em_aberto !== undefined ? (
                    <span
                      className={
                        period.dias_em_aberto >= 3
                          ? "text-red-600 font-semibold"
                          : "text-gray-900"
                      }
                    >
                      {period.dias_em_aberto >= 3 && "🚨 "}
                      {period.dias_em_aberto} dias
                    </span>
                  ) : period.tempo_ate_resposta !== null &&
                    period.tempo_ate_resposta !== undefined ? (
                    <span className="text-green-600">
                      Respondido em {period.tempo_ate_resposta} dias
                    </span>
                  ) : (
                    "-"
                  )}
                </td>
                <td className="px-4 py-4 text-sm text-gray-500 w-32">
                  {period.status === "AGUARDANDO" ? (
                    <>
                      <div className="font-medium text-gray-700">Enviado</div>
                      <div className="text-xs">{new Date(period.created_at).toLocaleDateString("pt-BR")} {new Date(period.created_at).toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' })}</div>
                    </>
                  ) : period.responded_at ? (
                    <>
                      <div className="font-medium text-gray-700">Respondido</div>
                      <div className="text-xs">{new Date(period.responded_at).toLocaleDateString("pt-BR")} {new Date(period.responded_at).toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' })}</div>
                    </>
                  ) : (
                    <>
                      <div className="font-medium text-gray-700">{getStatusLabel(period.status)}</div>
                      <div className="text-xs">{new Date(period.created_at).toLocaleDateString("pt-BR")}</div>
                    </>
                  )}
                </td>
                <td className="px-4 py-4 text-sm whitespace-nowrap">
                  <div className="flex flex-col gap-1">
                    {period.status === "AGUARDANDO" && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log("Navegando para edit:", period.id);
                          router.push(`/admin/macro-periods/${period.id}/edit`);
                        }}
                        className="text-orange-600 hover:text-orange-900 text-left cursor-pointer"
                        title="Editar período"
                        type="button"
                      >
                        ✏️ Editar
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleCopyLink(period.public_token);
                      }}
                      className="text-green-600 hover:text-green-900 text-left cursor-pointer"
                      title="Copiar link para enviar ao médico"
                      type="button"
                    >
                      📋 Copiar Link
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log("Navegando para detalhes:", period.id);
                        router.push(`/admin/macro-periods/${period.id}`);
                      }}
                      className="text-blue-600 hover:text-blue-900 text-left cursor-pointer"
                      title="Ver detalhes"
                      type="button"
                    >
                      👁️ Ver Detalhes
                    </button>
                  </div>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
        {sortedPeriods.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Nenhum macro período encontrado
          </div>
        )}
      </div>
    </div>
  );
}
