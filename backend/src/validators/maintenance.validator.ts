import { z } from 'zod';

export const createMaintenanceSchema = z.object({
  equipmentId: z.string().uuid('equipmentId must be a valid UUID'),
  issue: z.string().min(2).max(500),
  actionTaken: z.string().optional(),
  maintenanceDate: z.string().datetime('maintenanceDate must be a valid ISO datetime'),
  type: z.enum(['PREVENTIVE', 'CORRECTIVE', 'PREDICTIVE', 'EMERGENCY']),
  status: z.enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  scheduledAt: z.string().datetime().optional(),
  notes: z.string().optional(),
  cost: z.number().positive().optional(),
});

export const updateMaintenanceSchema = createMaintenanceSchema.partial();

export const completeMaintenanceSchema = z.object({
  actionTaken: z.string().min(2),
  notes: z.string().optional(),
  cost: z.number().positive().optional(),
});
