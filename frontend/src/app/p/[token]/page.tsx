"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { getMacroPeriodByToken, submitDoctorResponse } from "@/lib/api";
import type {
  MacroPeriodPublicView,
  MacroPeriodSelection,
  PartOfDay,
  SelectionType,
} from "@/lib/types";

export default function DoctorResponsePage() {
  const params = useParams();
  const token = params.token as string;
  const [macroPeriod, setMacroPeriod] = useState<MacroPeriodPublicView | null>(
    null
  );
  const [selections, setSelections] = useState<MacroPeriodSelection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [modalData, setModalData] = useState({
    type: "SURGERY" as SelectionType,
    part_of_day: "FULL_DAY" as PartOfDay,
    custom_start: "08:00",
    custom_end: "17:00",
  });

  useEffect(() => {
    loadData();
  }, [token]);

  const loadData = async () => {
    try {
      const data = await getMacroPeriodByToken(token);
      setMacroPeriod(data);
      setSelections(data.selections || []);
    } catch (error) {
      alert("Link inválido ou expirado");
    } finally {
      setLoading(false);
    }
  };

  const handleDayClick = (date: Date) => {
    if (!macroPeriod) return;

    // Normalize all dates to start of day for proper comparison
    const clickedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const start = new Date(macroPeriod.start_date + "T00:00:00");
    const startNormalized = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const end = new Date(macroPeriod.end_date + "T00:00:00");
    const endNormalized = new Date(end.getFullYear(), end.getMonth(), end.getDate());

    // Check if date is within range
    if (clickedDate < startNormalized || clickedDate > endNormalized) {
      alert("Essa data está fora do período permitido");
      return;
    }

    // Check if can edit
    if (!macroPeriod.can_edit) {
      alert("Este período está bloqueado para edição");
      return;
    }

    setSelectedDate(date);
    setShowModal(true);
  };

  const handleAddSelection = () => {
    if (!selectedDate) return;

    const dateStr = selectedDate.toISOString().split("T")[0];

    // Check if date already has 2 selections (max per day)
    const existingCount = selections.filter((s) => s.date === dateStr).length;
    if (existingCount >= 2) {
      alert("Máximo de 2 períodos por dia atingido");
      return;
    }

    // Validate custom times
    if (modalData.part_of_day === "CUSTOM") {
      if (modalData.custom_start >= modalData.custom_end) {
        alert("Horário de início deve ser anterior ao horário de fim");
        return;
      }
    }

    const newSelection: MacroPeriodSelection = {
      date: dateStr,
      type: modalData.type,
      part_of_day: modalData.part_of_day,
      custom_start:
        modalData.part_of_day === "CUSTOM" ? modalData.custom_start : undefined,
      custom_end:
        modalData.part_of_day === "CUSTOM" ? modalData.custom_end : undefined,
    };

    setSelections([...selections, newSelection]);
    setShowModal(false);
    setModalData({
      type: "SURGERY",
      part_of_day: "FULL_DAY",
      custom_start: "08:00",
      custom_end: "17:00",
    });
  };

  const handleRemoveSelection = (index: number) => {
    if (!macroPeriod?.can_edit) {
      alert("Este período está bloqueado para edição");
      return;
    }
    setSelections(selections.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!macroPeriod?.can_edit) {
      alert("Este período está bloqueado para edição");
      return;
    }

    if (selections.length === 0) {
      alert("Adicione pelo menos uma seleção antes de confirmar");
      return;
    }

    // Validate suggestions if provided
    const surgeryCount = selections.filter((s) => s.type === "SURGERY").length;
    const consultCount = selections.filter((s) => s.type === "CONSULT").length;

    if (
      macroPeriod.suggested_surgery_min &&
      surgeryCount < macroPeriod.suggested_surgery_min
    ) {
      if (
        !confirm(
          `Você selecionou ${surgeryCount} cirurgias, mas o mínimo sugerido é ${macroPeriod.suggested_surgery_min}. Deseja continuar?`
        )
      )
        return;
    }

    if (
      macroPeriod.suggested_consult_min &&
      consultCount < macroPeriod.suggested_consult_min
    ) {
      if (
        !confirm(
          `Você selecionou ${consultCount} consultas, mas o mínimo sugerido é ${macroPeriod.suggested_consult_min}. Deseja continuar?`
        )
      )
        return;
    }

    if (!confirm("Deseja confirmar sua disponibilidade?")) return;

    try {
      // Remove id field and ensure proper format for API
      const selectionsToSend = selections.map(s => ({
        date: s.date,
        part_of_day: s.part_of_day,
        type: s.type,
        custom_start: s.custom_start || null,
        custom_end: s.custom_end || null,
      }));

      await submitDoctorResponse(token, selectionsToSend);
      alert("Resposta enviada com sucesso!");
      loadData();
    } catch (error: any) {
      alert("Erro ao enviar resposta: " + (error.response?.data?.detail || error.message));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Carregando...
      </div>
    );
  }

  if (!macroPeriod) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Link inválido ou expirado
      </div>
    );
  }

  const startDate = new Date(macroPeriod.start_date + "T00:00:00");
  const endDate = new Date(macroPeriod.end_date + "T00:00:00");

  // Calculate if we need to show multiple months
  const numberOfMonths =
    startDate.getMonth() !== endDate.getMonth() ||
    startDate.getFullYear() !== endDate.getFullYear()
      ? 2
      : 1;

  const modifiers = {
    selected: selections.map((s) => new Date(s.date + "T00:00:00")),
    disabled: { before: startDate, after: endDate },
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h1 className="text-2xl font-bold mb-4">
            Disponibilidade de Atendimento
          </h1>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-500">
                Médico
              </label>
              <p className="text-lg">{macroPeriod.doctor_name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">
                Unidade
              </label>
              <p className="text-lg">
                {macroPeriod.unit_name} - {macroPeriod.unit_city}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">
                Período
              </label>
              <p className="text-lg">
                {new Date(macroPeriod.start_date).toLocaleDateString("pt-BR")} -{" "}
                {new Date(macroPeriod.end_date).toLocaleDateString("pt-BR")}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">
                Status
              </label>
              <p className="text-lg font-semibold">
                {macroPeriod.can_edit ? "Edição Permitida" : "Bloqueado"}
              </p>
            </div>
          </div>

          {(macroPeriod.suggested_surgery_min ||
            macroPeriod.suggested_consult_min) && (
            <div className="bg-blue-50 p-4 rounded mb-4">
              <p className="text-sm font-medium mb-2">Sugestões:</p>
              {macroPeriod.suggested_surgery_min && (
                <p className="text-sm">
                  • Cirurgias: {macroPeriod.suggested_surgery_min}
                  {macroPeriod.suggested_surgery_max &&
                    ` - ${macroPeriod.suggested_surgery_max}`}{" "}
                  dias
                </p>
              )}
              {macroPeriod.suggested_consult_min && (
                <p className="text-sm">
                  • Consultas: {macroPeriod.suggested_consult_min}
                  {macroPeriod.suggested_consult_max &&
                    ` - ${macroPeriod.suggested_consult_max}`}{" "}
                  dias
                </p>
              )}
            </div>
          )}

          <div className="bg-yellow-50 p-4 rounded">
            <p className="text-sm">
              <strong>Instruções:</strong> Clique nos dias do calendário para
              selecionar sua disponibilidade. Você pode adicionar até 2 períodos
              por dia (ex: manhã e tarde).
            </p>
          </div>
        </div>

        {/* Calendar */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Selecione os Dias</h2>
          <div className="flex justify-center">
            <DayPicker
              mode="default"
              numberOfMonths={numberOfMonths}
              selected={selections.map((s) => new Date(s.date + "T00:00:00"))}
              onDayClick={handleDayClick}
              modifiers={modifiers}
              disabled={{ before: startDate, after: endDate }}
              fromDate={startDate}
              toDate={endDate}
            />
          </div>
        </div>

        {/* Selections List */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Suas Seleções</h2>
          {selections.length > 0 ? (
            <div className="space-y-2">
              {selections.map((selection, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center border p-3 rounded"
                >
                  <div>
                    <span className="font-medium">
                      {new Date(selection.date + "T00:00:00").toLocaleDateString("pt-BR")}
                    </span>
                    {" - "}
                    <span
                      className={
                        selection.type === "SURGERY"
                          ? "text-blue-600"
                          : "text-green-600"
                      }
                    >
                      {selection.type === "SURGERY" ? "Cirurgia" : "Consulta"}
                    </span>
                    {" - "}
                    <span className="text-gray-600">
                      {selection.part_of_day === "MORNING"
                        ? `Manhã (${macroPeriod.config_turnos.morning.start} - ${macroPeriod.config_turnos.morning.end})`
                        : selection.part_of_day === "AFTERNOON"
                        ? `Tarde (${macroPeriod.config_turnos.afternoon.start} - ${macroPeriod.config_turnos.afternoon.end})`
                        : selection.part_of_day === "FULL_DAY"
                        ? "Dia Inteiro"
                        : `${selection.custom_start} - ${selection.custom_end}`}
                    </span>
                  </div>
                  {macroPeriod.can_edit && (
                    <button
                      onClick={() => handleRemoveSelection(idx)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Remover
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">Nenhuma seleção ainda</p>
          )}

          {macroPeriod.can_edit && (
            <button
              onClick={handleSubmit}
              disabled={selections.length === 0}
              className="mt-4 w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Confirmar Disponibilidade
            </button>
          )}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold mb-4">
                Adicionar Disponibilidade -{" "}
                {selectedDate?.toLocaleDateString("pt-BR")}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Tipo</label>
                  <select
                    value={modalData.type}
                    onChange={(e) =>
                      setModalData({
                        ...modalData,
                        type: e.target.value as SelectionType,
                      })
                    }
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="SURGERY">Cirurgia</option>
                    <option value="CONSULT">Consulta</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Período
                  </label>
                  <select
                    value={modalData.part_of_day}
                    onChange={(e) =>
                      setModalData({
                        ...modalData,
                        part_of_day: e.target.value as PartOfDay,
                      })
                    }
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="FULL_DAY">Dia Inteiro</option>
                    <option value="MORNING">
                      Manhã ({macroPeriod?.config_turnos.morning.start} -{" "}
                      {macroPeriod?.config_turnos.morning.end})
                    </option>
                    <option value="AFTERNOON">
                      Tarde ({macroPeriod?.config_turnos.afternoon.start} -{" "}
                      {macroPeriod?.config_turnos.afternoon.end})
                    </option>
                    <option value="CUSTOM">Horário Específico</option>
                  </select>
                </div>

                {modalData.part_of_day === "CUSTOM" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Início
                      </label>
                      <input
                        type="time"
                        value={modalData.custom_start}
                        onChange={(e) =>
                          setModalData({
                            ...modalData,
                            custom_start: e.target.value,
                          })
                        }
                        className="w-full border rounded px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Fim
                      </label>
                      <input
                        type="time"
                        value={modalData.custom_end}
                        onChange={(e) =>
                          setModalData({
                            ...modalData,
                            custom_end: e.target.value,
                          })
                        }
                        className="w-full border rounded px-3 py-2"
                      />
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={handleAddSelection}
                    className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
                  >
                    Adicionar
                  </button>
                  <button
                    onClick={() => setShowModal(false)}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
