import { z } from 'zod';

export const createAlertSchema = z.object({
  siteId: z.string().uuid('siteId must be a valid UUID'),
  title: z.string().min(2).max(255),
  description: z.string().min(2),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  location: z.string().max(255).optional(),
});

export const updateAlertSchema = createAlertSchema.partial();

export const resolveAlertSchema = z.object({
  notes: z.string().optional(),
});
