import { z } from 'zod';

export const createEquipmentSchema = z.object({
  siteId: z.string().uuid('siteId must be a valid UUID'),
  name: z.string().min(1).max(255),
  model: z.string().min(1).max(255),
  serialNumber: z.string().min(1).max(100),
  type: z.enum(['CONVEYOR', 'CRUSHER', 'PUMP', 'COMPRESSOR', 'GENERATOR', 'DRILL']),
  status: z.enum(['OPERATIONAL', 'DEGRADED', 'OFFLINE', 'DECOMMISSIONED']).optional(),
  healthScore: z.number().int().min(0).max(100).optional(),
  nextMaintenanceDate: z.string().datetime().nullable().optional(),
  installedAt: z.string().datetime().optional(),
});

export const updateEquipmentSchema = createEquipmentSchema.partial();

export const updateHealthScoreSchema = z.object({
  healthScore: z.number().int().min(0).max(100),
  status: z.enum(['OPERATIONAL', 'DEGRADED', 'OFFLINE', 'DECOMMISSIONED']).optional(),
});
