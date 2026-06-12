// ─────────────────────────────────────────────────────────────────────────────
// MineCore — Maintenance Form Validators (Zod)
// ─────────────────────────────────────────────────────────────────────────────

import { z } from 'zod';
import { MaintenanceType, MaintenanceStatus } from '@/types/enums';

export const maintenanceSchema = z.object({
  equipmentId: z.string().min(1, 'Equipment is required'),
  performedById: z.string().optional(),
  issue: z.string().min(1, 'Issue description is required').max(500),
  actionTaken: z.string().optional(),
  maintenanceDate: z.string().min(1, 'Maintenance date is required'),
  type: z.nativeEnum(MaintenanceType, { message: 'Type is required' }),
  status: z.nativeEnum(MaintenanceStatus).optional(),
  scheduledAt: z.string().optional(),
  notes: z.string().optional(),
  cost: z.coerce.number().min(0).optional().nullable(),
});

export type MaintenanceFormValues = z.infer<typeof maintenanceSchema>;
