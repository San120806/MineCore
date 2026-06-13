// ─────────────────────────────────────────────────────────────────────────────
// MineCore — Sensors Service
// ─────────────────────────────────────────────────────────────────────────────

import apiClient from "@/lib/api";
import { API_ENDPOINTS } from "@/constants/api";
import type {
  Sensor,
  SensorReading,
  CreateSensorDTO,
  UpdateSensorDTO,
  SensorQueryParams,
  RecordSensorReadingDTO,
} from "@/types/sensor";
import type { ApiResponse, PaginatedResponse } from "@/types/api";

export const getSensors = async (
  params?: SensorQueryParams,
): Promise<PaginatedResponse<Sensor>> => {
  const { data } = await apiClient.get<PaginatedResponse<Sensor>>(
    API_ENDPOINTS.SENSORS.BASE,
    { params },
  );
  return data;
};

export const getSensor = async (id: string): Promise<Sensor> => {
  const { data } = await apiClient.get<ApiResponse<Sensor>>(
    API_ENDPOINTS.SENSORS.BY_ID(id),
  );
  return data.data;
};

export const createSensor = async (
  payload: CreateSensorDTO,
): Promise<Sensor> => {
  const { data } = await apiClient.post<ApiResponse<Sensor>>(
    API_ENDPOINTS.SENSORS.BASE,
    payload,
  );
  return data.data;
};

export const updateSensor = async (
  id: string,
  payload: UpdateSensorDTO,
): Promise<Sensor> => {
  const { data } = await apiClient.put<ApiResponse<Sensor>>(
    API_ENDPOINTS.SENSORS.BY_ID(id),
    payload,
  );
  return data.data;
};

export const deleteSensor = async (id: string): Promise<void> => {
  await apiClient.delete<ApiResponse<null>>(API_ENDPOINTS.SENSORS.BY_ID(id));
};

export const getSensorReadings = async (
  sensorId: string,
  params?: { page?: number; limit?: number },
): Promise<PaginatedResponse<SensorReading>> => {
  const { data } = await apiClient.get<PaginatedResponse<SensorReading>>(
    API_ENDPOINTS.SENSORS.READINGS(sensorId),
    { params },
  );
  return data;
};

export const recordSensorReading = async (
  sensorId: string,
  payload: RecordSensorReadingDTO,
): Promise<SensorReading> => {
  const { data } = await apiClient.post<ApiResponse<SensorReading>>(
    API_ENDPOINTS.SENSORS.RECORD_READING(sensorId),
    payload,
  );
  return data.data;
};
