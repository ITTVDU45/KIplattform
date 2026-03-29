import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  AUTH_SERVICE_REFRESH_PATH,
  authServiceUrl,
  parseUpstreamBody,
} from "@/lib/auth/auth.server";
import type { TokenResponse } from "@/lib/auth/auth.types";
import { extractTokensFromResponse } from "@/lib/auth/jwt";
import {
  ACCESS_COOKIE_NAME,
  EXPIRES_AT_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
} from "@/lib/auth/token.storage";

interface RefreshBody {
  refreshToken?: string;
  refresh_token?: string;
  token?: string;
}

const REFRESH_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

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

function setAuthCookies(
  response: NextResponse,
  accessToken: string,
  refreshToken: string,
  expiresAt: number,
): void {
  const secure = process.env.NODE_ENV === "production";
  const accessMaxAge = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));

  response.cookies.set({
    name: ACCESS_COOKIE_NAME,
    value: accessToken,
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure,
    maxAge: accessMaxAge,
  });
  response.cookies.set({
    name: REFRESH_COOKIE_NAME,
    value: refreshToken,
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

export async function POST(request: Request) {
  let body: RefreshBody = {};

  try {
    body = (await request.json()) as RefreshBody;
  } catch {
    // Accept empty body and fallback to cookie.
  }

  const cookieStore = await cookies();
  const cookieRefreshToken = cookieStore.get(REFRESH_COOKIE_NAME)?.value ?? null;

  const refreshToken =
    body.refreshToken ?? body.refresh_token ?? body.token ?? cookieRefreshToken;

  if (!refreshToken) {
    return NextResponse.json(
      { success: false, refreshed: false },
      { status: 200 },
    );
  }

  try {
    const upstreamResponse = await fetch(authServiceUrl(AUTH_SERVICE_REFRESH_PATH), {
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

    const data = await parseUpstreamBody(upstreamResponse);

    if (!upstreamResponse.ok) {
      const response = NextResponse.json(data, { status: upstreamResponse.status });
      clearAuthCookies(response);
      return response;
    }

    const tokenData =
      data && typeof data === "object" ? (data as TokenResponse) : null;
    const tokens = tokenData ? extractTokensFromResponse(tokenData) : null;

    if (!tokenData || !tokens) {
      const response = NextResponse.json(
        { message: "Token response is missing required fields." },
        { status: 502 },
      );
      clearAuthCookies(response);
      return response;
    }

    const response = NextResponse.json({ success: true });
    setAuthCookies(
      response,
      tokens.accessToken,
      tokens.refreshToken,
      tokens.expiresAt,
    );
    return response;
  } catch {
    const response = NextResponse.json(
      { message: "Auth-Service aktuell nicht erreichbar." },
      { status: 503 },
    );
    clearAuthCookies(response);
    return response;
  }
}
