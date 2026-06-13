// ─────────────────────────────────────────────────────────────────────────────
// MineCore — Mining Site Types
// ─────────────────────────────────────────────────────────────────────────────

import { SiteStatus } from "./enums";

export interface MiningSite {
  id: string;
  name: string;
  location: string;
  coordinates?: string | null;
  status: SiteStatus;
  areaSqKm?: number | null;
  workerCount: number;
  managerName?: string | null;
  createdAt: string;
  updatedAt: string;
  // Computed counts (from _count relations)
  _count?: {
    vehicles: number;
    sensors: number;
    equipment: number;
    safetyAlerts: number;
  };
}

export interface CreateSiteDTO {
  name: string;
  location: string;
  coordinates?: string;
  status?: SiteStatus;
  areaSqKm?: number;
  workerCount?: number;
  managerName?: string;
}

export interface UpdateSiteDTO extends Partial<CreateSiteDTO> {}

export interface SiteQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: SiteStatus;
}
