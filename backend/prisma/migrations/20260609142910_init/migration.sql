-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'OPERATIONS_MANAGER', 'SAFETY_OFFICER', 'MAINTENANCE_ENGINEER');

-- CreateEnum
CREATE TYPE "SiteStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'MAINTENANCE', 'DECOMMISSIONED');

-- CreateEnum
CREATE TYPE "VehicleType" AS ENUM ('DUMP_TRUCK', 'EXCAVATOR', 'DRILL_RIG', 'LOADER', 'DOZER', 'HAUL_TRUCK');

-- CreateEnum
CREATE TYPE "VehicleStatus" AS ENUM ('ACTIVE', 'IDLE', 'MAINTENANCE', 'OFFLINE');

-- CreateEnum
CREATE TYPE "SensorType" AS ENUM ('TEMPERATURE', 'PRESSURE', 'VIBRATION', 'AIR_QUALITY', 'HUMIDITY');

-- CreateEnum
CREATE TYPE "SensorStatus" AS ENUM ('ONLINE', 'OFFLINE', 'DEGRADED', 'CALIBRATING');

-- CreateEnum
CREATE TYPE "AlertSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "AlertStatus" AS ENUM ('OPEN', 'ACKNOWLEDGED', 'RESOLVED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "EquipmentType" AS ENUM ('CONVEYOR', 'CRUSHER', 'PUMP', 'COMPRESSOR', 'GENERATOR', 'DRILL');

-- CreateEnum
CREATE TYPE "EquipmentStatus" AS ENUM ('OPERATIONAL', 'DEGRADED', 'OFFLINE', 'DECOMMISSIONED');

-- CreateEnum
CREATE TYPE "MaintenanceType" AS ENUM ('PREVENTIVE', 'CORRECTIVE', 'PREDICTIVE', 'EMERGENCY');

-- CreateEnum
CREATE TYPE "MaintenanceStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'OPERATIONS_MANAGER',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mining_sites" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "location" VARCHAR(500) NOT NULL,
    "coordinates" VARCHAR(100),
    "status" "SiteStatus" NOT NULL DEFAULT 'ACTIVE',
    "area_sq_km" DOUBLE PRECISION,
    "worker_count" INTEGER NOT NULL DEFAULT 0,
    "manager_name" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mining_sites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicles" (
    "id" TEXT NOT NULL,
    "site_id" TEXT NOT NULL,
    "vehicle_code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "model" VARCHAR(255) NOT NULL,
    "serial_number" VARCHAR(100) NOT NULL,
    "type" "VehicleType" NOT NULL,
    "status" "VehicleStatus" NOT NULL DEFAULT 'IDLE',
    "fuel_level" DOUBLE PRECISION NOT NULL DEFAULT 100.0,
    "battery_level" DOUBLE PRECISION,
    "last_location" VARCHAR(100),
    "last_seen" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sensors" (
    "id" TEXT NOT NULL,
    "site_id" TEXT NOT NULL,
    "sensor_code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "sensor_type" "SensorType" NOT NULL,
    "status" "SensorStatus" NOT NULL DEFAULT 'ONLINE',
    "value" DOUBLE PRECISION,
    "unit" VARCHAR(50) NOT NULL,
    "threshold_min" DOUBLE PRECISION,
    "threshold_max" DOUBLE PRECISION,
    "last_reading" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sensors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sensor_readings" (
    "id" TEXT NOT NULL,
    "sensor_id" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "unit" VARCHAR(50) NOT NULL,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sensor_readings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "safety_alerts" (
    "id" TEXT NOT NULL,
    "site_id" TEXT NOT NULL,
    "raised_by_id" TEXT NOT NULL,
    "resolved_by_id" TEXT,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "severity" "AlertSeverity" NOT NULL,
    "status" "AlertStatus" NOT NULL DEFAULT 'OPEN',
    "location" VARCHAR(255),
    "raised_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),

    CONSTRAINT "safety_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipment" (
    "id" TEXT NOT NULL,
    "site_id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "model" VARCHAR(255) NOT NULL,
    "serial_number" VARCHAR(100) NOT NULL,
    "type" "EquipmentType" NOT NULL,
    "status" "EquipmentStatus" NOT NULL DEFAULT 'OPERATIONAL',
    "health_score" INTEGER NOT NULL DEFAULT 100,
    "next_maintenance_date" TIMESTAMP(3),
    "last_inspected" TIMESTAMP(3),
    "installed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_records" (
    "id" TEXT NOT NULL,
    "equipment_id" TEXT NOT NULL,
    "performed_by_id" TEXT,
    "issue" VARCHAR(500) NOT NULL,
    "action_taken" TEXT,
    "maintenance_date" TIMESTAMP(3) NOT NULL,
    "type" "MaintenanceType" NOT NULL,
    "status" "MaintenanceStatus" NOT NULL DEFAULT 'SCHEDULED',
    "scheduled_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "notes" TEXT,
    "cost" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "maintenance_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "mining_sites_status_idx" ON "mining_sites"("status");

-- CreateIndex
CREATE INDEX "mining_sites_name_idx" ON "mining_sites"("name");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_vehicle_code_key" ON "vehicles"("vehicle_code");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_serial_number_key" ON "vehicles"("serial_number");

-- CreateIndex
CREATE INDEX "vehicles_site_id_idx" ON "vehicles"("site_id");

-- CreateIndex
CREATE INDEX "vehicles_status_idx" ON "vehicles"("status");

-- CreateIndex
CREATE INDEX "vehicles_type_idx" ON "vehicles"("type");

-- CreateIndex
CREATE INDEX "vehicles_vehicle_code_idx" ON "vehicles"("vehicle_code");

-- CreateIndex
CREATE INDEX "vehicles_serial_number_idx" ON "vehicles"("serial_number");

-- CreateIndex
CREATE UNIQUE INDEX "sensors_sensor_code_key" ON "sensors"("sensor_code");

-- CreateIndex
CREATE INDEX "sensors_site_id_idx" ON "sensors"("site_id");

-- CreateIndex
CREATE INDEX "sensors_sensor_type_idx" ON "sensors"("sensor_type");

-- CreateIndex
CREATE INDEX "sensors_status_idx" ON "sensors"("status");

-- CreateIndex
CREATE INDEX "sensors_sensor_code_idx" ON "sensors"("sensor_code");

-- CreateIndex
CREATE INDEX "sensor_readings_sensor_id_idx" ON "sensor_readings"("sensor_id");

-- CreateIndex
CREATE INDEX "sensor_readings_recorded_at_idx" ON "sensor_readings"("recorded_at");

-- CreateIndex
CREATE INDEX "sensor_readings_sensor_id_recorded_at_idx" ON "sensor_readings"("sensor_id", "recorded_at");

-- CreateIndex
CREATE INDEX "safety_alerts_site_id_idx" ON "safety_alerts"("site_id");

-- CreateIndex
CREATE INDEX "safety_alerts_severity_idx" ON "safety_alerts"("severity");

-- CreateIndex
CREATE INDEX "safety_alerts_status_idx" ON "safety_alerts"("status");

-- CreateIndex
CREATE INDEX "safety_alerts_raised_at_idx" ON "safety_alerts"("raised_at");

-- CreateIndex
CREATE INDEX "safety_alerts_site_id_status_idx" ON "safety_alerts"("site_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "equipment_serial_number_key" ON "equipment"("serial_number");

-- CreateIndex
CREATE INDEX "equipment_site_id_idx" ON "equipment"("site_id");

-- CreateIndex
CREATE INDEX "equipment_status_idx" ON "equipment"("status");

-- CreateIndex
CREATE INDEX "equipment_type_idx" ON "equipment"("type");

-- CreateIndex
CREATE INDEX "equipment_health_score_idx" ON "equipment"("health_score");

-- CreateIndex
CREATE INDEX "equipment_next_maintenance_date_idx" ON "equipment"("next_maintenance_date");

-- CreateIndex
CREATE INDEX "maintenance_records_equipment_id_idx" ON "maintenance_records"("equipment_id");

-- CreateIndex
CREATE INDEX "maintenance_records_status_idx" ON "maintenance_records"("status");

-- CreateIndex
CREATE INDEX "maintenance_records_type_idx" ON "maintenance_records"("type");

-- CreateIndex
CREATE INDEX "maintenance_records_maintenance_date_idx" ON "maintenance_records"("maintenance_date");

-- CreateIndex
CREATE INDEX "maintenance_records_equipment_id_status_idx" ON "maintenance_records"("equipment_id", "status");

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "mining_sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sensors" ADD CONSTRAINT "sensors_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "mining_sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sensor_readings" ADD CONSTRAINT "sensor_readings_sensor_id_fkey" FOREIGN KEY ("sensor_id") REFERENCES "sensors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "safety_alerts" ADD CONSTRAINT "safety_alerts_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "mining_sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "safety_alerts" ADD CONSTRAINT "safety_alerts_raised_by_id_fkey" FOREIGN KEY ("raised_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "safety_alerts" ADD CONSTRAINT "safety_alerts_resolved_by_id_fkey" FOREIGN KEY ("resolved_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment" ADD CONSTRAINT "equipment_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "mining_sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_records" ADD CONSTRAINT "maintenance_records_equipment_id_fkey" FOREIGN KEY ("equipment_id") REFERENCES "equipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_records" ADD CONSTRAINT "maintenance_records_performed_by_id_fkey" FOREIGN KEY ("performed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
