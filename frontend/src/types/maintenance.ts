// ─────────────────────────────────────────────────────────────────────────────
// MineCore — Maintenance Record Types
// ─────────────────────────────────────────────────────────────────────────────

import { MaintenanceType, MaintenanceStatus } from "./enums";

export interface MaintenanceRecord {
  id: string;
  equipmentId: string;
  performedById?: string | null;
  issue: string;
  actionTaken?: string | null;
  maintenanceDate: string;
  type: MaintenanceType;
  status: MaintenanceStatus;
  scheduledAt?: string | null;
  completedAt?: string | null;
  notes?: string | null;
  cost?: number | null;
  createdAt: string;
  updatedAt: string;
  // Relations
  equipment?: {
    id: string;
    name: string;
    model: string;
    site?: {
      id: string;
      name: string;
    };
  };
  performedBy?: {
    id: string;
    name: string;
  } | null;
}

export interface CreateMaintenanceDTO {
  equipmentId: string;
  performedById?: string;
  issue: string;
  actionTaken?: string;
  maintenanceDate: string;
  type: MaintenanceType;
  status?: MaintenanceStatus;
  scheduledAt?: string;
  notes?: string;
  cost?: number;
}

export interface UpdateMaintenanceDTO extends Partial<CreateMaintenanceDTO> {}

export interface MaintenanceQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: MaintenanceStatus;
  type?: MaintenanceType;
  equipmentId?: string;
}
