// ─────────────────────────────────────────────────────────────────────────────
// MineCore — Display Label Maps for all Enums
// ─────────────────────────────────────────────────────────────────────────────

import {
  UserRole,
  SiteStatus,
  VehicleType,
  VehicleStatus,
  SensorType,
  SensorStatus,
  AlertSeverity,
  AlertStatus,
  EquipmentType,
  EquipmentStatus,
  MaintenanceType,
  MaintenanceStatus,
} from '@/types/enums';

// ─── User Role Labels ────────────────────────────────────────────────────────
export const USER_ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.ADMIN]: 'Admin',
  [UserRole.OPERATIONS_MANAGER]: 'Operations Manager',
  [UserRole.SAFETY_OFFICER]: 'Safety Officer',
  [UserRole.MAINTENANCE_ENGINEER]: 'Maintenance Engineer',
};

// ─── Site Status ─────────────────────────────────────────────────────────────
export const SITE_STATUS_LABELS: Record<SiteStatus, string> = {
  [SiteStatus.ACTIVE]: 'Active',
  [SiteStatus.INACTIVE]: 'Inactive',
  [SiteStatus.MAINTENANCE]: 'Maintenance',
  [SiteStatus.DECOMMISSIONED]: 'Decommissioned',
};

export const SITE_STATUS_COLORS: Record<SiteStatus, string> = {
  [SiteStatus.ACTIVE]: 'emerald',
  [SiteStatus.INACTIVE]: 'slate',
  [SiteStatus.MAINTENANCE]: 'amber',
  [SiteStatus.DECOMMISSIONED]: 'red',
};

// ─── Vehicle Type Labels ──────────────────────────────────────────────────────
export const VEHICLE_TYPE_LABELS: Record<VehicleType, string> = {
  [VehicleType.DUMP_TRUCK]: 'Dump Truck',
  [VehicleType.EXCAVATOR]: 'Excavator',
  [VehicleType.DRILL_RIG]: 'Drill Rig',
  [VehicleType.LOADER]: 'Loader',
  [VehicleType.DOZER]: 'Dozer',
  [VehicleType.HAUL_TRUCK]: 'Haul Truck',
};

// ─── Vehicle Status Labels ───────────────────────────────────────────────────
export const VEHICLE_STATUS_LABELS: Record<VehicleStatus, string> = {
  [VehicleStatus.ACTIVE]: 'Active',
  [VehicleStatus.IDLE]: 'Idle',
  [VehicleStatus.MAINTENANCE]: 'Maintenance',
  [VehicleStatus.OFFLINE]: 'Offline',
};

export const VEHICLE_STATUS_COLORS: Record<VehicleStatus, string> = {
  [VehicleStatus.ACTIVE]: 'emerald',
  [VehicleStatus.IDLE]: 'blue',
  [VehicleStatus.MAINTENANCE]: 'amber',
  [VehicleStatus.OFFLINE]: 'red',
};

// ─── Sensor Type Labels ───────────────────────────────────────────────────────
export const SENSOR_TYPE_LABELS: Record<SensorType, string> = {
  [SensorType.TEMPERATURE]: 'Temperature',
  [SensorType.PRESSURE]: 'Pressure',
  [SensorType.VIBRATION]: 'Vibration',
  [SensorType.AIR_QUALITY]: 'Air Quality',
  [SensorType.HUMIDITY]: 'Humidity',
};

// ─── Sensor Status Labels ─────────────────────────────────────────────────────
export const SENSOR_STATUS_LABELS: Record<SensorStatus, string> = {
  [SensorStatus.ONLINE]: 'Online',
  [SensorStatus.OFFLINE]: 'Offline',
  [SensorStatus.DEGRADED]: 'Degraded',
  [SensorStatus.CALIBRATING]: 'Calibrating',
};

export const SENSOR_STATUS_COLORS: Record<SensorStatus, string> = {
  [SensorStatus.ONLINE]: 'emerald',
  [SensorStatus.OFFLINE]: 'red',
  [SensorStatus.DEGRADED]: 'amber',
  [SensorStatus.CALIBRATING]: 'blue',
};

// ─── Alert Severity Labels ───────────────────────────────────────────────────
export const ALERT_SEVERITY_LABELS: Record<AlertSeverity, string> = {
  [AlertSeverity.LOW]: 'Low',
  [AlertSeverity.MEDIUM]: 'Medium',
  [AlertSeverity.HIGH]: 'High',
  [AlertSeverity.CRITICAL]: 'Critical',
};

export const ALERT_SEVERITY_COLORS: Record<AlertSeverity, string> = {
  [AlertSeverity.LOW]: 'slate',
  [AlertSeverity.MEDIUM]: 'amber',
  [AlertSeverity.HIGH]: 'orange',
  [AlertSeverity.CRITICAL]: 'red',
};

// ─── Alert Status Labels ──────────────────────────────────────────────────────
export const ALERT_STATUS_LABELS: Record<AlertStatus, string> = {
  [AlertStatus.OPEN]: 'Open',
  [AlertStatus.ACKNOWLEDGED]: 'Acknowledged',
  [AlertStatus.RESOLVED]: 'Resolved',
  [AlertStatus.DISMISSED]: 'Dismissed',
};

export const ALERT_STATUS_COLORS: Record<AlertStatus, string> = {
  [AlertStatus.OPEN]: 'red',
  [AlertStatus.ACKNOWLEDGED]: 'amber',
  [AlertStatus.RESOLVED]: 'emerald',
  [AlertStatus.DISMISSED]: 'slate',
};

// ─── Equipment Type Labels ────────────────────────────────────────────────────
export const EQUIPMENT_TYPE_LABELS: Record<EquipmentType, string> = {
  [EquipmentType.CONVEYOR]: 'Conveyor',
  [EquipmentType.CRUSHER]: 'Crusher',
  [EquipmentType.PUMP]: 'Pump',
  [EquipmentType.COMPRESSOR]: 'Compressor',
  [EquipmentType.GENERATOR]: 'Generator',
  [EquipmentType.DRILL]: 'Drill',
};

// ─── Equipment Status Labels ──────────────────────────────────────────────────
export const EQUIPMENT_STATUS_LABELS: Record<EquipmentStatus, string> = {
  [EquipmentStatus.OPERATIONAL]: 'Operational',
  [EquipmentStatus.DEGRADED]: 'Degraded',
  [EquipmentStatus.OFFLINE]: 'Offline',
  [EquipmentStatus.DECOMMISSIONED]: 'Decommissioned',
};

export const EQUIPMENT_STATUS_COLORS: Record<EquipmentStatus, string> = {
  [EquipmentStatus.OPERATIONAL]: 'emerald',
  [EquipmentStatus.DEGRADED]: 'amber',
  [EquipmentStatus.OFFLINE]: 'red',
  [EquipmentStatus.DECOMMISSIONED]: 'slate',
};

// ─── Maintenance Type Labels ──────────────────────────────────────────────────
export const MAINTENANCE_TYPE_LABELS: Record<MaintenanceType, string> = {
  [MaintenanceType.PREVENTIVE]: 'Preventive',
  [MaintenanceType.CORRECTIVE]: 'Corrective',
  [MaintenanceType.PREDICTIVE]: 'Predictive',
  [MaintenanceType.EMERGENCY]: 'Emergency',
};

export const MAINTENANCE_TYPE_COLORS: Record<MaintenanceType, string> = {
  [MaintenanceType.PREVENTIVE]: 'blue',
  [MaintenanceType.CORRECTIVE]: 'amber',
  [MaintenanceType.PREDICTIVE]: 'purple',
  [MaintenanceType.EMERGENCY]: 'red',
};

// ─── Maintenance Status Labels ────────────────────────────────────────────────
export const MAINTENANCE_STATUS_LABELS: Record<MaintenanceStatus, string> = {
  [MaintenanceStatus.SCHEDULED]: 'Scheduled',
  [MaintenanceStatus.IN_PROGRESS]: 'In Progress',
  [MaintenanceStatus.COMPLETED]: 'Completed',
  [MaintenanceStatus.CANCELLED]: 'Cancelled',
};

export const MAINTENANCE_STATUS_COLORS: Record<MaintenanceStatus, string> = {
  [MaintenanceStatus.SCHEDULED]: 'blue',
  [MaintenanceStatus.IN_PROGRESS]: 'amber',
  [MaintenanceStatus.COMPLETED]: 'emerald',
  [MaintenanceStatus.CANCELLED]: 'slate',
};
