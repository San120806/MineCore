// ─────────────────────────────────────────────────────────────────────────────
// MineCore — Safety Alerts Service
// ─────────────────────────────────────────────────────────────────────────────

import apiClient from '@/lib/api';
import { API_ENDPOINTS } from '@/constants/api';
import type { SafetyAlert, CreateAlertDTO, AlertQueryParams, ResolveAlertDTO } from '@/types/alert';
import type { ApiResponse, PaginatedResponse } from '@/types/api';

export const getAlerts = async (params?: AlertQueryParams): Promise<PaginatedResponse<SafetyAlert>> => {
  const { data } = await apiClient.get<PaginatedResponse<SafetyAlert>>(
    API_ENDPOINTS.ALERTS.BASE,
    { params }
  );
  return data;
};

export const getAlert = async (id: string): Promise<SafetyAlert> => {
  const { data } = await apiClient.get<ApiResponse<SafetyAlert>>(
    API_ENDPOINTS.ALERTS.BY_ID(id)
  );
  return data.data;
};

export const createAlert = async (payload: CreateAlertDTO): Promise<SafetyAlert> => {
  const { data } = await apiClient.post<ApiResponse<SafetyAlert>>(
    API_ENDPOINTS.ALERTS.BASE,
    payload
  );
  return data.data;
};

export const acknowledgeAlert = async (id: string): Promise<SafetyAlert> => {
  const { data } = await apiClient.patch<ApiResponse<SafetyAlert>>(
    API_ENDPOINTS.ALERTS.ACKNOWLEDGE(id)
  );
  return data.data;
};

export const resolveAlert = async (id: string, payload?: ResolveAlertDTO): Promise<SafetyAlert> => {
  const { data } = await apiClient.patch<ApiResponse<SafetyAlert>>(
    API_ENDPOINTS.ALERTS.RESOLVE(id),
    payload
  );
  return data.data;
};

export const deleteAlert = async (id: string): Promise<void> => {
  await apiClient.delete<ApiResponse<null>>(
    API_ENDPOINTS.ALERTS.BY_ID(id)
  );
};
