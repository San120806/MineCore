// ─────────────────────────────────────────────────────────────────────────────
// MineCore — Equipment Service
// ─────────────────────────────────────────────────────────────────────────────

import apiClient from '@/lib/api';
import { API_ENDPOINTS } from '@/constants/api';
import type { Equipment, CreateEquipmentDTO, UpdateEquipmentDTO, EquipmentQueryParams, UpdateHealthScoreDTO } from '@/types/equipment';
import type { ApiResponse, PaginatedResponse } from '@/types/api';

export const getEquipmentList = async (params?: EquipmentQueryParams): Promise<PaginatedResponse<Equipment>> => {
  const { data } = await apiClient.get<PaginatedResponse<Equipment>>(
    API_ENDPOINTS.EQUIPMENT.BASE,
    { params }
  );
  return data;
};

export const getEquipment = async (id: string): Promise<Equipment> => {
  const { data } = await apiClient.get<ApiResponse<Equipment>>(
    API_ENDPOINTS.EQUIPMENT.BY_ID(id)
  );
  return data.data;
};

export const createEquipment = async (payload: CreateEquipmentDTO): Promise<Equipment> => {
  const { data } = await apiClient.post<ApiResponse<Equipment>>(
    API_ENDPOINTS.EQUIPMENT.BASE,
    payload
  );
  return data.data;
};

export const updateEquipment = async (id: string, payload: UpdateEquipmentDTO): Promise<Equipment> => {
  const { data } = await apiClient.put<ApiResponse<Equipment>>(
    API_ENDPOINTS.EQUIPMENT.BY_ID(id),
    payload
  );
  return data.data;
};

export const updateEquipmentHealth = async (id: string, payload: UpdateHealthScoreDTO): Promise<Equipment> => {
  const { data } = await apiClient.patch<ApiResponse<Equipment>>(
    API_ENDPOINTS.EQUIPMENT.HEALTH(id),
    payload
  );
  return data.data;
};

export const deleteEquipment = async (id: string): Promise<void> => {
  await apiClient.delete<ApiResponse<null>>(
    API_ENDPOINTS.EQUIPMENT.BY_ID(id)
  );
};
