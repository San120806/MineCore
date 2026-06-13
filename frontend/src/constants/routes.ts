// ─────────────────────────────────────────────────────────────────────────────
// MineCore — App Route Constants
// ─────────────────────────────────────────────────────────────────────────────

export const ROUTES = {
  // Auth
  LOGIN: "/login",

  // App
  DASHBOARD: "/dashboard",

  // Sites
  SITES: "/sites",
  SITE_DETAIL: (id: string) => `/sites/${id}`,

  // Vehicles
  VEHICLES: "/vehicles",

  // Sensors
  SENSORS: "/sensors",

  // Safety
  SAFETY: "/safety",

  // Equipment
  EQUIPMENT: "/equipment",

  // Maintenance
  MAINTENANCE: "/maintenance",

  // Analytics
  ANALYTICS: "/analytics",

  // Settings
  SETTINGS: "/settings",
} as const;

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];
