"use client";

import { useState } from "react";
import { uploadAdminEvidence, enableAdminEdit } from "@/lib/api";
import { AdminEditEvidence, EnableAdminEditResponse } from "@/lib/types";

interface AdminEditEvidenceModalProps {
  macroPeriodId: number;
  onClose: () => void;
  onSuccess: (evidence: AdminEditEvidence, editToken: EnableAdminEditResponse) => void;
}

export default function AdminEditEvidenceModal({
  macroPeriodId,
  onClose,
  onSuccess,
}: AdminEditEvidenceModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [notes, setNotes] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];

      // Validate file type
      const allowedTypes = ["image/jpeg", "image/png", "image/gif", "application/pdf"];
      if (!allowedTypes.includes(selectedFile.type)) {
        setError("Apenas imagens (JPG, PNG, GIF) ou PDF são permitidos");
        return;
      }

      // Validate file size (5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError("O arquivo deve ter no máximo 5MB");
        return;
      }

      setFile(selectedFile);
      setError(null);
    }
  };

  const handleSubmit = async () => {
    if (!file) {
      setError("Por favor, selecione um arquivo");
      return;
    }

    if (!notes.trim()) {
      setError("Por favor, adicione uma nota explicando a solicitação");
      return;
    }

    try {
      setUploading(true);
      setError(null);

      // Upload evidence
      const evidence = await uploadAdminEvidence(macroPeriodId, file, notes);

      // Enable admin edit with the uploaded evidence
      const editToken = await enableAdminEdit(macroPeriodId, evidence.id, notes);

      onSuccess(evidence, editToken);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Erro ao fazer upload da evidência");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Evidência de Solicitação de Edição
          </h2>

          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-2xl">⚠️</span>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  <strong>OBRIGATÓRIO:</strong> Você deve anexar uma imagem (print de WhatsApp,
                  e-mail, etc.) ou PDF que comprove que o médico solicitou a alteração. Esta
                  evidência é necessária para auditoria.
                </p>
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

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Arquivo de Evidência *
              </label>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100
                  cursor-pointer"
              />
              {file && (
                <p className="mt-2 text-sm text-gray-600">
                  Arquivo selecionado: <strong>{file.name}</strong> (
                  {(file.size / 1024).toFixed(2)} KB)
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notas / Justificativa *
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder="Descreva o motivo da solicitação de edição pelo médico..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={onClose}
              disabled={uploading}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={!file || !notes.trim() || uploading}
              className="px-4 py-2 text-white bg-orange-600 rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? "Enviando..." : "Anexar e Continuar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
