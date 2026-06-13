// ─────────────────────────────────────────────────────────────────────────────
// MineCore — Site Form Validators (Zod)
// ─────────────────────────────────────────────────────────────────────────────

import { z } from "zod";
import { SiteStatus } from "@/types/enums";

export const siteSchema = z.object({
  name: z.string().min(1, "Site name is required").max(255),
  location: z.string().min(1, "Location is required").max(500),
  coordinates: z.string().optional(),
  status: z.nativeEnum(SiteStatus).optional(),
  areaSqKm: z.coerce
    .number()
    .positive("Area must be positive")
    .optional()
    .or(z.literal("")),
  workerCount: z.coerce
    .number()
    .int()
    .min(0, "Worker count cannot be negative")
    .optional(),
  managerName: z.string().max(255).optional(),
});

export type SiteFormValues = z.infer<typeof siteSchema>;
