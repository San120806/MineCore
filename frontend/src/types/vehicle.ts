// ─────────────────────────────────────────────────────────────────────────────
// MineCore — Vehicle Types
// ─────────────────────────────────────────────────────────────────────────────

import { VehicleType, VehicleStatus } from "./enums";

export interface Vehicle {
  id: string;
  siteId: string;
  vehicleCode: string;
  name: string;
  model: string;
  serialNumber: string;
  type: VehicleType;
  status: VehicleStatus;
  fuelLevel: number;
  batteryLevel?: number | null;
  lastLocation?: string | null;
  lastSeen?: string | null;
  createdAt: string;
  updatedAt: string;
  // Relation
  site?: {
    id: string;
    name: string;
  };
}

export interface CreateVehicleDTO {
  siteId: string;
  vehicleCode: string;
  name: string;
  model: string;
  serialNumber: string;
  type: VehicleType;
  status?: VehicleStatus;
  fuelLevel?: number;
  batteryLevel?: number;
  lastLocation?: string;
}

export interface UpdateVehicleDTO extends Partial<CreateVehicleDTO> {}

export interface VehicleQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: VehicleStatus;
  type?: VehicleType;
  siteId?: string;
}
