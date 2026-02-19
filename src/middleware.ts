import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import {
  ACCESS_COOKIE_NAME,
  EXPIRES_AT_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
} from "@/lib/auth/token.storage";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

const PUBLIC_AUTH_PREFIXES = ["/login", "/register"];
const GUARDED_PREFIXES = ["/app", "/admin"];

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

function matchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

function isGuardedPath(pathname: string): boolean {
  return GUARDED_PREFIXES.some((prefix) => matchesPrefix(pathname, prefix));
}

function isPublicAuthPath(pathname: string): boolean {
  return PUBLIC_AUTH_PREFIXES.some((prefix) => matchesPrefix(pathname, prefix));
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

function redirectToLogin(request: NextRequest): NextResponse {
  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.search = "";

  const response = NextResponse.redirect(loginUrl);
  clearAuthCookies(response);
  return response;
}

export default function middleware(request: NextRequest) {
  const normalizedPath = stripLocalePrefix(request.nextUrl.pathname);
  const isLocalePrefixedAuthPath =
    normalizedPath !== request.nextUrl.pathname &&
    (isPublicAuthPath(normalizedPath) || isGuardedPath(normalizedPath));

  if (isLocalePrefixedAuthPath) {
    const canonicalUrl = request.nextUrl.clone();
    canonicalUrl.pathname = normalizedPath;
    return NextResponse.redirect(canonicalUrl);
  }

  if (isPublicAuthPath(normalizedPath)) {
    const hasAccessToken = Boolean(
      request.cookies.get(ACCESS_COOKIE_NAME)?.value,
    );
    if (hasAccessToken) {
      const appUrl = request.nextUrl.clone();
      appUrl.pathname = "/app";
      appUrl.search = "";
      return NextResponse.redirect(appUrl);
    }

    return NextResponse.next();
  }

  if (isGuardedPath(normalizedPath)) {
    const accessToken = request.cookies.get(ACCESS_COOKIE_NAME)?.value;
    if (!accessToken) {
      return redirectToLogin(request);
    }

    const refreshToken = request.cookies.get(REFRESH_COOKIE_NAME)?.value;
    const expiresAtRaw = request.cookies.get(EXPIRES_AT_COOKIE_NAME)?.value;
    const expiresAt = expiresAtRaw ? Number(expiresAtRaw) : null;
    const hasExpired =
      typeof expiresAt === "number" &&
      Number.isFinite(expiresAt) &&
      Date.now() >= expiresAt;

    // If access token is expired and no refresh token exists, user has to login again.
    if (hasExpired && !refreshToken) {
      return redirectToLogin(request);
    }

    return NextResponse.next();
  }

  return intlMiddleware(request);
}

export const config = {
  // Match all pathnames except for
  // - /api (API routes)
  // - /_next (Next.js internals)
  // - /_vercel (Vercel internals)
  // - /static (public files)
  // - All files with extensions (e.g. favicon.ico)
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
