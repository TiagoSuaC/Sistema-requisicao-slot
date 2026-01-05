"use client";

import { useState, useEffect } from "react";
import { getUnits } from "@/lib/api";
import type { Unit } from "@/lib/types";
import { api } from "@/lib/api";

export default function UnitsPage() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    city: "",
    morning_start: "08:00",
    morning_end: "12:00",
    afternoon_start: "13:00",
    afternoon_end: "17:00",
  });

  useEffect(() => {
    loadUnits();
  }, []);

  const loadUnits = async () => {
    try {
      const data = await getUnits();
      setUnits(data);
    } catch (error) {
      console.error("Error loading units:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      name: formData.name,
      city: formData.city,
      config_turnos: {
        morning: {
          start: formData.morning_start,
          end: formData.morning_end,
        },
        afternoon: {
          start: formData.afternoon_start,
          end: formData.afternoon_end,
        },
      },
    };

    try {
      if (editingUnit) {
        await api.put(`/units/${editingUnit.id}`, payload);
        alert("Unidade atualizada com sucesso!");
      } else {
        await api.post("/units", payload);
        alert("Unidade criada com sucesso!");
      }

      setShowForm(false);
      setEditingUnit(null);
      setFormData({
        name: "",
        city: "",
        morning_start: "08:00",
        morning_end: "12:00",
        afternoon_start: "13:00",
        afternoon_end: "17:00",
      });
      loadUnits();
    } catch (error: any) {
      alert("Erro: " + (error.response?.data?.detail || error.message));
    }
  };

  const handleEdit = (unit: Unit) => {
    setEditingUnit(unit);
    setFormData({
      name: unit.name,
      city: unit.city,
      morning_start: unit.config_turnos.morning.start,
      morning_end: unit.config_turnos.morning.end,
      afternoon_start: unit.config_turnos.afternoon.start,
      afternoon_end: unit.config_turnos.afternoon.end,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Deseja realmente excluir esta unidade?")) return;

    try {
      await api.delete(`/units/${id}`);
      alert("Unidade excluída com sucesso!");
      loadUnits();
    } catch (error: any) {
      alert("Erro: " + (error.response?.data?.detail || error.message));
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingUnit(null);
    setFormData({
      name: "",
      city: "",
      morning_start: "08:00",
      morning_end: "12:00",
      afternoon_start: "13:00",
      afternoon_end: "17:00",
    });
  };

  if (loading) {
    return <div className="p-4">Carregando...</div>;
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Unidades</h1>
          <p className="mt-2 text-sm text-gray-700">
            Gerencie as unidades da clínica
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
          >
            {showForm ? "Cancelar" : "+ Nova Unidade"}
          </button>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="mb-6 bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium mb-4">
            {editingUnit ? "Editar Unidade" : "Nova Unidade"}
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Nome da Unidade *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm px-3 py-2 border"
                placeholder="Ex: 01 - CLÍNICA SC CRICIÚMA"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Cidade *
              </label>
              <input
                type="text"
                required
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm px-3 py-2 border"
                placeholder="Ex: CRICIÚMA"
              />
            </div>

            <div className="sm:col-span-2">
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Configuração de Turnos
              </h3>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Manhã - Início
              </label>
              <input
                type="time"
                required
                value={formData.morning_start}
                onChange={(e) =>
                  setFormData({ ...formData, morning_start: e.target.value })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm px-3 py-2 border"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Manhã - Fim
              </label>
              <input
                type="time"
                required
                value={formData.morning_end}
                onChange={(e) =>
                  setFormData({ ...formData, morning_end: e.target.value })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm px-3 py-2 border"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Tarde - Início
              </label>
              <input
                type="time"
                required
                value={formData.afternoon_start}
                onChange={(e) =>
                  setFormData({ ...formData, afternoon_start: e.target.value })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm px-3 py-2 border"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Tarde - Fim
              </label>
              <input
                type="time"
                required
                value={formData.afternoon_end}
                onChange={(e) =>
                  setFormData({ ...formData, afternoon_end: e.target.value })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm px-3 py-2 border"
              />
            </div>

            <div className="sm:col-span-2 flex gap-2">
              <button
                type="submit"
                className="flex-1 inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
              >
                {editingUnit ? "Atualizar" : "Criar"} Unidade
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Nome
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Cidade
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Turno Manhã
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Turno Tarde
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {units.map((unit) => (
              <tr key={unit.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  {unit.name}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">{unit.city}</td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {unit.config_turnos.morning.start} - {unit.config_turnos.morning.end}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {unit.config_turnos.afternoon.start} -{" "}
                  {unit.config_turnos.afternoon.end}
                </td>
                <td className="px-6 py-4 text-sm">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(unit)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(unit.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Excluir
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {units.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Nenhuma unidade encontrada
          </div>
        )}
      </div>
    </div>
  );
}
