import { Request, Response, NextFunction } from 'express';
import * as sensorService from '@services/sensor.service';
import { sendSuccess, sendCreated } from '@utils/apiResponse';

export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sensors, meta } = await sensorService.getAllSensors(req.query as any);
    sendSuccess(res, sensors, 'Sensors retrieved', 200, meta);
  } catch (err) { next(err); }
};

export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sensor = await sensorService.getSensorById(req.params.id);
    sendSuccess(res, sensor);
  } catch (err) { next(err); }
};

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sensor = await sensorService.createSensor(req.body);
    sendCreated(res, sensor, 'Sensor registered');
  } catch (err) { next(err); }
};

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sensor = await sensorService.updateSensor(req.params.id, req.body);
    sendSuccess(res, sensor, 'Sensor updated');
  } catch (err) { next(err); }
};

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await sensorService.deleteSensor(req.params.id);
    sendSuccess(res, null, 'Sensor deleted');
  } catch (err) { next(err); }
};

export const getReadings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { readings, meta } = await sensorService.getSensorReadings(req.params.id, req.query as any);
    sendSuccess(res, readings, 'Sensor readings retrieved', 200, meta);
  } catch (err) { next(err); }
};

export const ingestReading = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reading = await sensorService.ingestReading(req.params.id, req.body.value, req.body.unit);
    sendCreated(res, reading, 'Reading recorded');
  } catch (err) { next(err); }
};
