// ─────────────────────────────────────────────────────────────────────────────
// MineCore — Auth Types
// ─────────────────────────────────────────────────────────────────────────────

import { UserRole } from "./enums";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive?: boolean;
  createdAt?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface LoginPayload {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
}

export interface RefreshTokenPayload {
  refreshToken: string;
}

export interface TokenPayload {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
}
