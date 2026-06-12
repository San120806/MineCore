import { Request, Response, NextFunction } from 'express';
import * as authService from '@services/auth.service';
import { sendSuccess, sendCreated } from '@utils/apiResponse';

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await authService.register(req.body);
    sendCreated(res, result, 'Registration successful');
  } catch (err) { next(err); }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await authService.login(req.body.email, req.body.password);
    sendSuccess(res, result, 'Login successful');
  } catch (err) { next(err); }
};

export const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await authService.refreshTokens(req.body.refreshToken);
    sendSuccess(res, result, 'Token refreshed');
  } catch (err) { next(err); }
};

export const logout = (_req: Request, res: Response) => {
  // Stateless JWT — client discards tokens. Future: add token blocklist.
  sendSuccess(res, null, 'Logged out successfully');
};

export const getMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await authService.getMe(req.user!.id);
    sendSuccess(res, user);
  } catch (err) { next(err); }
};
