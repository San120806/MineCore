import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import { AppError } from './errorHandler';

/**
 * Role-based authorization middleware.
 * Usage: authorize(UserRole.ADMIN, UserRole.OPERATIONS_MANAGER)
 */
export const authorize = (...roles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'));
    }

    if (!roles.includes(req.user.role as UserRole)) {
      return next(
        new AppError(
          `Access denied. Required role(s): ${roles.join(', ')}`,
          403,
          'FORBIDDEN',
        ),
      );
    }

    next();
  };
};
