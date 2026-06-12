import { Request, Response, NextFunction } from 'express';
import * as siteService from '@services/site.service';
import { sendSuccess, sendCreated } from '@utils/apiResponse';

export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sites, meta } = await siteService.getAllSites(req.query as any);
    sendSuccess(res, sites, 'Sites retrieved', 200, meta);
  } catch (err) { next(err); }
};

export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const site = await siteService.getSiteById(req.params.id);
    sendSuccess(res, site);
  } catch (err) { next(err); }
};

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const site = await siteService.createSite(req.body);
    sendCreated(res, site, 'Mining site created');
  } catch (err) { next(err); }
};

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const site = await siteService.updateSite(req.params.id, req.body);
    sendSuccess(res, site, 'Mining site updated');
  } catch (err) { next(err); }
};

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await siteService.deleteSite(req.params.id);
    sendSuccess(res, null, 'Mining site deleted');
  } catch (err) { next(err); }
};
