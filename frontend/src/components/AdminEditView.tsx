"use client";

import { useState, useEffect } from "react";
import { MacroPeriodDetail, MacroPeriodSelection, MacroPeriodUnit, EnableAdminEditResponse } from "@/lib/types";
import { submitAdminEdit } from "@/lib/api";

interface AdminEditViewProps {
  macroPeriod: MacroPeriodDetail;
  editToken: EnableAdminEditResponse;
  onCancel: () => void;
  onSuccess: () => void;
}

export default function AdminEditView({
  macroPeriod,
  editToken,
  onCancel,
  onSuccess,
}: AdminEditViewProps) {
  const [selections, setSelections] = useState<MacroPeriodSelection[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tokenExpired, setTokenExpired] = useState(false);

  useEffect(() => {
    // Load existing selections
    setSelections(macroPeriod.selections || []);

    // Check token expiration
    const expiresAt = new Date(editToken.expires_at);
    const now = new Date();
    const timeLeft = expiresAt.getTime() - now.getTime();

    if (timeLeft <= 0) {
      setTokenExpired(true);
      return;
    }

    // Set timeout to mark token as expired
    const timer = setTimeout(() => {
      setTokenExpired(true);
      setError("O token de edição expirou (30 minutos). Por favor, gere um novo token.");
    }, timeLeft);

    return () => clearTimeout(timer);
  }, [macroPeriod.selections, editToken.expires_at]);

  const handleAddSelection = () => {
    const newSelection: MacroPeriodSelection = {
      macro_period_unit_id: macroPeriod.units[0]?.id,
      date: macroPeriod.start_date,
      part_of_day: "FULL_DAY",
    };
    setSelections([...selections, newSelection]);
  };

  const handleRemoveSelection = (index: number) => {
    setSelections(selections.filter((_, i) => i !== index));
  };

  const handleUpdateSelection = (index: number, field: keyof MacroPeriodSelection, value: any) => {
    const updated = [...selections];
    updated[index] = { ...updated[index], [field]: value };
    setSelections(updated);
  };

  const handleSave = async () => {
    if (tokenExpired) {
      setError("Token expirado. Por favor, gere um novo token.");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      await submitAdminEdit(macroPeriod.public_token, editToken.token, selections, true);

      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Erro ao salvar edições");
    } finally {
      setSaving(false);
    }
  };

  const expiresAt = new Date(editToken.expires_at);
  const now = new Date();
  const minutesLeft = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000 / 60));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full my-8">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Editar Disponibilidade (Admin)</h2>
            <div className="text-right">
              <div className="text-sm text-gray-600">Token expira em:</div>
              <div className={`text-lg font-bold ${minutesLeft <= 5 ? "text-red-600" : "text-green-600"}`}>
                {minutesLeft} minutos
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <span className="text-xl">❌</span>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-xl">ℹ️</span>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  Você está editando a disponibilidade em nome do médico. As alterações serão
                  registradas no histórico de auditoria com seu nome.
                </p>
              </div>
            </div>
          </div>

          {/* Selections Table */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Seleções</h3>
              <button
                onClick={handleAddSelection}
                disabled={tokenExpired || saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                + Adicionar Seleção
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Unidade
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Data
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Período
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Horário Início
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Horário Fim
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {selections.map((selection, idx) => {
                    const unit = macroPeriod.units.find((u) => u.id === selection.macro_period_unit_id);
                    return (
                      <tr key={idx}>
                        <td className="px-3 py-4 whitespace-nowrap text-sm">
                          <select
                            value={selection.macro_period_unit_id}
                            onChange={(e) =>
                              handleUpdateSelection(idx, "macro_period_unit_id", parseInt(e.target.value))
                            }
                            disabled={tokenExpired || saving}
                            className="border border-gray-300 rounded px-2 py-1"
                          >
                            {macroPeriod.units.map((u) => (
                              <option key={u.id} value={u.id}>
                                {u.unit_name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm">
                          <input
                            type="date"
                            value={selection.date}
                            onChange={(e) => handleUpdateSelection(idx, "date", e.target.value)}
                            min={macroPeriod.start_date}
                            max={macroPeriod.end_date}
                            disabled={tokenExpired || saving}
                            className="border border-gray-300 rounded px-2 py-1"
                          />
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm">
                          <select
                            value={selection.part_of_day}
                            onChange={(e) => handleUpdateSelection(idx, "part_of_day", e.target.value)}
                            disabled={tokenExpired || saving}
                            className="border border-gray-300 rounded px-2 py-1"
                          >
                            <option value="FULL_DAY">Dia Inteiro</option>
                            <option value="MORNING">Manhã</option>
                            <option value="AFTERNOON">Tarde</option>
                            <option value="CUSTOM">Customizado</option>
                          </select>
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm">
                          {selection.part_of_day === "CUSTOM" ? (
                            <input
                              type="time"
                              value={selection.custom_start || ""}
                              onChange={(e) => handleUpdateSelection(idx, "custom_start", e.target.value)}
                              disabled={tokenExpired || saving}
                              className="border border-gray-300 rounded px-2 py-1"
                            />
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm">
                          {selection.part_of_day === "CUSTOM" ? (
                            <input
                              type="time"
                              value={selection.custom_end || ""}
                              onChange={(e) => handleUpdateSelection(idx, "custom_end", e.target.value)}
                              disabled={tokenExpired || saving}
                              className="border border-gray-300 rounded px-2 py-1"
                            />
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => handleRemoveSelection(idx)}
                            disabled={tokenExpired || saving}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50"
                          >
                            Remover
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {selections.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Nenhuma seleção. Clique em "Adicionar Seleção" para começar.
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              onClick={onCancel}
              disabled={saving}
              className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={tokenExpired || saving || selections.length === 0}
              className="px-6 py-2 text-white bg-orange-600 rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Salvando..." : "Salvar Edições"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
