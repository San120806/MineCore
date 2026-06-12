// ─────────────────────────────────────────────────────────────────────────────
// MineCore — Dashboard Service
// Fetches operational metadata in parallel to calculate KPI aggregates.
// ─────────────────────────────────────────────────────────────────────────────

import { getSites } from './sites.service';
import { getVehicles } from './vehicles.service';
import { getSensors } from './sensors.service';
import { getAlerts } from './alerts.service';
import { getEquipmentList } from './equipment.service';
import { VehicleStatus, SensorStatus, AlertStatus } from '@/types/enums';

export interface DashboardStats {
  sitesCount: number;
  vehiclesCount: number;
  activeVehiclesCount: number;
  sensorsCount: number;
  onlineSensorsCount: number;
  openAlertsCount: number;
  averageEquipmentHealth: number;
}

export const getDashboardData = async (): Promise<DashboardStats> => {
  const [
    sitesRes,
    vehiclesRes,
    activeVehiclesRes,
    sensorsRes,
    onlineSensorsRes,
    openAlertsRes,
    equipmentRes,
  ] = await Promise.all([
    getSites({ limit: 1 }),
    getVehicles({ limit: 1 }),
    getVehicles({ limit: 1, status: VehicleStatus.ACTIVE }),
    getSensors({ limit: 1 }),
    getSensors({ limit: 1, status: SensorStatus.ONLINE }),
    getAlerts({ limit: 1, status: AlertStatus.OPEN }),
    getEquipmentList({ limit: 100 }),
  ]);

  // Compute average health score for equipment
  const equipment = equipmentRes.data || [];
  const totalHealth = equipment.reduce((sum, item) => sum + (item.healthScore ?? 0), 0);
  const avgHealth = equipment.length > 0 ? Math.round(totalHealth / equipment.length) : 0;

  return {
    sitesCount: sitesRes.meta.total,
    vehiclesCount: vehiclesRes.meta.total,
    activeVehiclesCount: activeVehiclesRes.meta.total,
    sensorsCount: sensorsRes.meta.total,
    onlineSensorsCount: onlineSensorsRes.meta.total,
    openAlertsCount: openAlertsRes.meta.total,
    averageEquipmentHealth: avgHealth,
  };
};
