import { z } from 'zod';

export const createSiteSchema = z.object({
  name: z.string().min(2).max(255),
  location: z.string().min(2).max(500),
  coordinates: z.string().max(100).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'MAINTENANCE', 'DECOMMISSIONED']).optional(),
  areaSqKm: z.number().positive().optional(),
  workerCount: z.number().int().min(0).optional(),
  managerName: z.string().max(255).optional(),
});

export const updateSiteSchema = createSiteSchema.partial();
