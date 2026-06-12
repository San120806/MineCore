// ─────────────────────────────────────────────────────────────────────────────
// MineCore — Sensor Form Validators (Zod)
// ─────────────────────────────────────────────────────────────────────────────

import { z } from 'zod';
import { SensorType, SensorStatus } from '@/types/enums';

export const sensorSchema = z.object({
  siteId: z.string().min(1, 'Site is required'),
  sensorCode: z.string().min(1, 'Sensor code is required').max(50),
  name: z.string().min(1, 'Name is required').max(255),
  sensorType: z.nativeEnum(SensorType, { message: 'Sensor type is required' }),
  unit: z.string().min(1, 'Unit is required').max(50),
  status: z.nativeEnum(SensorStatus).optional(),
  thresholdMin: z.coerce.number().optional().nullable(),
  thresholdMax: z.coerce.number().optional().nullable(),
});

export type SensorFormValues = z.infer<typeof sensorSchema>;
