import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ACCESS_COOKIE_NAME } from "@/lib/auth/token.storage";
import {
  decodeJwtPayload,
  extractRoles,
  extractSessionUser,
  isJwtExpired,
} from "@/lib/auth/jwt";

function unauthenticatedResponse() {
  return NextResponse.json({
    authenticated: false,
    user: null,
    roles: [],
  });
}

export async function GET() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_COOKIE_NAME)?.value;

  if (!accessToken) {
    return unauthenticatedResponse();
  }

  const payload = decodeJwtPayload(accessToken);
  if (!payload || isJwtExpired(accessToken)) {
    return unauthenticatedResponse();
  }

  const user = extractSessionUser({ payload });
  const roles = extractRoles(payload);

  return NextResponse.json({
    authenticated: true,
    user,
    roles,
  });
}
