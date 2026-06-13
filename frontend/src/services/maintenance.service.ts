// ─────────────────────────────────────────────────────────────────────────────
// MineCore — Maintenance Service
// ─────────────────────────────────────────────────────────────────────────────

import apiClient from "@/lib/api";
import { API_ENDPOINTS } from "@/constants/api";
import type {
  MaintenanceRecord,
  CreateMaintenanceDTO,
  UpdateMaintenanceDTO,
  MaintenanceQueryParams,
} from "@/types/maintenance";
import type { ApiResponse, PaginatedResponse } from "@/types/api";

export const getMaintenanceList = async (
  params?: MaintenanceQueryParams,
): Promise<PaginatedResponse<MaintenanceRecord>> => {
  const { data } = await apiClient.get<PaginatedResponse<MaintenanceRecord>>(
    API_ENDPOINTS.MAINTENANCE.BASE,
    { params },
  );
  return data;
};

export const getMaintenance = async (
  id: string,
): Promise<MaintenanceRecord> => {
  const { data } = await apiClient.get<ApiResponse<MaintenanceRecord>>(
    API_ENDPOINTS.MAINTENANCE.BY_ID(id),
  );
  return data.data;
};

export const createMaintenance = async (
  payload: CreateMaintenanceDTO,
): Promise<MaintenanceRecord> => {
  const { data } = await apiClient.post<ApiResponse<MaintenanceRecord>>(
    API_ENDPOINTS.MAINTENANCE.BASE,
    payload,
  );
  return data.data;
};

export const updateMaintenance = async (
  id: string,
  payload: UpdateMaintenanceDTO,
): Promise<MaintenanceRecord> => {
  const { data } = await apiClient.put<ApiResponse<MaintenanceRecord>>(
    API_ENDPOINTS.MAINTENANCE.BY_ID(id),
    payload,
  );
  return data.data;
};

export const completeMaintenance = async (
  id: string,
  payload: { actionTaken: string; cost: number; notes?: string },
): Promise<MaintenanceRecord> => {
  const { data } = await apiClient.patch<ApiResponse<MaintenanceRecord>>(
    `${API_ENDPOINTS.MAINTENANCE.BY_ID(id)}/complete`,
    payload,
  );
  return data.data;
};

export const deleteMaintenance = async (id: string): Promise<void> => {
  await apiClient.delete<ApiResponse<null>>(
    API_ENDPOINTS.MAINTENANCE.BY_ID(id),
  );
};
