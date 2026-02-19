import { NextResponse } from "next/server";
import {
  AUTH_SERVICE_LOGIN_PATH,
  authServiceUrl,
  parseUpstreamBody,
} from "@/lib/auth/auth.server";

interface LoginBody {
  email?: string;
  password?: string;
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

  if (!body.email || !body.password) {
    return NextResponse.json(
      { message: "E-Mail und Passwort sind erforderlich." },
      { status: 400 },
    );
  }

  const payload = {
    email: body.email,
    password: body.password,
  };

  const candidatePaths = Array.from(
    new Set([
      AUTH_SERVICE_LOGIN_PATH,
      "/login",
      "/user/login",
      "/auth/login",
      "/api/login",
    ]),
  );

  const attempts: Array<{ path: string; status: number }> = [];

  try {
    for (const path of candidatePaths) {
      const upstreamResponse = await fetch(authServiceUrl(path), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
        cache: "no-store",
      });

      const data = await parseUpstreamBody(upstreamResponse);
      attempts.push({ path, status: upstreamResponse.status });

      if (upstreamResponse.status !== 404) {
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
    }
  } catch {
    return NextResponse.json(
      { message: "Auth-Service aktuell nicht erreichbar." },
      { status: 503 },
    );
  }

  return NextResponse.json(
    {
      message:
        "Der Login-Endpunkt beim Auth-Service wurde nicht gefunden. Bitte AUTH_SERVICE_LOGIN_PATH pruefen.",
      attempts,
    },
    { status: 503 },
  );
}
