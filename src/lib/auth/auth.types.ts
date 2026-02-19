export type Role = "admin" | "customer" | string;

export interface Tokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface TokenResponse {
  accessToken?: string;
  access_token?: string;
  refreshToken?: string;
  refresh_token?: string;
  sessionToken?: string;
  session_token?: string;
  token?: string;
  expiresAt?: number | string;
  expires_at?: number | string;
  expiresIn?: number | string;
  expires_in?: number | string;
  user?: User;
  [key: string]: unknown;
}

export interface User {
  id?: string;
  email?: string;
  role?: Role;
  roles?: Role[];
  status?: string;
  [key: string]: unknown;
}

export interface AuthResult {
  tokens: Tokens;
  user?: User;
  raw: TokenResponse;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  password: string;
}

export interface RegisterResult {
  success: boolean;
  message: string;
  raw: unknown;
}

export interface JwtPayload {
  sub?: string;
  email?: string;
  role?: string;
  roles?: string[];
  exp?: number;
  [key: string]: unknown;
}
