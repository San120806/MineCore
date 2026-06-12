import { z } from 'zod';

export const updateUserSchema = z.object({
  name: z.string().min(2).max(255).optional(),
  email: z.string().email().optional(),
  role: z
    .enum(['ADMIN', 'OPERATIONS_MANAGER', 'SAFETY_OFFICER', 'MAINTENANCE_ENGINEER'])
    .optional(),
});

export const updateUserStatusSchema = z.object({
  isActive: z.boolean(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(100),
});
