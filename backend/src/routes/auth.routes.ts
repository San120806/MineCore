import { Router } from 'express';
import * as authController from '@controllers/auth.controller';
import { authenticate } from '@middleware/authenticate';
import { validate } from '@middleware/validate';
import { registerSchema, loginSchema, refreshTokenSchema } from '@validators/auth.validator';

const router = Router();

// POST /api/v1/auth/register
router.post('/register', validate(registerSchema), authController.register);

// POST /api/v1/auth/login
router.post('/login', validate(loginSchema), authController.login);

// POST /api/v1/auth/refresh
router.post('/refresh', validate(refreshTokenSchema), authController.refreshToken);

// POST /api/v1/auth/logout  (protected)
router.post('/logout', authenticate, authController.logout);

// GET  /api/v1/auth/me  (protected)
router.get('/me', authenticate, authController.getMe);

export default router;
