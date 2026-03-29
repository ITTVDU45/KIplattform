import type {
  AuthSession,
  LoginPayload,
  LoginResult,
  RegisterPayload,
  RegisterResult,
} from "./auth.types";
import { clearClientAuthState } from "./token.storage";

const AUTH_API_BASE_URL =
  process.env.NEXT_PUBLIC_AUTH_API_BASE_URL?.replace(/\/+$/, "") ?? "";
const LOGIN_PATH =
  process.env.NEXT_PUBLIC_AUTH_CLIENT_LOGIN_PATH ?? "/api/auth/login";
const REGISTER_PATH =
  process.env.NEXT_PUBLIC_AUTH_CLIENT_REGISTER_PATH ?? "/api/auth/register";
const REFRESH_PATH =
  process.env.NEXT_PUBLIC_AUTH_CLIENT_REFRESH_PATH ?? "/api/auth/refresh";
const ME_PATH =
  process.env.NEXT_PUBLIC_AUTH_CLIENT_ME_PATH ?? "/api/auth/me";

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

function toAuthSession(data: unknown): AuthSession {
  if (!data || typeof data !== "object") {
    return { authenticated: false, user: null, roles: [] };
  }

  const candidate = data as Record<string, unknown>;
  const authenticated = candidate.authenticated === true;
  const user =
    candidate.user && typeof candidate.user === "object"
      ? (candidate.user as AuthSession["user"])
      : null;
  const roles = Array.isArray(candidate.roles)
    ? candidate.roles.filter((entry): entry is string => typeof entry === "string")
    : [];

  return {
    authenticated,
    user,
    roles,
  };
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
    return "Der Account ist noch nicht freigeschaltet oder die Zugangsdaten sind nicht korrekt.";
  }

  if (status === 403) {
    return "Login nicht erlaubt oder Geraet nicht autorisiert.";
  }

  if (status === 404) {
    return "Auth-Endpunkt nicht gefunden. Bitte Backend-Konfiguration pruefen.";
  }

  if (status === 429) {
    return "Zu viele Login-Versuche. Bitte spaeter erneut versuchen.";
  }

  if (status === 503) {
    return "Auth-Service voruebergehend nicht erreichbar. Bitte spaeter erneut versuchen.";
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

async function postJson(path: string, body?: unknown): Promise<unknown> {
  const response = await fetch(buildUrl(path), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    credentials: "same-origin",
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
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

async function getJson(path: string): Promise<unknown> {
  const response = await fetch(buildUrl(path), {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    credentials: "same-origin",
    cache: "no-store",
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

  async login(payload: LoginPayload): Promise<LoginResult> {
    const data = await postJson(LOGIN_PATH, payload);
    const session = toAuthSession(data);

    return {
      ...session,
      raw: data,
    };
  },

  async refresh(refreshToken?: string): Promise<void> {
    if (refreshToken) {
      await postJson(REFRESH_PATH, {
        refreshToken,
        refresh_token: refreshToken,
        token: refreshToken,
      });
      return;
    }

    await postJson(REFRESH_PATH, {});
  },

  async getSession(): Promise<AuthSession> {
    const data = await getJson(ME_PATH);
    return toAuthSession(data);
  },

  async logout(): Promise<void> {
    clearClientAuthState();
    if (typeof window === "undefined") {
      return;
    }

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
      });
    } catch {
      // The client state is already cleared. A failed logout request should not block UX.
    }
  },

  getCurrentUser() {
    return null;
  },
};
