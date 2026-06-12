import { Response } from 'express';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export const sendSuccess = (
  res: Response,
  data: unknown,
  message = 'Success',
  statusCode = 200,
  meta?: PaginationMeta,
) => {
  res.status(statusCode).json({
    success: true,
    message,
    data,
    ...(meta && { meta }),
  });
};

export const sendCreated = (res: Response, data: unknown, message = 'Created successfully') =>
  sendSuccess(res, data, message, 201);

export const sendError = (
  res: Response,
  message: string,
  statusCode = 500,
  code = 'INTERNAL_ERROR',
  details?: unknown,
) => {
  const errorBody: Record<string, unknown> = { code, message };
  if (details !== undefined) errorBody.details = details;
  res.status(statusCode).json({ success: false, error: errorBody });
};
