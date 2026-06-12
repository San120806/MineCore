// ─────────────────────────────────────────────────────────────────────────────
// MineCore — Vehicle Form Validators (Zod)
// ─────────────────────────────────────────────────────────────────────────────

import { z } from 'zod';
import { VehicleType, VehicleStatus } from '@/types/enums';

export const vehicleSchema = z.object({
  siteId: z.string().min(1, 'Site is required'),
  vehicleCode: z.string().min(1, 'Vehicle code is required').max(50),
  name: z.string().min(1, 'Name is required').max(255),
  model: z.string().min(1, 'Model is required').max(255),
  serialNumber: z.string().min(1, 'Serial number is required').max(100),
  type: z.nativeEnum(VehicleType, { message: 'Vehicle type is required' }),
  status: z.nativeEnum(VehicleStatus).optional(),
  fuelLevel: z.coerce.number().min(0).max(100).optional(),
  batteryLevel: z.coerce.number().min(0).max(100).optional().nullable(),
  lastLocation: z.string().optional(),
});

export type VehicleFormValues = z.infer<typeof vehicleSchema>;
