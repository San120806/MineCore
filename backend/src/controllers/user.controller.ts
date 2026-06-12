import { Request, Response, NextFunction } from 'express';
import * as userService from '@services/user.service';
import { sendSuccess } from '@utils/apiResponse';

export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { users, meta } = await userService.getAllUsers(req.query as any);
    sendSuccess(res, users, 'Users retrieved', 200, meta);
  } catch (err) { next(err); }
};

export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await userService.getUserById(req.params.id);
    sendSuccess(res, user);
  } catch (err) { next(err); }
};

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await userService.updateUser(req.params.id, req.body);
    sendSuccess(res, user, 'User updated');
  } catch (err) { next(err); }
};

export const updateStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await userService.updateUserStatus(req.params.id, req.body.isActive);
    sendSuccess(res, user, 'User status updated');
  } catch (err) { next(err); }
};

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await userService.deleteUser(req.params.id);
    sendSuccess(res, null, 'User deleted');
  } catch (err) { next(err); }
};

export const changePassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await userService.changePassword(
      req.params.id,
      req.body.currentPassword,
      req.body.newPassword,
    );
    sendSuccess(res, null, 'Password changed successfully');
  } catch (err) { next(err); }
};
