import { PaginationMeta } from './apiResponse';

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export const getPagination = (
  rawPage?: string | number,
  rawLimit?: string | number,
): PaginationParams => {
  const page = Math.max(1, Number(rawPage) || 1);
  const limit = Math.min(100, Math.max(1, Number(rawLimit) || 20));
  return { page, limit, skip: (page - 1) * limit };
};

export const buildMeta = (
  total: number,
  page: number,
  limit: number,
): PaginationMeta => ({
  page,
  limit,
  total,
  totalPages: Math.ceil(total / limit),
});
