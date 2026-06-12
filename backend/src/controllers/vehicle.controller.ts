import { Request, Response, NextFunction } from 'express';
import * as vehicleService from '@services/vehicle.service';
import { sendSuccess, sendCreated } from '@utils/apiResponse';

export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { vehicles, meta } = await vehicleService.getAllVehicles(req.query as any);
    sendSuccess(res, vehicles, 'Vehicles retrieved', 200, meta);
  } catch (err) { next(err); }
};

export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const vehicle = await vehicleService.getVehicleById(req.params.id);
    sendSuccess(res, vehicle);
  } catch (err) { next(err); }
};

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const vehicle = await vehicleService.createVehicle(req.body);
    sendCreated(res, vehicle, 'Vehicle created');
  } catch (err) { next(err); }
};

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const vehicle = await vehicleService.updateVehicle(req.params.id, req.body);
    sendSuccess(res, vehicle, 'Vehicle updated');
  } catch (err) { next(err); }
};

export const updateStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const vehicle = await vehicleService.updateVehicleStatus(req.params.id, req.body.status);
    sendSuccess(res, vehicle, 'Vehicle status updated');
  } catch (err) { next(err); }
};

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await vehicleService.deleteVehicle(req.params.id);
    sendSuccess(res, null, 'Vehicle deleted');
  } catch (err) { next(err); }
};
