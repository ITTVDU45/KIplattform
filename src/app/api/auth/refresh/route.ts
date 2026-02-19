import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  AUTH_SERVICE_REFRESH_PATH,
  authServiceUrl,
  parseUpstreamBody,
} from "@/lib/auth/auth.server";
import { REFRESH_COOKIE_NAME } from "@/lib/auth/token.storage";

interface RefreshBody {
  refreshToken?: string;
  refresh_token?: string;
  token?: string;
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
      { message: "Kein Refresh-Token uebergeben." },
      { status: 400 },
    );
  }

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
  return NextResponse.json(data, { status: upstreamResponse.status });
}
