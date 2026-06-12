// ─────────────────────────────────────────────────────────────────────────────
// MineCore — Vehicles Service
// ─────────────────────────────────────────────────────────────────────────────

import apiClient from '@/lib/api';
import { API_ENDPOINTS } from '@/constants/api';
import type { Vehicle, CreateVehicleDTO, UpdateVehicleDTO, VehicleQueryParams } from '@/types/vehicle';
import type { ApiResponse, PaginatedResponse } from '@/types/api';
import { VehicleStatus } from '@/types/enums';

export const getVehicles = async (params?: VehicleQueryParams): Promise<PaginatedResponse<Vehicle>> => {
  const { data } = await apiClient.get<PaginatedResponse<Vehicle>>(
    API_ENDPOINTS.VEHICLES.BASE,
    { params }
  );
  return data;
};

export const getVehicle = async (id: string): Promise<Vehicle> => {
  const { data } = await apiClient.get<ApiResponse<Vehicle>>(
    API_ENDPOINTS.VEHICLES.BY_ID(id)
  );
  return data.data;
};

export const createVehicle = async (payload: CreateVehicleDTO): Promise<Vehicle> => {
  const { data } = await apiClient.post<ApiResponse<Vehicle>>(
    API_ENDPOINTS.VEHICLES.BASE,
    payload
  );
  return data.data;
};

export const updateVehicle = async (id: string, payload: UpdateVehicleDTO): Promise<Vehicle> => {
  const { data } = await apiClient.put<ApiResponse<Vehicle>>(
    API_ENDPOINTS.VEHICLES.BY_ID(id),
    payload
  );
  return data.data;
};

export const updateVehicleStatus = async (id: string, status: VehicleStatus): Promise<Vehicle> => {
  const { data } = await apiClient.patch<ApiResponse<Vehicle>>(
    `${API_ENDPOINTS.VEHICLES.BY_ID(id)}/status`,
    { status }
  );
  return data.data;
};

export const deleteVehicle = async (id: string): Promise<void> => {
  await apiClient.delete<ApiResponse<null>>(
    API_ENDPOINTS.VEHICLES.BY_ID(id)
  );
};
