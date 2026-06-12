import { Request, Response, NextFunction } from 'express';
import * as maintenanceService from '@services/maintenance.service';
import { sendSuccess, sendCreated } from '@utils/apiResponse';

export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { records, meta } = await maintenanceService.getAllMaintenance(req.query as any);
    sendSuccess(res, records, 'Maintenance records retrieved', 200, meta);
  } catch (err) { next(err); }
};

export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const record = await maintenanceService.getMaintenanceById(req.params.id);
    sendSuccess(res, record);
  } catch (err) { next(err); }
};

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const record = await maintenanceService.createMaintenance(req.body, req.user?.id);
    sendCreated(res, record, 'Maintenance record created');
  } catch (err) { next(err); }
};

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const record = await maintenanceService.updateMaintenance(req.params.id, req.body);
    sendSuccess(res, record, 'Maintenance record updated');
  } catch (err) { next(err); }
};

export const complete = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const record = await maintenanceService.completeMaintenance(req.params.id, req.body);
    sendSuccess(res, record, 'Maintenance completed');
  } catch (err) { next(err); }
};

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await maintenanceService.deleteMaintenance(req.params.id);
    sendSuccess(res, null, 'Maintenance record deleted');
  } catch (err) { next(err); }
};
