import { NextResponse } from "next/server";
import {
  AUTH_SERVICE_LOGIN_PATH,
  authServiceUrl,
  parseUpstreamBody,
} from "@/lib/auth/auth.server";
import type { TokenResponse } from "@/lib/auth/auth.types";
import {
  decodeJwtPayload,
  extractRoles,
  extractSessionUser,
  extractTokensFromResponse,
} from "@/lib/auth/jwt";
import {
  ACCESS_COOKIE_NAME,
  EXPIRES_AT_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
} from "@/lib/auth/token.storage";

interface LoginBody {
  email?: string;
  password?: string;
  deviceFingerprint?: string;
  deviceName?: string;
}

const PENDING_HINTS = [
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

const REFRESH_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

function isPendingPayload(data: unknown): boolean {
  if (!data || typeof data !== "object") return false;
  const candidate = data as Record<string, unknown>;
  const text = [
    candidate.message,
    candidate.error,
    candidate.detail,
    candidate.description,
    candidate.code,
  ]
    .filter((value): value is string => typeof value === "string")
    .join(" ")
    .toLowerCase();
  return PENDING_HINTS.some((hint) => text.includes(hint));
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function setAuthCookies(
  response: NextResponse,
  accessToken: string,
  refreshToken: string,
  expiresAt: number,
): void {
  const secure = process.env.COOKIE_SECURE !== "false" && process.env.NODE_ENV === "production";
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
  let body: LoginBody;

  try {
    body = (await request.json()) as LoginBody;
  } catch {
    return NextResponse.json(
      { message: "Ungueltiger JSON-Body." },
      { status: 400 },
    );
  }

  if (!isNonEmptyString(body.email) || !isNonEmptyString(body.password)) {
    return NextResponse.json(
      { message: "E-Mail und Passwort sind erforderlich." },
      { status: 400 },
    );
  }

  const payload: Record<string, string> = {
    email: body.email.trim(),
    password: body.password,
  };

  if (isNonEmptyString(body.deviceFingerprint)) {
    payload.deviceFingerprint = body.deviceFingerprint.trim();
  }

  if (isNonEmptyString(body.deviceName)) {
    payload.deviceName = body.deviceName.trim();
  }

  try {
    const upstreamResponse = await fetch(authServiceUrl(AUTH_SERVICE_LOGIN_PATH), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const data = await parseUpstreamBody(upstreamResponse);

    if (!upstreamResponse.ok) {
      if (upstreamResponse.status === 401 && isPendingPayload(data)) {
        return NextResponse.json(
          {
            message:
              "Dein Account ist noch nicht freigeschaltet. Bitte warte auf die Freischaltung im Adminpanel.",
          },
          { status: 403 },
        );
      }

      return NextResponse.json(data, { status: upstreamResponse.status });
    }

    const tokenData =
      data && typeof data === "object" ? (data as TokenResponse) : null;
    const tokens = tokenData ? extractTokensFromResponse(tokenData) : null;

    if (!tokenData || !tokens) {
      return NextResponse.json(
        { message: "Token response is missing required fields." },
        { status: 502 },
      );
    }

    const payloadData = decodeJwtPayload(tokens.accessToken);
    const user = extractSessionUser({
      payload: payloadData,
      user: tokenData.user,
      roles: tokenData.roles,
    });
    const roles = extractRoles(tokenData.user, { roles: tokenData.roles }, payloadData);

    const response = NextResponse.json({
      authenticated: true,
      user,
      roles,
    });

    setAuthCookies(
      response,
      tokens.accessToken,
      tokens.refreshToken,
      tokens.expiresAt,
    );

    return response;
  } catch {
    return NextResponse.json(
      { message: "Auth-Service aktuell nicht erreichbar." },
      { status: 503 },
    );
  }
}
