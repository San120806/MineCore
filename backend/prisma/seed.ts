import { PrismaClient, VehicleType, VehicleStatus, SensorType, SensorStatus, AlertSeverity, AlertStatus, EquipmentType, EquipmentStatus, MaintenanceType, MaintenanceStatus, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // ── Clean existing data ───────────────────────────────────────────────────
  await prisma.maintenanceRecord.deleteMany();
  await prisma.safetyAlert.deleteMany();
  await prisma.sensorReading.deleteMany();
  await prisma.sensor.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.equipment.deleteMany();
  await prisma.miningSite.deleteMany();
  await prisma.user.deleteMany();

  // ── Users ─────────────────────────────────────────────────────────────────
  const hashedPassword = await bcrypt.hash('MineCore@2024', 12);

  const users = await Promise.all([
    prisma.user.create({ data: { name: 'Sarah Mitchell', email: 'admin@minecore.com', passwordHash: hashedPassword, role: UserRole.ADMIN } }),
    prisma.user.create({ data: { name: 'James Thornton', email: 'ops1@minecore.com', passwordHash: hashedPassword, role: UserRole.OPERATIONS_MANAGER } }),
    prisma.user.create({ data: { name: 'Linda Reeves', email: 'ops2@minecore.com', passwordHash: hashedPassword, role: UserRole.OPERATIONS_MANAGER } }),
    prisma.user.create({ data: { name: 'Kevin Park', email: 'safety1@minecore.com', passwordHash: hashedPassword, role: UserRole.SAFETY_OFFICER } }),
    prisma.user.create({ data: { name: 'Angela Foster', email: 'safety2@minecore.com', passwordHash: hashedPassword, role: UserRole.SAFETY_OFFICER } }),
    prisma.user.create({ data: { name: 'Robert Hines', email: 'maint1@minecore.com', passwordHash: hashedPassword, role: UserRole.MAINTENANCE_ENGINEER } }),
    prisma.user.create({ data: { name: 'Diana Cruz', email: 'maint2@minecore.com', passwordHash: hashedPassword, role: UserRole.MAINTENANCE_ENGINEER } }),
  ]);

  const [admin, ops1, , safety1, , maint1, maint2] = users;
  console.log(`✅  Created ${users.length} users`);

  // ── Mining Sites ──────────────────────────────────────────────────────────
  const sitesData = [
    { name: 'Kalgoorlie Gold Mine', location: 'Kalgoorlie, Western Australia', coordinates: '-30.7489,121.4660', workerCount: 1200, areaSqKm: 8.5, managerName: 'James Thornton' },
    { name: 'Pilbara Iron Ore Complex', location: 'Pilbara, Western Australia', coordinates: '-23.3580,119.7777', workerCount: 980, areaSqKm: 12.3, managerName: 'Linda Reeves' },
    { name: 'Hunter Valley Coal Site', location: 'Hunter Valley, New South Wales', coordinates: '-32.3271,150.9350', workerCount: 750, areaSqKm: 6.1, managerName: 'James Thornton' },
    { name: 'Olympic Dam Copper Mine', location: 'Roxby Downs, South Australia', coordinates: '-30.4425,136.8862', workerCount: 1100, areaSqKm: 10.8, managerName: 'Linda Reeves' },
    { name: 'Mount Isa Zinc Mine', location: 'Mount Isa, Queensland', coordinates: '-20.7256,139.4927', workerCount: 890, areaSqKm: 7.4, managerName: 'James Thornton' },
  ];

  const sites = await Promise.all(
    sitesData.map((s) => prisma.miningSite.create({ data: { ...s, status: 'ACTIVE' } })),
  );
  console.log(`✅  Created ${sites.length} mining sites`);

  // ── Vehicles (50 total, ~10 per site) ─────────────────────────────────────
  const vehicleTypes: VehicleType[] = ['DUMP_TRUCK', 'EXCAVATOR', 'DRILL_RIG', 'LOADER', 'DOZER', 'HAUL_TRUCK'];
  const vehicleStatuses: VehicleStatus[] = ['ACTIVE', 'ACTIVE', 'ACTIVE', 'IDLE', 'MAINTENANCE', 'OFFLINE'];
  const vehicleModels: Record<VehicleType, string[]> = {
    DUMP_TRUCK: ['CAT 797F', 'Komatsu 930E', 'BelAZ 75710'],
    EXCAVATOR: ['CAT 6090', 'Liebherr R 9800', 'Komatsu PC8000'],
    DRILL_RIG: ['Atlas Copco D75KS', 'Sandvik DR412i', 'CAT MD6310'],
    LOADER: ['CAT 994K', 'Komatsu WA1200', 'LeTourneau L-2350'],
    DOZER: ['CAT D11T', 'Komatsu D575A', 'Liebherr PR 776'],
    HAUL_TRUCK: ['Hitachi EH5000AC-3', 'Liebherr T 284', 'CAT 785D'],
  };

  const vehicles = [];
  for (let i = 0; i < 50; i++) {
    const site = sites[i % sites.length];
    const type = vehicleTypes[i % vehicleTypes.length];
    const status = vehicleStatuses[i % vehicleStatuses.length];
    const models = vehicleModels[type];
    vehicles.push(
      await prisma.vehicle.create({
        data: {
          siteId: site.id,
          vehicleCode: `VH-${String(i + 1).padStart(3, '0')}`,
          name: `${type.replace('_', ' ')} ${i + 1}`,
          model: models[i % models.length],
          serialNumber: `SN-VH-${String(i + 1).padStart(5, '0')}`,
          type,
          status,
          fuelLevel: 20 + Math.random() * 80,
          batteryLevel: type === 'EXCAVATOR' ? 30 + Math.random() * 70 : null,
          lastLocation: `${(site.coordinates?.split(',')[0] ?? '-25') + (Math.random() * 0.1 - 0.05).toFixed(4)},${(site.coordinates?.split(',')[1] ?? '130') + (Math.random() * 0.1 - 0.05).toFixed(4)}`,
          lastSeen: new Date(Date.now() - Math.random() * 3600000),
        },
      }),
    );
  }
  console.log(`✅  Created ${vehicles.length} vehicles`);

  // ── Sensors (100 total, ~20 per site) ─────────────────────────────────────
  const sensorTypes: SensorType[] = ['TEMPERATURE', 'PRESSURE', 'VIBRATION', 'AIR_QUALITY', 'HUMIDITY'];
  const sensorUnits: Record<SensorType, string> = {
    TEMPERATURE: '°C', PRESSURE: 'hPa', VIBRATION: 'mm/s', AIR_QUALITY: 'ppm', HUMIDITY: '%',
  };
  const sensorThresholds: Record<SensorType, { min: number; max: number; value: () => number }> = {
    TEMPERATURE: { min: -10, max: 80, value: () => 20 + Math.random() * 40 },
    PRESSURE: { min: 900, max: 1100, value: () => 950 + Math.random() * 100 },
    VIBRATION: { min: 0, max: 15, value: () => Math.random() * 10 },
    AIR_QUALITY: { min: 0, max: 500, value: () => 10 + Math.random() * 200 },
    HUMIDITY: { min: 10, max: 95, value: () => 30 + Math.random() * 50 },
  };
  const sensorStatuses: SensorStatus[] = ['ONLINE', 'ONLINE', 'ONLINE', 'ONLINE', 'DEGRADED', 'OFFLINE', 'CALIBRATING'];

  const sensors = [];
  for (let i = 0; i < 100; i++) {
    const site = sites[i % sites.length];
    const type = sensorTypes[i % sensorTypes.length];
    const thresholds = sensorThresholds[type];
    const status = sensorStatuses[i % sensorStatuses.length];
    sensors.push(
      await prisma.sensor.create({
        data: {
          siteId: site.id,
          sensorCode: `SN-${String(i + 1).padStart(3, '0')}`,
          name: `${type.replace('_', ' ')} Sensor ${i + 1}`,
          sensorType: type,
          status,
          value: status !== 'OFFLINE' ? thresholds.value() : null,
          unit: sensorUnits[type],
          thresholdMin: thresholds.min,
          thresholdMax: thresholds.max,
          lastReading: status !== 'OFFLINE' ? new Date(Date.now() - Math.random() * 300000) : null,
        },
      }),
    );
  }
  console.log(`✅  Created ${sensors.length} sensors`);

  // Add some sensor readings for analytics
  for (const sensor of sensors.slice(0, 20)) {
    const thresholds = sensorThresholds[sensor.sensorType];
    for (let r = 0; r < 24; r++) {
      await prisma.sensorReading.create({
        data: {
          sensorId: sensor.id,
          value: thresholds.value(),
          unit: sensor.unit,
          recordedAt: new Date(Date.now() - r * 3600000),
        },
      });
    }
  }
  console.log('✅  Created sensor readings (24h history for 20 sensors)');

  // ── Equipment (30 records) ─────────────────────────────────────────────────
  const equipmentTypes: EquipmentType[] = ['CONVEYOR', 'CRUSHER', 'PUMP', 'COMPRESSOR', 'GENERATOR', 'DRILL'];
  const equipmentStatuses: EquipmentStatus[] = ['OPERATIONAL', 'OPERATIONAL', 'OPERATIONAL', 'DEGRADED', 'DEGRADED', 'OFFLINE'];
  const equipmentModels: Record<EquipmentType, string> = {
    CONVEYOR: 'Rexnord FlatTop 5936', CRUSHER: 'Metso GP500S',
    PUMP: 'Grundfos MG 355', COMPRESSOR: 'Atlas Copco GA 355+',
    GENERATOR: 'CAT 3516C', DRILL: 'Sandvik DR412i',
  };

  const equipmentList = [];
  for (let i = 0; i < 30; i++) {
    const site = sites[i % sites.length];
    const type = equipmentTypes[i % equipmentTypes.length];
    const status = equipmentStatuses[i % equipmentStatuses.length];
    const healthScore = status === 'OPERATIONAL' ? 70 + Math.floor(Math.random() * 30)
      : status === 'DEGRADED' ? 30 + Math.floor(Math.random() * 40)
      : Math.floor(Math.random() * 30);

    equipmentList.push(
      await prisma.equipment.create({
        data: {
          siteId: site.id,
          name: `${type.replace('_', ' ')} Unit ${i + 1}`,
          model: equipmentModels[type],
          serialNumber: `SN-EQ-${String(i + 1).padStart(5, '0')}`,
          type,
          status,
          healthScore,
          nextMaintenanceDate: new Date(Date.now() + (7 + i * 5) * 24 * 3600000),
          lastInspected: new Date(Date.now() - (i + 1) * 7 * 24 * 3600000),
          installedAt: new Date(Date.now() - (i + 1) * 180 * 24 * 3600000),
        },
      }),
    );
  }
  console.log(`✅  Created ${equipmentList.length} equipment records`);

  // ── Safety Alerts (25 records) ────────────────────────────────────────────
  const alertSeverities: AlertSeverity[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL', 'LOW', 'MEDIUM'];
  const alertStatuses: AlertStatus[] = ['OPEN', 'OPEN', 'ACKNOWLEDGED', 'RESOLVED', 'RESOLVED', 'DISMISSED'];
  const alertTemplates = [
    { title: 'Gas Leak Detected in Sector 4', description: 'Methane levels exceeding safe threshold in drilling sector 4. Immediate evacuation required.' },
    { title: 'Equipment Overheat Warning', description: 'Crusher unit temperature reached 95°C. Cooling system inspection required.' },
    { title: 'Unauthorized Access to Blasting Zone', description: 'Motion sensors detected movement in restricted blasting zone B-12 during off-hours.' },
    { title: 'Conveyor Belt Tear Alert', description: 'Large tear detected on conveyor belt section C-7, causing production slowdown.' },
    { title: 'High Dust Concentration', description: 'Silica dust levels 3x above safety limit detected in underground tunnels.' },
    { title: 'Vehicle Proximity Warning', description: 'Autonomous haul truck VH-012 operating dangerously close to excavation edge.' },
    { title: 'Flooding Risk in Pit Level 3', description: 'Water accumulation detected in open pit level 3 after heavy rainfall.' },
    { title: 'Seismic Activity Detected', description: 'Ground vibration sensors recorded 2.4 magnitude event near the north wall.' },
    { title: 'Electrical System Failure', description: 'Main generator breaker tripped at Site B power substation causing partial blackout.' },
    { title: 'Worker SOS Triggered', description: 'Emergency beacon activated by worker ID #W-4421 in tunnel section T-08.' },
  ];

  const alertsCreated = [];
  for (let i = 0; i < 25; i++) {
    const site = sites[i % sites.length];
    const template = alertTemplates[i % alertTemplates.length];
    const severity = alertSeverities[i % alertSeverities.length];
    const status = alertStatuses[i % alertStatuses.length];

    alertsCreated.push(
      await prisma.safetyAlert.create({
        data: {
          siteId: site.id,
          raisedById: safety1.id,
          resolvedById: status === 'RESOLVED' ? admin.id : null,
          title: template.title,
          description: template.description,
          severity,
          status,
          location: `Zone ${String.fromCharCode(65 + (i % 8))}-${i + 1}`,
          raisedAt: new Date(Date.now() - (i + 1) * 12 * 3600000),
          resolvedAt: status === 'RESOLVED' ? new Date(Date.now() - i * 6 * 3600000) : null,
        },
      }),
    );
  }
  console.log(`✅  Created ${alertsCreated.length} safety alerts`);

  // ── Maintenance Records (20 records) ──────────────────────────────────────
  const maintenanceTypes: MaintenanceType[] = ['PREVENTIVE', 'CORRECTIVE', 'PREDICTIVE', 'EMERGENCY'];
  const maintenanceStatuses: MaintenanceStatus[] = ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
  const maintenanceIssues = [
    'Hydraulic oil contamination detected during routine inspection',
    'Worn gear teeth causing excessive vibration in crusher unit',
    'Bearing failure predicted by vibration analysis — replacement required',
    'Emergency: conveyor belt seized causing production halt',
    'Scheduled annual overhaul and lubrication',
    'Coolant leak from pump seal needs immediate repair',
  ];
  const actionsMap = [
    'Replaced hydraulic fluid and inspected all seals. System restored.',
    'Gear set replaced, tooth profile verified. Machine back to operational.',
    'Bearing replaced proactively. Machine health restored to 95%.',
    'Emergency belt splice performed. Full belt replacement scheduled.',
    'Complete overhaul performed. All components inspected and greased.',
    'Pump seal replaced, coolant system flushed and refilled.',
  ];

  for (let i = 0; i < 20; i++) {
    const equipment = equipmentList[i % equipmentList.length];
    const type = maintenanceTypes[i % maintenanceTypes.length];
    const status = maintenanceStatuses[i % maintenanceStatuses.length];
    const issueIdx = i % maintenanceIssues.length;

    await prisma.maintenanceRecord.create({
      data: {
        equipmentId: equipment.id,
        performedById: i % 2 === 0 ? maint1.id : maint2.id,
        issue: maintenanceIssues[issueIdx],
        actionTaken: status === 'COMPLETED' ? actionsMap[issueIdx] : null,
        maintenanceDate: new Date(Date.now() + (i - 10) * 24 * 3600000),
        type,
        status,
        scheduledAt: new Date(Date.now() + (i - 10) * 24 * 3600000),
        completedAt: status === 'COMPLETED' ? new Date(Date.now() - i * 24 * 3600000) : null,
        cost: status === 'COMPLETED' ? 500 + Math.random() * 9500 : null,
        notes: `Maintenance record ${i + 1} — ${type.toLowerCase()} maintenance`,
      },
    });
  }
  console.log('✅  Created 20 maintenance records');

  console.log('\n🎉 Seed completed successfully!');
  console.log('\n📋 Test Credentials:');
  console.log('   Admin:              admin@minecore.com     / MineCore@2024');
  console.log('   Ops Manager:        ops1@minecore.com      / MineCore@2024');
  console.log('   Safety Officer:     safety1@minecore.com   / MineCore@2024');
  console.log('   Maint. Engineer:    maint1@minecore.com    / MineCore@2024');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
