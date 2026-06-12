// ─────────────────────────────────────────────────────────────────────────────
// MineCore — Auth API Services
// ─────────────────────────────────────────────────────────────────────────────

import apiClient from '@/lib/api';
import { API_ENDPOINTS } from '@/constants/api';
import type { AuthResponse, LoginPayload, RegisterPayload, User } from '@/types/auth';
import type { ApiResponse } from '@/types/api';

/** POST /auth/login */
export const loginApi = async (payload: LoginPayload): Promise<AuthResponse> => {
  const { data } = await apiClient.post<ApiResponse<AuthResponse>>(
    API_ENDPOINTS.AUTH.LOGIN,
    payload
  );
  return data.data;
};

/** POST /auth/register */
export const registerApi = async (payload: RegisterPayload): Promise<AuthResponse> => {
  const { data } = await apiClient.post<ApiResponse<AuthResponse>>(
    API_ENDPOINTS.AUTH.REGISTER,
    payload
  );
  return data.data;
};

/** GET /auth/me */
export const getMeApi = async (): Promise<User> => {
  const { data } = await apiClient.get<ApiResponse<User>>(
    API_ENDPOINTS.AUTH.ME
  );
  return data.data;
};

/** POST /auth/refresh */
export const refreshTokenApi = async (refreshToken: string): Promise<AuthResponse> => {
  const { data } = await apiClient.post<ApiResponse<AuthResponse>>(
    API_ENDPOINTS.AUTH.REFRESH,
    { refreshToken }
  );
  return data.data;
};

/** POST /auth/logout */
export const logoutApi = async (): Promise<void> => {
  await apiClient.post<ApiResponse<null>>(API_ENDPOINTS.AUTH.LOGOUT);
};
