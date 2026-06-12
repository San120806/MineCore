// ─────────────────────────────────────────────────────────────────────────────
// MineCore — API Endpoint Constants
// Backend base: http://localhost:4000/api/v1
// ─────────────────────────────────────────────────────────────────────────────

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export const API_PREFIX = '/api/v1';

export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    REFRESH: '/auth/refresh',
    ME: '/auth/me',
    LOGOUT: '/auth/logout',
  },

  // Sites
  SITES: {
    BASE: '/sites',
    BY_ID: (id: string) => `/sites/${id}`,
  },

  // Vehicles
  VEHICLES: {
    BASE: '/vehicles',
    BY_ID: (id: string) => `/vehicles/${id}`,
  },

  // Sensors
  SENSORS: {
    BASE: '/sensors',
    BY_ID: (id: string) => `/sensors/${id}`,
    READINGS: (id: string) => `/sensors/${id}/readings`,
    RECORD_READING: (id: string) => `/sensors/${id}/readings`,
  },

  // Alerts
  ALERTS: {
    BASE: '/alerts',
    BY_ID: (id: string) => `/alerts/${id}`,
    RESOLVE: (id: string) => `/alerts/${id}/resolve`,
    ACKNOWLEDGE: (id: string) => `/alerts/${id}/acknowledge`,
    DISMISS: (id: string) => `/alerts/${id}/dismiss`,
  },

  // Equipment
  EQUIPMENT: {
    BASE: '/equipment',
    BY_ID: (id: string) => `/equipment/${id}`,
    HEALTH: (id: string) => `/equipment/${id}/health`,
  },

  // Maintenance
  MAINTENANCE: {
    BASE: '/maintenance',
    BY_ID: (id: string) => `/maintenance/${id}`,
  },

  // Users
  USERS: {
    BASE: '/users',
    BY_ID: (id: string) => `/users/${id}`,
  },
} as const;
