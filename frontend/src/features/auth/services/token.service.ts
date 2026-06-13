// ─────────────────────────────────────────────────────────────────────────────
// MineCore — Token Service
// Local token storage helpers with SSR safety.
// ─────────────────────────────────────────────────────────────────────────────

const ACCESS_TOKEN_KEY = "minecore_access_token";
const REFRESH_TOKEN_KEY = "minecore_refresh_token";

export const getTokens = (): {
  accessToken: string | null;
  refreshToken: string | null;
} => {
  if (typeof window === "undefined") {
    return { accessToken: null, refreshToken: null };
  }
  return {
    accessToken: localStorage.getItem(ACCESS_TOKEN_KEY),
    refreshToken: localStorage.getItem(REFRESH_TOKEN_KEY),
  };
};

export const setTokens = (accessToken: string, refreshToken: string): void => {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
};

export const clearTokens = (): void => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};
