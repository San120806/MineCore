// ─────────────────────────────────────────────────────────────────────────────
// MineCore — Dashboard Types
// ─────────────────────────────────────────────────────────────────────────────

import { AlertSeverity, VehicleStatus, SensorStatus, EquipmentStatus } from './enums';

export interface DashboardKPIs {
  totalSites: number;
  activeSites: number;
  totalVehicles: number;
  activeVehicles: number;
  totalSensors: number;
  onlineSensors: number;
  openAlerts: number;
  criticalAlerts: number;
  totalEquipment: number;
  averageHealthScore: number;
}

export interface ChartDataPoint {
  label: string;
  value: number;
  [key: string]: string | number;
}

export interface AlertDistributionData {
  severity: AlertSeverity;
  count: number;
  fill: string;
}

export interface VehicleStatusDistribution {
  status: VehicleStatus;
  count: number;
}

export interface SensorStatusDistribution {
  status: SensorStatus;
  count: number;
}

export interface EquipmentHealthBracket {
  bracket: string; // e.g. "90-100", "70-89", "40-69", "0-39"
  count: number;
  status: EquipmentStatus;
}

export interface ActivityFeedItem {
  id: string;
  type: 'alert' | 'maintenance' | 'vehicle' | 'sensor' | 'equipment';
  title: string;
  description: string;
  timestamp: string;
  severity?: AlertSeverity;
}

export interface TrendDataPoint {
  date: string;
  vehicles?: number;
  sensors?: number;
  alerts?: number;
  maintenance?: number;
}
