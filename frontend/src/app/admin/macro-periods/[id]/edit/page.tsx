"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  getMacroPeriodDetail,
  updateMacroPeriod,
  getUnits,
  getDoctors,
} from "@/lib/api";
import type { MacroPeriodDetail, Unit, Doctor } from "@/lib/types";

export default function EditMacroPeriodPage() {
  const params = useParams();
  const router = useRouter();
  const id = parseInt(params.id as string);

  const [units, setUnits] = useState<Unit[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const [macroPeriod, unitsData, doctorsData] = await Promise.all([
        getMacroPeriodDetail(id),
        getUnits(),
        getDoctors(),
      ]);

      // Check if can edit
      if (macroPeriod.status !== "AGUARDANDO") {
        alert("Só é possível editar períodos com status AGUARDANDO");
        router.push("/admin/macro-periods");
        return;
      }

      setUnits(unitsData);
      setDoctors(doctorsData);

      // Load existing data into form
      setFormData({
        doctor_id: macroPeriod.doctor_id.toString(),
        start_date: macroPeriod.start_date,
        end_date: macroPeriod.end_date,
        priority: macroPeriod.priority,
        deadline: macroPeriod.deadline || "",
        units: macroPeriod.units.map(u => ({
          unit_id: u.unit_id.toString(),
          total_days: u.total_days
        })),
      });

    } catch (error) {
      console.error("Error loading data:", error);
      alert("Erro ao carregar dados");
      router.push("/admin/macro-periods");
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

      await updateMacroPeriod(id, payload);

      alert("Macro Período atualizado com sucesso!");
      router.push("/admin/macro-periods");
    } catch (error: any) {
      alert("Erro ao atualizar macro período: " + (error.response?.data?.detail || error.message));
    }
  };

  if (loading) return <div className="p-4">Carregando...</div>;

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
        <h1 className="text-2xl font-semibold mb-6">Editar Macro Período</h1>

        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-6">
          <p className="text-sm text-yellow-800">
            ⚠️ <strong>Atenção:</strong> Editar este período irá remover todas as seleções existentes do médico.
            Use esta função apenas se necessário.
          </p>
        </div>

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
                Deadline (opcional)
              </label>
              <input
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm px-3 py-2 border"
              />
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-md font-medium text-gray-900">Unidades *</h3>
              <button
                type="button"
                onClick={addUnit}
                className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
              >
                ➕ Adicionar Unidade
              </button>
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

          <div className="border-t pt-4 flex gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Salvar Alterações
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
