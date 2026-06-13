// ─────────────────────────────────────────────────────────────────────────────
// MineCore — Safety Alert Types
// ─────────────────────────────────────────────────────────────────────────────

import { AlertSeverity, AlertStatus } from "./enums";

export interface SafetyAlert {
  id: string;
  siteId: string;
  raisedById: string;
  resolvedById?: string | null;
  title: string;
  description: string;
  severity: AlertSeverity;
  status: AlertStatus;
  location?: string | null;
  raisedAt: string;
  resolvedAt?: string | null;
  // Relations
  site?: {
    id: string;
    name: string;
  };
  raisedBy?: {
    id: string;
    name: string;
  };
  resolvedBy?: {
    id: string;
    name: string;
  } | null;
}

export interface CreateAlertDTO {
  siteId: string;
  title: string;
  description: string;
  severity: AlertSeverity;
  location?: string;
}

export interface ResolveAlertDTO {
  resolvedById: string;
  notes?: string;
}

export interface UpdateAlertDTO {
  status?: AlertStatus;
  resolvedById?: string;
}

export interface AlertQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  severity?: AlertSeverity;
  status?: AlertStatus;
  siteId?: string;
}
