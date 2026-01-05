"use client";

import { useState, useEffect } from "react";
import { getDoctors } from "@/lib/api";
import type { Doctor } from "@/lib/types";
import { api } from "@/lib/api";

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [showActiveOnly, setShowActiveOnly] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    active: true,
  });

  useEffect(() => {
    loadDoctors();
  }, [showActiveOnly]);

  const loadDoctors = async () => {
    try {
      const data = await api.get("/doctors", {
        params: { active_only: showActiveOnly },
      });
      setDoctors(data.data);
    } catch (error) {
      console.error("Error loading doctors:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingDoctor) {
        await api.put(`/doctors/${editingDoctor.id}`, formData);
        alert("Médico atualizado com sucesso!");
      } else {
        await api.post("/doctors", formData);
        alert("Médico criado com sucesso!");
      }

      setShowForm(false);
      setEditingDoctor(null);
      setFormData({
        name: "",
        email: "",
        active: true,
      });
      loadDoctors();
    } catch (error: any) {
      alert("Erro: " + (error.response?.data?.detail || error.message));
    }
  };

  const handleEdit = (doctor: Doctor) => {
    setEditingDoctor(doctor);
    setFormData({
      name: doctor.name,
      email: doctor.email,
      active: doctor.active,
    });
    setShowForm(true);
  };

  const handleToggleActive = async (doctor: Doctor) => {
    try {
      await api.put(`/doctors/${doctor.id}`, {
        active: !doctor.active,
      });
      alert(`Médico ${!doctor.active ? "ativado" : "desativado"} com sucesso!`);
      loadDoctors();
    } catch (error: any) {
      alert("Erro: " + (error.response?.data?.detail || error.message));
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Deseja realmente excluir este médico?")) return;

    try {
      await api.delete(`/doctors/${id}`);
      alert("Médico excluído com sucesso!");
      loadDoctors();
    } catch (error: any) {
      alert("Erro: " + (error.response?.data?.detail || error.message));
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingDoctor(null);
    setFormData({
      name: "",
      email: "",
      active: true,
    });
  };

  if (loading) {
    return <div className="p-4">Carregando...</div>;
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Médicos</h1>
          <p className="mt-2 text-sm text-gray-700">
            Gerencie os médicos cadastrados
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex gap-2">
          <label className="inline-flex items-center">
            <input
              type="checkbox"
              checked={showActiveOnly}
              onChange={(e) => setShowActiveOnly(e.target.checked)}
              className="rounded"
            />
            <span className="ml-2 text-sm">Apenas ativos</span>
          </label>
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
          >
            {showForm ? "Cancelar" : "+ Novo Médico"}
          </button>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="mb-6 bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium mb-4">
            {editingDoctor ? "Editar Médico" : "Novo Médico"}
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Nome Completo *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm px-3 py-2 border"
                placeholder="Ex: ALEXEI GAMA DE ALBUQUERQUE CAVALCANTI"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Email *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm px-3 py-2 border"
                placeholder="Ex: alexei.cavalcanti@scclinica.com.br"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="rounded"
                />
                <span className="ml-2 text-sm font-medium text-gray-700">Ativo</span>
              </label>
            </div>

            <div className="sm:col-span-2 flex gap-2">
              <button
                type="submit"
                className="flex-1 inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
              >
                {editingDoctor ? "Atualizar" : "Criar"} Médico
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
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {doctors.map((doctor) => (
              <tr key={doctor.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  {doctor.name}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">{doctor.email}</td>
                <td className="px-6 py-4 text-sm">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      doctor.active
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {doctor.active ? "Ativo" : "Inativo"}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(doctor)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleToggleActive(doctor)}
                      className="text-yellow-600 hover:text-yellow-900"
                    >
                      {doctor.active ? "Desativar" : "Ativar"}
                    </button>
                    <button
                      onClick={() => handleDelete(doctor.id)}
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
        {doctors.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Nenhum médico encontrado
          </div>
        )}
      </div>
    </div>
  );
}
