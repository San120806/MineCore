import { Request, Response, NextFunction } from 'express';
import * as alertService from '@services/alert.service';
import { sendSuccess, sendCreated } from '@utils/apiResponse';

export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { alerts, meta } = await alertService.getAllAlerts(req.query as any);
    sendSuccess(res, alerts, 'Alerts retrieved', 200, meta);
  } catch (err) { next(err); }
};

export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const alert = await alertService.getAlertById(req.params.id);
    sendSuccess(res, alert);
  } catch (err) { next(err); }
};

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const alert = await alertService.createAlert(req.body, req.user!.id);
    sendCreated(res, alert, 'Safety alert created');
  } catch (err) { next(err); }
};

export const acknowledge = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const alert = await alertService.acknowledgeAlert(req.params.id);
    sendSuccess(res, alert, 'Alert acknowledged');
  } catch (err) { next(err); }
};

export const resolve = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const alert = await alertService.resolveAlert(req.params.id, req.user!.id);
    sendSuccess(res, alert, 'Alert resolved');
  } catch (err) { next(err); }
};

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await alertService.deleteAlert(req.params.id);
    sendSuccess(res, null, 'Alert deleted');
  } catch (err) { next(err); }
};
