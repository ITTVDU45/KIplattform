import { NextResponse } from "next/server";
import {
  ACCESS_COOKIE_NAME,
  EXPIRES_AT_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
} from "@/lib/auth/token.storage";

export async function POST() {
  const response = NextResponse.json({ success: true });

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

  return response;
}
