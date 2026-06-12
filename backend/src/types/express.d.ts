import { Request } from 'express';
import { UserRole } from '@prisma/client';

// ─── Augmented Express Request ───────────────────────────────────────────────
// Extends Express Request to include the authenticated user payload
// injected by the authenticate middleware.

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
        name: string;
      };
    }
  }
}

export {};
