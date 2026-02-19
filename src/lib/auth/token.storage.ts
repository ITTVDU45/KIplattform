import type { Tokens } from "./auth.types";

const TOKEN_STORAGE_KEY = "auth.tokens";

export const ACCESS_COOKIE_NAME = "auth_access_token";
export const REFRESH_COOKIE_NAME = "auth_refresh_token";
export const EXPIRES_AT_COOKIE_NAME = "auth_expires_at";

export interface TokenStorage {
  getTokens: () => Tokens | null;
  setTokens: (tokens: Tokens) => void;
  clearTokens: () => void;
}

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function parseTokens(input: unknown): Tokens | null {
  if (!input || typeof input !== "object") {
    return null;
  }

  const candidate = input as Partial<Tokens>;

  if (
    typeof candidate.accessToken !== "string" ||
    typeof candidate.refreshToken !== "string" ||
    typeof candidate.expiresAt !== "number"
  ) {
    return null;
  }

  return candidate as Tokens;
}

function writeCookie(name: string, value: string, maxAgeSeconds: number): void {
  if (!isBrowser()) {
    return;
  }

  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${Math.max(0, maxAgeSeconds)}; SameSite=Lax${secure}`;
}

function clearCookie(name: string): void {
  if (!isBrowser()) {
    return;
  }

  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax${secure}`;
}

export function syncAuthCookies(tokens: Tokens): void {
  if (!isBrowser()) {
    return;
  }

  const now = Date.now();
  const accessMaxAge = Math.floor((tokens.expiresAt - now) / 1000);
  const refreshMaxAge = 60 * 60 * 24 * 30;

  writeCookie(ACCESS_COOKIE_NAME, tokens.accessToken, accessMaxAge);
  writeCookie(REFRESH_COOKIE_NAME, tokens.refreshToken, refreshMaxAge);
  writeCookie(EXPIRES_AT_COOKIE_NAME, String(tokens.expiresAt), refreshMaxAge);
}

export function clearAuthCookies(): void {
  clearCookie(ACCESS_COOKIE_NAME);
  clearCookie(REFRESH_COOKIE_NAME);
  clearCookie(EXPIRES_AT_COOKIE_NAME);
}

export const tokenStorage: TokenStorage = {
  getTokens() {
    if (!isBrowser()) {
      return null;
    }

    try {
      const raw = window.localStorage.getItem(TOKEN_STORAGE_KEY);
      if (!raw) {
        return null;
      }

      return parseTokens(JSON.parse(raw));
    } catch {
      return null;
    }
  },
  setTokens(tokens) {
    if (!isBrowser()) {
      return;
    }

    try {
      window.localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(tokens));
      syncAuthCookies(tokens);
    } catch {
      // localStorage can be disabled in some browser contexts
    }
  },
  clearTokens() {
    if (!isBrowser()) {
      return;
    }

    try {
      window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    } finally {
      clearAuthCookies();
    }
  },
};
