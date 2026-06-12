import { z } from 'zod';

export const createVehicleSchema = z.object({
  siteId: z.string().uuid('siteId must be a valid UUID'),
  vehicleCode: z.string().min(1).max(50),
  name: z.string().min(1).max(255),
  model: z.string().min(1).max(255),
  serialNumber: z.string().min(1).max(100),
  type: z.enum(['DUMP_TRUCK', 'EXCAVATOR', 'DRILL_RIG', 'LOADER', 'DOZER', 'HAUL_TRUCK']),
  status: z.enum(['ACTIVE', 'IDLE', 'MAINTENANCE', 'OFFLINE']).optional(),
  fuelLevel: z.number().min(0).max(100).optional(),
  batteryLevel: z.number().min(0).max(100).nullable().optional(),
  lastLocation: z.string().max(100).optional(),
});

export const updateVehicleSchema = createVehicleSchema.partial();

export const updateVehicleStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'IDLE', 'MAINTENANCE', 'OFFLINE']),
});
