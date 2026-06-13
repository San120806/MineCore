// ─────────────────────────────────────────────────────────────────────────────
// MineCore — Equipment Types
// ─────────────────────────────────────────────────────────────────────────────

import { EquipmentType, EquipmentStatus } from "./enums";
import { MaintenanceRecord } from "./maintenance";

export interface Equipment {
  id: string;
  siteId: string;
  name: string;
  model: string;
  serialNumber: string;
  type: EquipmentType;
  status: EquipmentStatus;
  healthScore: number; // 0–100
  nextMaintenanceDate?: string | null;
  lastInspected?: string | null;
  installedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  // Relations
  site?: {
    id: string;
    name: string;
  };
  maintenanceRecords?: MaintenanceRecord[];
  _count?: {
    maintenanceRecords: number;
  };
}

export interface CreateEquipmentDTO {
  siteId: string;
  name: string;
  model: string;
  serialNumber: string;
  type: EquipmentType;
  status?: EquipmentStatus;
  healthScore?: number;
  nextMaintenanceDate?: string;
  installedAt?: string;
}

export interface UpdateEquipmentDTO extends Partial<CreateEquipmentDTO> {}

export interface UpdateHealthScoreDTO {
  healthScore: number;
  status?: EquipmentStatus;
}

export interface EquipmentQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: EquipmentStatus;
  type?: EquipmentType;
  siteId?: string;
}
