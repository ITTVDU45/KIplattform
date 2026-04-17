import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { canAccessPath } from "@/lib/auth/authorization";
import type { TokenResponse, Tokens } from "@/lib/auth/auth.types";
import {
  decodeJwtPayload,
  extractRoles,
  extractTokensFromResponse,
  isJwtExpired,
} from "@/lib/auth/jwt";
import {
  ACCESS_COOKIE_NAME,
  EXPIRES_AT_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
} from "@/lib/auth/token.storage";
import { routing, type Locale } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

const PUBLIC_AUTH_PREFIXES = ["/login", "/register"];
const CANONICAL_NON_LOCALE_PREFIXES = ["/login", "/register", "/app", "/admin", "/admin-login"];
const GUARDED_PREFIXES = [
  "/app",
  "/admin",
  "/dashboard",
  "/marketplace",
  "/assistant-mode",
  "/api-keys",
  "/usage",
  "/logs",
  "/storage",
  "/integrations",
  "/workflows",
  "/support",
  "/settings",
  "/profile",
  "/docs",
];

const REFRESH_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

function stripLocalePrefix(pathname: string): string {
  for (const locale of routing.locales) {
    const prefix = `/${locale}`;
    if (pathname === prefix) {
      return "/";
    }
    if (pathname.startsWith(`${prefix}/`)) {
      return pathname.slice(prefix.length);
    }
  }

  return pathname;
}

function extractLocale(pathname: string): Locale | null {
  for (const locale of routing.locales) {
    const prefix = `/${locale}`;
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      return locale;
    }
  }

  return null;
}

function matchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

function isGuardedPath(pathname: string): boolean {
  return GUARDED_PREFIXES.some((prefix) => matchesPrefix(pathname, prefix));
}

function isPublicAuthPath(pathname: string): boolean {
  return PUBLIC_AUTH_PREFIXES.some((prefix) => matchesPrefix(pathname, prefix));
}

function isCanonicalNonLocalePath(pathname: string): boolean {
  return CANONICAL_NON_LOCALE_PREFIXES.some((prefix) => matchesPrefix(pathname, prefix));
}

function clearAuthCookies(response: NextResponse): void {
  response.cookies.set({
    name: ACCESS_COOKIE_NAME,
    value: "",
    path: "/",
    maxAge: 0,
  });
  response.cookies.set({
    name: REFRESH_COOKIE_NAME,
    value: "",
    path: "/",
    maxAge: 0,
  });
  response.cookies.set({
    name: EXPIRES_AT_COOKIE_NAME,
    value: "",
    path: "/",
    maxAge: 0,
  });
}

function setAuthCookies(response: NextResponse, tokens: Tokens): void {
  const secure = process.env.COOKIE_SECURE !== "false" && process.env.NODE_ENV === "production";
  const accessMaxAge = Math.max(0, Math.floor((tokens.expiresAt - Date.now()) / 1000));

  response.cookies.set({
    name: ACCESS_COOKIE_NAME,
    value: tokens.accessToken,
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure,
    maxAge: accessMaxAge,
  });
  response.cookies.set({
    name: REFRESH_COOKIE_NAME,
    value: tokens.refreshToken,
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure,
    maxAge: REFRESH_COOKIE_MAX_AGE,
  });
  response.cookies.set({
    name: EXPIRES_AT_COOKIE_NAME,
    value: "",
    path: "/",
    maxAge: 0,
  });
}

function buildAuthServiceUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  const baseUrl =
    process.env.AUTH_SERVICE_BASE_URL?.replace(/\/+$/, "") ??
    "https://auth.ci-hosting.de";
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
}

async function parseResponseBody(response: Response): Promise<unknown> {
  if (response.status === 204) {
    return {};
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    try {
      return await response.json();
    } catch {
      return {};
    }
  }

  const text = await response.text();
  return text ? { message: text } : {};
}

async function refreshTokens(refreshToken: string): Promise<Tokens | null> {
  const refreshPath = process.env.AUTH_SERVICE_REFRESH_PATH ?? "/refresh";
  const response = await fetch(buildAuthServiceUrl(refreshPath), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      refreshToken,
      refresh_token: refreshToken,
      token: refreshToken,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  const data = await parseResponseBody(response);
  if (!data || typeof data !== "object") {
    return null;
  }

  return extractTokensFromResponse(data as TokenResponse);
}

function redirectToLogin(request: NextRequest): NextResponse {
  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.search = "";

  const response = NextResponse.redirect(loginUrl);
  clearAuthCookies(response);
  return response;
}

function redirectToDashboard(request: NextRequest, locale: Locale | null): NextResponse {
  const dashboardUrl = request.nextUrl.clone();
  dashboardUrl.pathname = `/${locale ?? routing.defaultLocale}/dashboard`;
  dashboardUrl.search = "";
  return NextResponse.redirect(dashboardUrl);
}

function continueRequest(
  request: NextRequest,
  isLocalePrefixed: boolean,
): NextResponse {
  return isLocalePrefixed ? intlMiddleware(request) : NextResponse.next();
}

async function resolveAuthState(request: NextRequest): Promise<{
  roles: string[];
  refreshedTokens: Tokens | null;
} | null> {
  const accessToken = request.cookies.get(ACCESS_COOKIE_NAME)?.value;
  const refreshToken = request.cookies.get(REFRESH_COOKIE_NAME)?.value;

  if (accessToken && !isJwtExpired(accessToken)) {
    const payload = decodeJwtPayload(accessToken);
    if (payload) {
      return {
        roles: extractRoles(payload).map(String),
        refreshedTokens: null,
      };
    }
  }

  if (!refreshToken) {
    return null;
  }

  try {
    const refreshedTokens = await refreshTokens(refreshToken);
    if (!refreshedTokens) {
      return null;
    }

    const payload = decodeJwtPayload(refreshedTokens.accessToken);
    if (!payload) {
      return null;
    }

    return {
      roles: extractRoles(payload).map(String),
      refreshedTokens,
    };
  } catch {
    return null;
  }
}

export default async function middleware(request: NextRequest) {
  const normalizedPath = stripLocalePrefix(request.nextUrl.pathname);
  const locale = extractLocale(request.nextUrl.pathname);
  const isLocalePrefixed = normalizedPath !== request.nextUrl.pathname;

  if (isLocalePrefixed && isCanonicalNonLocalePath(normalizedPath)) {
    const canonicalUrl = request.nextUrl.clone();
    canonicalUrl.pathname = normalizedPath;
    return NextResponse.redirect(canonicalUrl);
  }

  const authState =
    isPublicAuthPath(normalizedPath) ||
    isGuardedPath(normalizedPath) ||
    matchesPrefix(normalizedPath, "/admin-login")
      ? await resolveAuthState(request)
      : null;

  if (isPublicAuthPath(normalizedPath)) {
    if (authState) {
      const response = redirectToDashboard(request, locale);
      if (authState.refreshedTokens) {
        setAuthCookies(response, authState.refreshedTokens);
      }
      return response;
    }

    return NextResponse.next();
  }

  if (isGuardedPath(normalizedPath)) {
    if (!authState) {
      return redirectToLogin(request);
    }

    if (!canAccessPath(normalizedPath, authState.roles)) {
      const response = redirectToDashboard(request, locale);
      if (authState.refreshedTokens) {
        setAuthCookies(response, authState.refreshedTokens);
      }
      return response;
    }

    const response = continueRequest(request, isLocalePrefixed);
    if (authState.refreshedTokens) {
      setAuthCookies(response, authState.refreshedTokens);
    }
    return response;
  }

  // /admin-login: redirect authenticated admins to dashboard, otherwise allow
  if (matchesPrefix(normalizedPath, "/admin-login")) {
    if (
      authState &&
      authState.roles.some((r) => r === "admin" || r === "superadmin")
    ) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/dashboard";
      url.search = "";
      const res = NextResponse.redirect(url);
      if (authState.refreshedTokens) setAuthCookies(res, authState.refreshedTokens);
      return res;
    }
    return NextResponse.next();
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
