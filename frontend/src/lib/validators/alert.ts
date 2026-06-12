// ─────────────────────────────────────────────────────────────────────────────
// MineCore — Alert Form Validators (Zod)
// ─────────────────────────────────────────────────────────────────────────────

import { z } from 'zod';
import { AlertSeverity } from '@/types/enums';

export const createAlertSchema = z.object({
  siteId: z.string().min(1, 'Site is required'),
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().min(1, 'Description is required'),
  severity: z.nativeEnum(AlertSeverity, { message: 'Severity is required' }),
  location: z.string().max(255).optional(),
});

export type CreateAlertFormValues = z.infer<typeof createAlertSchema>;

export const resolveAlertSchema = z.object({
  notes: z.string().optional(),
});

export type ResolveAlertFormValues = z.infer<typeof resolveAlertSchema>;
