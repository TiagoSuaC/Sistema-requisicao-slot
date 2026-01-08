import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const api = axios.create({
  baseURL: API_URL,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Auth
export const login = async (email: string, password: string) => {
  const response = await api.post("/auth/login", null, {
    params: { email, password },
  });
  return response.data;
};

// Units
export const getUnits = async () => {
  const response = await api.get("/units");
  return response.data;
};

// Doctors
export const getDoctors = async () => {
  const response = await api.get("/doctors");
  return response.data;
};

// Macro Periods
export const createMacroPeriod = async (data: any) => {
  const response = await api.post("/macro-periods", data);
  return response.data;
};

export const getMacroPeriods = async (params?: any) => {
  const response = await api.get("/macro-periods", { params });
  return response.data;
};

export const getMacroPeriodDetail = async (id: number) => {
  const response = await api.get(`/macro-periods/${id}`);
  return response.data;
};

export const unlockMacroPeriod = async (id: number) => {
  const response = await api.post(`/macro-periods/${id}/unlock`);
  return response.data;
};

export const confirmMacroPeriod = async (id: number) => {
  const response = await api.post(`/macro-periods/${id}/confirm`);
  return response.data;
};

export const cancelMacroPeriod = async (id: number) => {
  const response = await api.post(`/macro-periods/${id}/cancel`);
  return response.data;
};

export const exportMacroPeriodCSV = async (id: number) => {
  const response = await api.get(`/macro-periods/${id}/export.csv`, {
    responseType: "blob",
  });
  return response.data;
};

export const getDashboardMetrics = async (params?: { start_date?: string; end_date?: string }) => {
  const response = await api.get("/macro-periods/metrics/dashboard", { params });
  return response.data;
};

export const exportBatchCSV = async (ids: number[]) => {
  const response = await api.post("/macro-periods/export-batch.csv", ids, {
    responseType: "blob",
  });
  return response.data;
};

export const inactivateBatchMacroPeriods = async (ids: number[]) => {
  const response = await api.post("/macro-periods/batch-inactivate", ids);
  return response.data;
};

// Public
export const getMacroPeriodByToken = async (token: string) => {
  const response = await api.get(`/public/macro-period/${token}`);
  return response.data;
};

export const submitDoctorResponse = async (token: string, selections: any[], confirm: boolean = false) => {
  const response = await api.post(`/public/macro-period/${token}/response`, {
    selections,
    confirm,
  });
  return response.data;
};

export const exportMacroPeriodCalendar = async (token: string) => {
  const response = await api.get(`/public/macro-period/${token}/calendar`, {
    responseType: "blob",
  });
  return response.data;
};

export const updateMacroPeriod = async (id: number, data: any) => {
  const response = await api.put(`/macro-periods/${id}`, data);
  return response.data;
};

// Admin Edit Evidence
export const uploadAdminEvidence = async (macroPeriodId: number, file: File, notes?: string) => {
  const formData = new FormData();
  formData.append("file", file);
  if (notes) {
    formData.append("notes", notes);
  }
  const response = await api.post(`/macro-periods/${macroPeriodId}/upload-admin-evidence`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

export const enableAdminEdit = async (macroPeriodId: number, evidenceFileId: number, notes?: string) => {
  const response = await api.post(`/macro-periods/${macroPeriodId}/enable-admin-edit`, {
    evidence_file_id: evidenceFileId,
    notes,
  });
  return response.data;
};

export const getAdminEvidences = async (macroPeriodId: number) => {
  const response = await api.get(`/macro-periods/${macroPeriodId}/evidences`);
  return response.data;
};

export const submitAdminEdit = async (
  token: string,
  adminToken: string,
  selections: any[],
  confirm: boolean = true
) => {
  const response = await api.post(
    `/public/macro-period/${token}/response`,
    {
      selections,
      confirm,
    },
    {
      headers: {
        "X-Admin-Edit-Token": adminToken,
      },
    }
  );
  return response.data;
};
