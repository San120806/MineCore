// ─────────────────────────────────────────────────────────────────────────────
// MineCore — Equipment Form Validators (Zod)
// ─────────────────────────────────────────────────────────────────────────────

import { z } from 'zod';
import { EquipmentType, EquipmentStatus } from '@/types/enums';

export const equipmentSchema = z.object({
  siteId: z.string().min(1, 'Site is required'),
  name: z.string().min(1, 'Name is required').max(255),
  model: z.string().min(1, 'Model is required').max(255),
  serialNumber: z.string().min(1, 'Serial number is required').max(100),
  type: z.nativeEnum(EquipmentType, { message: 'Equipment type is required' }),
  status: z.nativeEnum(EquipmentStatus).optional(),
  healthScore: z.coerce.number().int().min(0).max(100).optional(),
  nextMaintenanceDate: z.string().optional(),
  installedAt: z.string().optional(),
});

export type EquipmentFormValues = z.infer<typeof equipmentSchema>;

export const healthScoreSchema = z.object({
  healthScore: z.coerce
    .number()
    .int()
    .min(0, 'Health score must be 0 or above')
    .max(100, 'Health score cannot exceed 100'),
  status: z.nativeEnum(EquipmentStatus).optional(),
});

export type HealthScoreFormValues = z.infer<typeof healthScoreSchema>;
