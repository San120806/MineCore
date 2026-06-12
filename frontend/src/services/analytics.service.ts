// ─────────────────────────────────────────────────────────────────────────────
// MineCore — Analytics Service
// Fetches, aggregates, and structures live backend data for Recharts components.
// ─────────────────────────────────────────────────────────────────────────────

import { getSites } from './sites.service';
import { getVehicles } from './vehicles.service';
import { getSensors } from './sensors.service';
import { getAlerts } from './alerts.service';
import { getEquipmentList } from './equipment.service';
import { getMaintenanceList } from './maintenance.service';

import {
  VehicleStatus,
  VehicleType,
  SensorStatus,
  SensorType,
  AlertSeverity,
  AlertStatus,
  EquipmentStatus,
  EquipmentType,
  MaintenanceStatus,
  MaintenanceType,
} from '@/types/enums';

// Helper labels
import {
  VEHICLE_TYPE_LABELS,
  SENSOR_TYPE_LABELS,
  EQUIPMENT_TYPE_LABELS,
  MAINTENANCE_TYPE_LABELS,
} from '@/constants/enums';

export interface ChartPieEntry {
  name: string;
  value: number;
  fill?: string;
}

export interface ChartBarEntry {
  label: string;
  [key: string]: string | number;
}

export interface AnalyticsData {
  // Fleet Tab
  vehicleStatus: ChartPieEntry[];
  vehicleSiteUtilization: ChartBarEntry[];
  vehicleTypeAvgFuel: ChartBarEntry[];

  // Equipment Tab
  equipmentStatus: ChartPieEntry[];
  equipmentHealthDist: ChartPieEntry[];
  equipmentTypeAvgHealth: ChartBarEntry[];

  // Sensors Tab
  sensorTypeDist: ChartPieEntry[];
  sensorStatus: ChartBarEntry[];
  sensorTypeAvgValue: ChartBarEntry[];

  // Safety Tab
  alertSeverity: ChartPieEntry[];
  alertFrequencyBySite: ChartBarEntry[];
  alertStatusRatio: ChartBarEntry[];

  // Maintenance Tab
  maintenanceStatus: ChartPieEntry[];
  maintenanceTypeDist: ChartBarEntry[];
  maintenanceCostBySite: ChartBarEntry[];
}

export const getAnalyticsData = async (): Promise<AnalyticsData> => {
  const [
    sitesRes,
    vehiclesRes,
    sensorsRes,
    alertsRes,
    equipmentRes,
    maintenanceRes,
  ] = await Promise.all([
    getSites({ limit: 100 }),
    getVehicles({ limit: 200 }),
    getSensors({ limit: 200 }),
    getAlerts({ limit: 200 }),
    getEquipmentList({ limit: 200 }),
    getMaintenanceList({ limit: 200 }),
  ]);

  const sites = sitesRes.data || [];
  const vehicles = vehiclesRes.data || [];
  const sensors = sensorsRes.data || [];
  const alerts = alertsRes.data || [];
  const equipment = equipmentRes.data || [];
  const maintenance = maintenanceRes.data || [];

  // 1. Vehicle Status distribution (Pie Chart)
  const vehicleStatusMap: Record<VehicleStatus, number> = {
    [VehicleStatus.ACTIVE]: 0,
    [VehicleStatus.IDLE]: 0,
    [VehicleStatus.MAINTENANCE]: 0,
    [VehicleStatus.OFFLINE]: 0,
  };
  vehicles.forEach((v) => {
    if (v.status in vehicleStatusMap) {
      vehicleStatusMap[v.status]++;
    }
  });
  const vehicleStatus: ChartPieEntry[] = [
    { name: 'Active', value: vehicleStatusMap[VehicleStatus.ACTIVE], fill: '#10b981' },
    { name: 'Idle', value: vehicleStatusMap[VehicleStatus.IDLE], fill: '#6b7280' },
    { name: 'Maintenance', value: vehicleStatusMap[VehicleStatus.MAINTENANCE], fill: '#f59e0b' },
    { name: 'Offline', value: vehicleStatusMap[VehicleStatus.OFFLINE], fill: '#ef4444' },
  ];

  // 2. Vehicle Site Utilization (Area Chart)
  const vehicleSiteMap: Record<string, { label: string; active: number; idle: number }> = {};
  sites.forEach((s) => {
    vehicleSiteMap[s.id] = { label: s.name, active: 0, idle: 0 };
  });
  vehicles.forEach((v) => {
    const siteId = v.siteId;
    if (siteId && vehicleSiteMap[siteId]) {
      if (v.status === VehicleStatus.ACTIVE) {
        vehicleSiteMap[siteId].active++;
      } else if (v.status === VehicleStatus.IDLE) {
        vehicleSiteMap[siteId].idle++;
      }
    }
  });
  const vehicleSiteUtilization = Object.values(vehicleSiteMap);

  // 3. Vehicle Type Average Fuel / Battery Level (Bar Chart)
  const vehicleTypeMap: Record<VehicleType, { sum: number; count: number }> = {} as any;
  Object.values(VehicleType).forEach((t) => {
    vehicleTypeMap[t] = { sum: 0, count: 0 };
  });
  vehicles.forEach((v) => {
    if (v.type in vehicleTypeMap) {
      vehicleTypeMap[v.type].sum += v.fuelLevel ?? 0;
      vehicleTypeMap[v.type].count++;
    }
  });
  const vehicleTypeAvgFuel = Object.entries(vehicleTypeMap).map(([type, stats]) => {
    const label = VEHICLE_TYPE_LABELS[type as VehicleType] || type;
    const avg = stats.count > 0 ? Math.round(stats.sum / stats.count) : 0;
    return { label, fuel: avg };
  });

  // 4. Equipment Status Breakdown (Pie Chart)
  const equipStatusMap: Record<EquipmentStatus, number> = {
    [EquipmentStatus.OPERATIONAL]: 0,
    [EquipmentStatus.DEGRADED]: 0,
    [EquipmentStatus.OFFLINE]: 0,
    [EquipmentStatus.DECOMMISSIONED]: 0,
  };
  equipment.forEach((e) => {
    if (e.status in equipStatusMap) {
      equipStatusMap[e.status]++;
    }
  });
  const equipmentStatus: ChartPieEntry[] = [
    { name: 'Operational', value: equipStatusMap[EquipmentStatus.OPERATIONAL], fill: '#10b981' },
    { name: 'Degraded', value: equipStatusMap[EquipmentStatus.DEGRADED], fill: '#f59e0b' },
    { name: 'Offline', value: equipStatusMap[EquipmentStatus.OFFLINE], fill: '#ef4444' },
    { name: 'Decommissioned', value: equipStatusMap[EquipmentStatus.DECOMMISSIONED], fill: '#6b7280' },
  ];

  // 5. Equipment Health score distribution (Pie Chart)
  let optimalEquip = 0; // >85
  let warningEquip = 0; // 51-85
  let criticalEquip = 0; // <=50
  equipment.forEach((e) => {
    const score = e.healthScore ?? 0;
    if (score > 85) optimalEquip++;
    else if (score > 50) warningEquip++;
    else criticalEquip++;
  });
  const equipmentHealthDist: ChartPieEntry[] = [
    { name: 'Optimal (>85)', value: optimalEquip, fill: '#10b981' },
    { name: 'Warning (51-85)', value: warningEquip, fill: '#f59e0b' },
    { name: 'Critical (0-50)', value: criticalEquip, fill: '#ef4444' },
  ];

  // 6. Equipment Average Health by Type (Bar Chart)
  const equipTypeMap: Record<EquipmentType, { sum: number; count: number }> = {} as any;
  Object.values(EquipmentType).forEach((t) => {
    equipTypeMap[t] = { sum: 0, count: 0 };
  });
  equipment.forEach((e) => {
    if (e.type in equipTypeMap) {
      equipTypeMap[e.type].sum += e.healthScore ?? 0;
      equipTypeMap[e.type].count++;
    }
  });
  const equipmentTypeAvgHealth = Object.entries(equipTypeMap).map(([type, stats]) => {
    const label = EQUIPMENT_TYPE_LABELS[type as EquipmentType] || type;
    const avg = stats.count > 0 ? Math.round(stats.sum / stats.count) : 0;
    return { label, health: avg };
  });

  // 7. Sensor Type Distribution (Pie Chart)
  const sensorTypeCountMap: Record<SensorType, number> = {
    [SensorType.TEMPERATURE]: 0,
    [SensorType.PRESSURE]: 0,
    [SensorType.VIBRATION]: 0,
    [SensorType.AIR_QUALITY]: 0,
    [SensorType.HUMIDITY]: 0,
  };
  sensors.forEach((s) => {
    if (s.sensorType in sensorTypeCountMap) {
      sensorTypeCountMap[s.sensorType]++;
    }
  });
  const sensorTypeDist: ChartPieEntry[] = Object.entries(sensorTypeCountMap).map(([type, count]) => ({
    name: SENSOR_TYPE_LABELS[type as SensorType] || type,
    value: count,
  }));

  // 8. Sensor Status (Bar Chart)
  const sensorStatusMap: Record<SensorStatus, number> = {
    [SensorStatus.ONLINE]: 0,
    [SensorStatus.DEGRADED]: 0,
    [SensorStatus.OFFLINE]: 0,
    [SensorStatus.CALIBRATING]: 0,
  };
  sensors.forEach((s) => {
    if (s.status in sensorStatusMap) {
      sensorStatusMap[s.status]++;
    }
  });
  const sensorStatus: ChartBarEntry[] = [
    { label: 'Online', count: sensorStatusMap[SensorStatus.ONLINE] },
    { label: 'Degraded', count: sensorStatusMap[SensorStatus.DEGRADED] },
    { label: 'Offline', count: sensorStatusMap[SensorStatus.OFFLINE] },
    { label: 'Calibrating', count: sensorStatusMap[SensorStatus.CALIBRATING] },
  ];

  // 9. Sensor Type Average Value (Line Chart)
  const sensorValueMap: Record<SensorType, { sum: number; count: number }> = {} as any;
  Object.values(SensorType).forEach((t) => {
    sensorValueMap[t] = { sum: 0, count: 0 };
  });
  sensors.forEach((s) => {
    if (s.sensorType in sensorValueMap && s.value != null) {
      sensorValueMap[s.sensorType].sum += s.value;
      sensorValueMap[s.sensorType].count++;
    }
  });
  const sensorTypeAvgValue = Object.entries(sensorValueMap).map(([type, stats]) => {
    const label = SENSOR_TYPE_LABELS[type as SensorType] || type;
    const avg = stats.count > 0 ? Number((stats.sum / stats.count).toFixed(2)) : 0;
    return { label, value: avg };
  });

  // 10. Alert Severity Distribution (Pie Chart)
  const alertSeverityMap: Record<AlertSeverity, number> = {
    [AlertSeverity.LOW]: 0,
    [AlertSeverity.MEDIUM]: 0,
    [AlertSeverity.HIGH]: 0,
    [AlertSeverity.CRITICAL]: 0,
  };
  alerts.forEach((a) => {
    if (a.severity in alertSeverityMap) {
      alertSeverityMap[a.severity]++;
    }
  });
  const alertSeverity: ChartPieEntry[] = [
    { name: 'Low', value: alertSeverityMap[AlertSeverity.LOW], fill: '#3b82f6' },
    { name: 'Medium', value: alertSeverityMap[AlertSeverity.MEDIUM], fill: '#10b981' },
    { name: 'High', value: alertSeverityMap[AlertSeverity.HIGH], fill: '#f59e0b' },
    { name: 'Critical', value: alertSeverityMap[AlertSeverity.CRITICAL], fill: '#ef4444' },
  ];

  // 11. Alert Frequency by Site (Bar Chart)
  const alertSiteMap: Record<string, { label: string; count: number }> = {};
  sites.forEach((s) => {
    alertSiteMap[s.id] = { label: s.name, count: 0 };
  });
  alerts.forEach((a) => {
    const siteId = a.siteId;
    if (siteId && alertSiteMap[siteId]) {
      alertSiteMap[siteId].count++;
    }
  });
  const alertFrequencyBySite = Object.values(alertSiteMap);

  // 12. Alert Status: Open vs Acknowledged vs Resolved Ratio (Area Chart)
  const alertStatusSiteMap: Record<string, { label: string; open: number; resolved: number }> = {};
  sites.forEach((s) => {
    alertStatusSiteMap[s.id] = { label: s.name, open: 0, resolved: 0 };
  });
  alerts.forEach((a) => {
    const siteId = a.siteId;
    if (siteId && alertStatusSiteMap[siteId]) {
      if (a.status === AlertStatus.RESOLVED) {
        alertStatusSiteMap[siteId].resolved++;
      } else {
        alertStatusSiteMap[siteId].open++;
      }
    }
  });
  const alertStatusRatio = Object.values(alertStatusSiteMap);

  // 13. Maintenance Status Breakdown (Pie Chart)
  const maintenanceStatusMap: Record<MaintenanceStatus, number> = {
    [MaintenanceStatus.SCHEDULED]: 0,
    [MaintenanceStatus.IN_PROGRESS]: 0,
    [MaintenanceStatus.COMPLETED]: 0,
    [MaintenanceStatus.CANCELLED]: 0,
  };
  maintenance.forEach((m) => {
    if (m.status in maintenanceStatusMap) {
      maintenanceStatusMap[m.status]++;
    }
  });
  const maintenanceStatus: ChartPieEntry[] = [
    { name: 'Scheduled', value: maintenanceStatusMap[MaintenanceStatus.SCHEDULED], fill: '#3b82f6' },
    { name: 'In Progress', value: maintenanceStatusMap[MaintenanceStatus.IN_PROGRESS], fill: '#f59e0b' },
    { name: 'Completed', value: maintenanceStatusMap[MaintenanceStatus.COMPLETED], fill: '#10b981' },
    { name: 'Cancelled', value: maintenanceStatusMap[MaintenanceStatus.CANCELLED], fill: '#6b7280' },
  ];

  // 14. Maintenance Type Distribution (Bar Chart)
  const maintenanceTypeMap: Record<MaintenanceType, number> = {
    [MaintenanceType.PREVENTIVE]: 0,
    [MaintenanceType.CORRECTIVE]: 0,
    [MaintenanceType.PREDICTIVE]: 0,
    [MaintenanceType.EMERGENCY]: 0,
  };
  maintenance.forEach((m) => {
    if (m.type in maintenanceTypeMap) {
      maintenanceTypeMap[m.type]++;
    }
  });
  const maintenanceTypeDist = Object.entries(maintenanceTypeMap).map(([type, count]) => ({
    label: MAINTENANCE_TYPE_LABELS[type as MaintenanceType] || type,
    count,
  }));

  // 15. Maintenance Cost by Site (Area Chart)
  const maintCostSiteMap: Record<string, { label: string; cost: number }> = {};
  sites.forEach((s) => {
    maintCostSiteMap[s.id] = { label: s.name, cost: 0 };
  });
  maintenance.forEach((m) => {
    const siteId = m.equipment?.site?.id;
    if (siteId && maintCostSiteMap[siteId] && m.cost) {
      maintCostSiteMap[siteId].cost += m.cost;
    }
  });
  const maintenanceCostBySite = Object.values(maintCostSiteMap);

  return {
    vehicleStatus,
    vehicleSiteUtilization,
    vehicleTypeAvgFuel,
    equipmentStatus,
    equipmentHealthDist,
    equipmentTypeAvgHealth,
    sensorTypeDist,
    sensorStatus,
    sensorTypeAvgValue,
    alertSeverity,
    alertFrequencyBySite,
    alertStatusRatio,
    maintenanceStatus,
    maintenanceTypeDist,
    maintenanceCostBySite,
  };
};
