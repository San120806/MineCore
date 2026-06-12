import { Request, Response, NextFunction } from 'express';
import * as equipmentService from '@services/equipment.service';
import { sendSuccess, sendCreated } from '@utils/apiResponse';

export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { equipment, meta } = await equipmentService.getAllEquipment(req.query as any);
    sendSuccess(res, equipment, 'Equipment retrieved', 200, meta);
  } catch (err) { next(err); }
};

export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const equipment = await equipmentService.getEquipmentById(req.params.id);
    sendSuccess(res, equipment);
  } catch (err) { next(err); }
};

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const equipment = await equipmentService.createEquipment(req.body);
    sendCreated(res, equipment, 'Equipment created');
  } catch (err) { next(err); }
};

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const equipment = await equipmentService.updateEquipment(req.params.id, req.body);
    sendSuccess(res, equipment, 'Equipment updated');
  } catch (err) { next(err); }
};

export const updateHealth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const equipment = await equipmentService.updateHealthScore(
      req.params.id,
      req.body.healthScore,
      req.body.status,
    );
    sendSuccess(res, equipment, 'Health score updated');
  } catch (err) { next(err); }
};

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await equipmentService.deleteEquipment(req.params.id);
    sendSuccess(res, null, 'Equipment deleted');
  } catch (err) { next(err); }
};
