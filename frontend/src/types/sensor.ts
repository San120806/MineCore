// ─────────────────────────────────────────────────────────────────────────────
// MineCore — Sensor Types
// ─────────────────────────────────────────────────────────────────────────────

import { SensorType, SensorStatus } from "./enums";

export interface Sensor {
  id: string;
  siteId: string;
  sensorCode: string;
  name: string;
  sensorType: SensorType;
  status: SensorStatus;
  value?: number | null;
  unit: string;
  thresholdMin?: number | null;
  thresholdMax?: number | null;
  lastReading?: string | null;
  createdAt: string;
  updatedAt: string;
  // Relation
  site?: {
    id: string;
    name: string;
  };
  // Computed
  _count?: {
    readings: number;
  };
}

export interface SensorReading {
  id: string;
  sensorId: string;
  value: number;
  unit: string;
  recordedAt: string;
}

export interface CreateSensorDTO {
  siteId: string;
  sensorCode: string;
  name: string;
  sensorType: SensorType;
  unit: string;
  status?: SensorStatus;
  thresholdMin?: number;
  thresholdMax?: number;
}

export interface UpdateSensorDTO extends Partial<CreateSensorDTO> {}

export interface RecordSensorReadingDTO {
  value: number;
  unit: string;
}

export interface SensorQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: SensorStatus;
  sensorType?: SensorType;
  siteId?: string;
}
