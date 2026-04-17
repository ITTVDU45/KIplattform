export type Role = "superadmin" | "admin" | "user" | string;

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
  roles?: Role[];
  user?: User;
  [key: string]: unknown;
}

export interface User {
  id?: string;
  email?: string;
  role?: Role;
  roles?: Role[];
  status?: string;
  assignedUserIds?: string[];
  [key: string]: unknown;
}

export interface LoginPayload {
  email: string;
  password: string;
  deviceFingerprint?: string;
  deviceName?: string;
}

export type RegisterSalutation = "Herr" | "Frau" | "Divers";

export interface RegisterPayload {
  salutation: RegisterSalutation;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface RegisterResult {
  success: boolean;
  message: string;
  raw: unknown;
}

export interface AuthSession {
  authenticated: boolean;
  user: User | null;
  roles: Role[];
}

export interface LoginResult extends AuthSession {
  raw: unknown;
}

export interface JwtPayload {
  sub?: string;
  email?: string;
  role?: string;
  roles?: string[];
  exp?: number;
  assignedUserIds?: string[];
  [key: string]: unknown;
}
