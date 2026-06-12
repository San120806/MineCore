// ─────────────────────────────────────────────────────────────────────────────
// MineCore — Axios API Client
// Standard configured client with token injection and auto-refresh interceptors.
// ─────────────────────────────────────────────────────────────────────────────

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL, API_PREFIX, API_ENDPOINTS } from '@/constants/api';
import { getTokens, setTokens, clearTokens } from '@/features/auth/services/token.service';

interface QueueItem {
  resolve: (value: unknown) => void;
  reject: (error: unknown) => void;
}

// Global flag to track if we're currently refreshing the access token
let isRefreshing = false;
let failedQueue: QueueItem[] = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

const apiClient = axios.create({
  baseURL: `${API_BASE_URL}${API_PREFIX}`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15_000,
});

// Request Interceptor: inject Authorization access token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Skip token injection for login and refresh endpoints
    const isLoginOrRefresh =
      config.url === API_ENDPOINTS.AUTH.LOGIN ||
      config.url === API_ENDPOINTS.AUTH.REFRESH;

    if (!isLoginOrRefresh) {
      const { accessToken } = getTokens();
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: auto-refresh expired tokens
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // If response status is 401 and we haven't retried this request yet
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      // Prevent infinite loops if the refresh call itself returns 401
      if (originalRequest.url === API_ENDPOINTS.AUTH.REFRESH) {
        clearTokens();
        if (typeof window !== 'undefined') {
          window.location.href = '/login?expired=true';
        }
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      const { refreshToken } = getTokens();
      if (!refreshToken) {
        // No refresh token available, clear state and redirect to login
        clearTokens();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Queue this request until the token is refreshed
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token) => {
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${token}`;
              }
              resolve(apiClient(originalRequest));
            },
            reject: (err) => reject(err),
          });
        });
      }

      isRefreshing = true;

      try {
        // Call the refresh endpoint directly to get a new access token
        const refreshResponse = await axios.post(
          `${API_BASE_URL}${API_PREFIX}${API_ENDPOINTS.AUTH.REFRESH}`,
          { refreshToken }
        );

        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = refreshResponse.data.data;
        setTokens(newAccessToken, newRefreshToken);

        // Process all queued requests
        processQueue(null, newAccessToken);

        // Retry the original request
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }
        return apiClient(originalRequest);
      } catch (refreshError: any) {
        // Refresh token failed, perform logout cleanup
        processQueue(refreshError, null);
        clearTokens();
        if (typeof window !== 'undefined') {
          window.location.href = '/login?expired=true';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
