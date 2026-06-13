// ─────────────────────────────────────────────────────────────────────────────
// MineCore — Shared Enums (mirrors backend Prisma enums exactly)
// ─────────────────────────────────────────────────────────────────────────────

export enum UserRole {
  ADMIN = "ADMIN",
  OPERATIONS_MANAGER = "OPERATIONS_MANAGER",
  SAFETY_OFFICER = "SAFETY_OFFICER",
  MAINTENANCE_ENGINEER = "MAINTENANCE_ENGINEER",
}

export enum SiteStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  MAINTENANCE = "MAINTENANCE",
  DECOMMISSIONED = "DECOMMISSIONED",
}

export enum VehicleType {
  DUMP_TRUCK = "DUMP_TRUCK",
  EXCAVATOR = "EXCAVATOR",
  DRILL_RIG = "DRILL_RIG",
  LOADER = "LOADER",
  DOZER = "DOZER",
  HAUL_TRUCK = "HAUL_TRUCK",
}

export enum VehicleStatus {
  ACTIVE = "ACTIVE",
  IDLE = "IDLE",
  MAINTENANCE = "MAINTENANCE",
  OFFLINE = "OFFLINE",
}

export enum SensorType {
  TEMPERATURE = "TEMPERATURE",
  PRESSURE = "PRESSURE",
  VIBRATION = "VIBRATION",
  AIR_QUALITY = "AIR_QUALITY",
  HUMIDITY = "HUMIDITY",
}

export enum SensorStatus {
  ONLINE = "ONLINE",
  OFFLINE = "OFFLINE",
  DEGRADED = "DEGRADED",
  CALIBRATING = "CALIBRATING",
}

export enum AlertSeverity {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
}

export enum AlertStatus {
  OPEN = "OPEN",
  ACKNOWLEDGED = "ACKNOWLEDGED",
  RESOLVED = "RESOLVED",
  DISMISSED = "DISMISSED",
}

export enum EquipmentType {
  CONVEYOR = "CONVEYOR",
  CRUSHER = "CRUSHER",
  PUMP = "PUMP",
  COMPRESSOR = "COMPRESSOR",
  GENERATOR = "GENERATOR",
  DRILL = "DRILL",
}

export enum EquipmentStatus {
  OPERATIONAL = "OPERATIONAL",
  DEGRADED = "DEGRADED",
  OFFLINE = "OFFLINE",
  DECOMMISSIONED = "DECOMMISSIONED",
}

export enum MaintenanceType {
  PREVENTIVE = "PREVENTIVE",
  CORRECTIVE = "CORRECTIVE",
  PREDICTIVE = "PREDICTIVE",
  EMERGENCY = "EMERGENCY",
}

export enum MaintenanceStatus {
  SCHEDULED = "SCHEDULED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}
