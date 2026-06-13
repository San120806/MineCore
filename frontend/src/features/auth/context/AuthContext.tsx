// ─────────────────────────────────────────────────────────────────────────────
// MineCore — Auth Context
// Handles authenticated user state, mount verification, and login/logout handlers.
// ─────────────────────────────────────────────────────────────────────────────

"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";
import type { User, LoginPayload } from "@/types/auth";
import { getTokens, setTokens, clearTokens } from "../services/token.service";
import {
  loginApi,
  getMeApi,
  logoutApi,
  refreshTokenApi,
} from "../services/auth.service";
import { ROUTES } from "@/constants/routes";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();

  // Load user profile on mount if tokens exist
  const initAuth = useCallback(async () => {
    const { accessToken, refreshToken } = getTokens();

    if (!accessToken && !refreshToken) {
      setIsLoading(false);
      return;
    }

    try {
      if (accessToken) {
        // Access token exists, fetch profile
        const profile = await getMeApi();
        setUser(profile);
        setIsAuthenticated(true);
      } else if (refreshToken) {
        // No access token, but refresh token exists. Try token refresh.
        const authData = await refreshTokenApi(refreshToken);
        setTokens(authData.accessToken, authData.refreshToken);
        const profile = await getMeApi();
        setUser(profile);
        setIsAuthenticated(true);
      }
    } catch (error) {
      // Tokens are invalid or expired, clear them
      console.error("Failed to restore authentication session:", error);
      clearTokens();
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  // Login handler
  const login = useCallback(async (payload: LoginPayload): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await loginApi(payload);
      setTokens(response.accessToken, response.refreshToken);
      setUser(response.user);
      setIsAuthenticated(true);
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Logout handler
  const logout = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      // Call logout endpoint (fire-and-forget/cleanup)
      await logoutApi();
    } catch (error) {
      console.warn("Backend logout failed or was unreachable:", error);
    } finally {
      // Always clear local state even if API call fails
      clearTokens();
      setUser(null);
      setIsAuthenticated(false);
      setIsLoading(false);
      router.push(ROUTES.LOGIN);
    }
  }, [router]);

  // Manual token refresh handler
  const refreshToken = useCallback(async (): Promise<void> => {
    const { refreshToken: currentRefreshToken } = getTokens();
    if (!currentRefreshToken) {
      await logout();
      return;
    }

    try {
      const response = await refreshTokenApi(currentRefreshToken);
      setTokens(response.accessToken, response.refreshToken);
      const profile = await getMeApi();
      setUser(profile);
      setIsAuthenticated(true);
    } catch (error) {
      console.error("Manual token refresh failed:", error);
      await logout();
      throw error;
    }
  }, [logout]);

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    refreshToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuthContext must be used within an <AuthProvider>");
  }
  return ctx;
}
