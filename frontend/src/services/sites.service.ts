// ─────────────────────────────────────────────────────────────────────────────
// MineCore — Sites Service
// ─────────────────────────────────────────────────────────────────────────────

import apiClient from '@/lib/api';
import { API_ENDPOINTS } from '@/constants/api';
import type { MiningSite, CreateSiteDTO, UpdateSiteDTO, SiteQueryParams } from '@/types/site';
import type { ApiResponse, PaginatedResponse } from '@/types/api';

export const getSites = async (params?: SiteQueryParams): Promise<PaginatedResponse<MiningSite>> => {
  const { data } = await apiClient.get<PaginatedResponse<MiningSite>>(
    API_ENDPOINTS.SITES.BASE,
    { params }
  );
  return data;
};

export const getSite = async (id: string): Promise<MiningSite> => {
  const { data } = await apiClient.get<ApiResponse<MiningSite>>(
    API_ENDPOINTS.SITES.BY_ID(id)
  );
  return data.data;
};

export const createSite = async (payload: CreateSiteDTO): Promise<MiningSite> => {
  const { data } = await apiClient.post<ApiResponse<MiningSite>>(
    API_ENDPOINTS.SITES.BASE,
    payload
  );
  return data.data;
};

export const updateSite = async (id: string, payload: UpdateSiteDTO): Promise<MiningSite> => {
  const { data } = await apiClient.put<ApiResponse<MiningSite>>(
    API_ENDPOINTS.SITES.BY_ID(id),
    payload
  );
  return data.data;
};

export const deleteSite = async (id: string): Promise<void> => {
  await apiClient.delete<ApiResponse<null>>(
    API_ENDPOINTS.SITES.BY_ID(id)
  );
};
