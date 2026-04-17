import type { Tokens } from "./auth.types";

const TOKEN_STORAGE_KEY = "auth.tokens";

export const ACCESS_COOKIE_NAME = "auth_access_token";
export const REFRESH_COOKIE_NAME = "auth_refresh_token";
export const EXPIRES_AT_COOKIE_NAME = "auth_expires_at";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function clearCookie(name: string): void {
  if (!isBrowser()) {
    return;
  }

  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax${secure}`;
}

export function clearClientAuthState(): void {
  if (!isBrowser()) {
    return;
  }

  try {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch {
    // localStorage can be disabled in some browser contexts
  }

  clearCookie(ACCESS_COOKIE_NAME);
  clearCookie(REFRESH_COOKIE_NAME);
  clearCookie(EXPIRES_AT_COOKIE_NAME);
}

export const tokenStorage = {
  getTokens(): Tokens | null {
    return null;
  },
  setTokens(): void {
    // Tokens are stored exclusively in HttpOnly cookies by the server.
  },
  clearTokens(): void {
    clearClientAuthState();
  },
};
