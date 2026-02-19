import type {
  AuthResult,
  JwtPayload,
  LoginPayload,
  RegisterPayload,
  RegisterResult,
  Role,
  TokenResponse,
  Tokens,
  User,
} from "./auth.types";
import { tokenStorage } from "./token.storage";

const AUTH_API_BASE_URL =
  process.env.NEXT_PUBLIC_AUTH_API_BASE_URL?.replace(/\/+$/, "") ?? "";
const LOGIN_PATH =
  process.env.NEXT_PUBLIC_AUTH_CLIENT_LOGIN_PATH ?? "/api/auth/login";
const REGISTER_PATH =
  process.env.NEXT_PUBLIC_AUTH_CLIENT_REGISTER_PATH ?? "/api/auth/register";
const REFRESH_PATH =
  process.env.NEXT_PUBLIC_AUTH_CLIENT_REFRESH_PATH ?? "/api/auth/refresh";
const DEFAULT_ACCESS_TTL_MS = 15 * 60 * 1000;

export class AuthServiceError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly data?: unknown,
  ) {
    super(message);
    this.name = "AuthServiceError";
  }
}

function buildUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  if (!AUTH_API_BASE_URL) {
    return normalizedPath;
  }
  return `${AUTH_API_BASE_URL}${normalizedPath}`;
}

function decodeJwtPayload(token: string): JwtPayload | null {
  const tokenParts = token.split(".");
  if (tokenParts.length < 2) {
    return null;
  }

  try {
    if (typeof atob !== "function") {
      return null;
    }

    const base64 = tokenParts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padding = "=".repeat((4 - (base64.length % 4)) % 4);
    const json = atob(`${base64}${padding}`);
    const payload = JSON.parse(json) as JwtPayload;
    return payload && typeof payload === "object" ? payload : null;
  } catch {
    return null;
  }
}

function asMilliseconds(value: number): number {
  return value < 10_000_000_000 ? value * 1000 : value;
}

function numberFromUnknown(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function parseResponseJson(data: unknown): TokenResponse {
  if (!data || typeof data !== "object") {
    return {};
  }

  return data as TokenResponse;
}

function pickTokenValue(data: TokenResponse, keys: string[]): string | null {
  for (const key of keys) {
    const value = data[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }
  }

  return null;
}

function resolveExpiresAt(data: TokenResponse, accessToken: string): number {
  const explicitExpiresAt =
    numberFromUnknown(data.expiresAt) ?? numberFromUnknown(data.expires_at);
  if (explicitExpiresAt) {
    return asMilliseconds(explicitExpiresAt);
  }

  const expiresIn =
    numberFromUnknown(data.expiresIn) ?? numberFromUnknown(data.expires_in);
  if (expiresIn) {
    return Date.now() + expiresIn * 1000;
  }

  const jwtPayload = decodeJwtPayload(accessToken);
  if (jwtPayload?.exp) {
    return jwtPayload.exp * 1000;
  }

  return Date.now() + DEFAULT_ACCESS_TTL_MS;
}

function normalizeTokenResponse(data: TokenResponse): AuthResult {
  const accessToken =
    pickTokenValue(data, ["accessToken", "access_token", "sessionToken", "session_token", "token"]) ??
    "";
  const refreshToken =
    pickTokenValue(data, ["refreshToken", "refresh_token"]) ?? "";

  if (!accessToken || !refreshToken) {
    throw new AuthServiceError("Token response is missing required fields.");
  }

  const tokens: Tokens = {
    accessToken,
    refreshToken,
    expiresAt: resolveExpiresAt(data, accessToken),
  };

  const jwtPayload = decodeJwtPayload(accessToken);
  const roles =
    Array.isArray(jwtPayload?.roles) && jwtPayload.roles.length > 0
      ? jwtPayload.roles
      : typeof jwtPayload?.role === "string"
        ? [jwtPayload.role]
        : undefined;

  const derivedUser: User | undefined = jwtPayload
    ? {
        id: typeof jwtPayload.sub === "string" ? jwtPayload.sub : undefined,
        email: typeof jwtPayload.email === "string" ? jwtPayload.email : undefined,
        role: roles?.[0] as Role | undefined,
        roles,
      }
    : undefined;

  return {
    tokens,
    user: data.user ?? derivedUser,
    raw: data,
  };
}

const PENDING_ACCOUNT_HINTS = [
  "pending",
  "freischalt",
  "freigeben",
  "not approved",
  "not activated",
  "awaiting approval",
  "account not active",
  "inaktiv",
  "noch nicht",
];

function isPendingAccountMessage(data: unknown): boolean {
  if (!data || typeof data !== "object") return false;
  const candidate = data as Record<string, unknown>;
  const text = [
    candidate.message,
    candidate.error,
    candidate.detail,
    candidate.description,
    candidate.code,
  ]
    .filter((v): v is string => typeof v === "string")
    .join(" ")
    .toLowerCase();
  return PENDING_ACCOUNT_HINTS.some((hint) => text.includes(hint));
}

function extractErrorMessage(status: number, data: unknown): string {
  if (data && typeof data === "object") {
    const candidate = data as Record<string, unknown>;
    const msg =
      candidate.message ??
      candidate.error ??
      candidate.detail ??
      candidate.description;

    if (typeof msg === "string" && msg.trim().length > 0) {
      if (msg.includes("Cannot POST")) {
        return "Auth-Endpunkt nicht gefunden. Bitte Backend-Konfiguration pruefen.";
      }
      return msg;
    }
  }

  if (status === 401) {
    if (isPendingAccountMessage(data)) {
      return "Dein Account ist noch nicht freigeschaltet. Bitte warte auf die Freischaltung durch den Administrator.";
    }
    return "Der Account ist noch nicht freigeschaltet oder die Zugangsdaten sind nicht korrekt.";
  }

  if (status === 403) {
    return "Dein Account ist noch nicht freigeschaltet.";
  }

  if (status === 404) {
    return "Auth-Endpunkt nicht gefunden. Bitte Backend-Konfiguration pruefen.";
  }

  if (status === 503) {
    return "Auth-Service vorübergehend nicht erreichbar. Bitte später erneut versuchen.";
  }

  return "Anfrage an den Auth-Service fehlgeschlagen.";
}

async function parseBody(response: Response): Promise<unknown> {
  if (response.status === 204) {
    return {};
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    const text = await response.text();
    return text ? { message: text } : {};
  }

  try {
    return await response.json();
  } catch {
    return {};
  }
}

async function postJson(path: string, body: unknown): Promise<unknown> {
  const response = await fetch(buildUrl(path), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await parseBody(response);
  if (!response.ok) {
    throw new AuthServiceError(
      extractErrorMessage(response.status, data),
      response.status,
      data,
    );
  }

  return data;
}

function normalizeRegisterMessage(data: unknown): string {
  if (!data || typeof data !== "object") {
    return "Registrierung eingegangen, Freischaltung folgt.";
  }

  const candidate = data as Record<string, unknown>;
  const rawMessage =
    candidate.message ?? candidate.detail ?? candidate.status ?? candidate.result;

  if (typeof rawMessage === "string" && rawMessage.trim().length > 0) {
    return rawMessage;
  }

  return "Registrierung eingegangen, Freischaltung folgt.";
}

export const authService = {
  async register(payload: RegisterPayload): Promise<RegisterResult> {
    const data = await postJson(REGISTER_PATH, payload);
    return {
      success: true,
      message: normalizeRegisterMessage(data),
      raw: data,
    };
  },

  async login(payload: LoginPayload): Promise<AuthResult> {
    const data = await postJson(LOGIN_PATH, payload);
    const result = normalizeTokenResponse(parseResponseJson(data));
    tokenStorage.setTokens(result.tokens);
    return result;
  },

  async refresh(refreshToken?: string): Promise<Tokens> {
    const stored = tokenStorage.getTokens();
    const refreshValue = refreshToken ?? stored?.refreshToken;

    if (!refreshValue) {
      throw new AuthServiceError("Kein Refresh-Token vorhanden.");
    }

    const data = await postJson(REFRESH_PATH, {
      refreshToken: refreshValue,
      refresh_token: refreshValue,
      token: refreshValue,
    });

    const result = normalizeTokenResponse(parseResponseJson(data));
    tokenStorage.setTokens(result.tokens);
    return result.tokens;
  },

  logout(): void {
    tokenStorage.clearTokens();
    if (typeof window !== "undefined") {
      fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
      }).catch(() => undefined);
    }
  },

  getCurrentUser(): User | null {
    const tokens = tokenStorage.getTokens();
    if (!tokens?.accessToken) {
      return null;
    }

    const payload = decodeJwtPayload(tokens.accessToken);
    if (!payload) {
      return null;
    }

    const roles =
      Array.isArray(payload.roles) && payload.roles.length > 0
        ? payload.roles
        : typeof payload.role === "string"
          ? [payload.role]
          : undefined;

    return {
      id: typeof payload.sub === "string" ? payload.sub : undefined,
      email: typeof payload.email === "string" ? payload.email : undefined,
      role: roles?.[0] as Role | undefined,
      roles,
    };
  },
};
