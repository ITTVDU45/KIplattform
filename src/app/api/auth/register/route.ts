import { NextResponse } from "next/server";
import {
  AUTH_SERVICE_REGISTER_PATH,
  authServiceUrl,
  parseUpstreamBody,
} from "@/lib/auth/auth.server";

interface RegisterBody {
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  password?: string;
}

export async function POST(request: Request) {
  let body: RegisterBody;

  try {
    body = (await request.json()) as RegisterBody;
  } catch {
    return NextResponse.json(
      { message: "Ungueltiger JSON-Body." },
      { status: 400 },
    );
  }

  if (
    !body.firstName ||
    !body.lastName ||
    !body.phone ||
    !body.email ||
    !body.password
  ) {
    return NextResponse.json(
      {
        message:
          "Vorname, Nachname, Telefonnummer, E-Mail und Passwort sind erforderlich.",
      },
      { status: 400 },
    );
  }

  const extendedPayload = {
    firstName: body.firstName,
    lastName: body.lastName,
    phone: body.phone,
    first_name: body.firstName,
    last_name: body.lastName,
    phoneNumber: body.phone,
    phone_number: body.phone,
    email: body.email,
    password: body.password,
  };
  const minimalPayload = {
    email: body.email,
    password: body.password,
  };

  const postToUpstream = async (path: string, payload: unknown) => {
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
    return { status: upstreamResponse.status, data };
  };

  const attempts: Array<{ path: string; variant: "extended" | "minimal"; status: number }> = [];
  const candidatePaths = Array.from(
    new Set([
      AUTH_SERVICE_REGISTER_PATH,
      "/user/register",
      "/register",
      "/auth/register",
      "/api/register",
    ]),
  );

  try {
    for (const path of candidatePaths) {
      const extendedResult = await postToUpstream(path, extendedPayload);
      attempts.push({ path, variant: "extended", status: extendedResult.status });

      if (extendedResult.status === 404) {
        continue;
      }

      if (extendedResult.status >= 400 && extendedResult.status < 500) {
        const minimalResult = await postToUpstream(path, minimalPayload);
        attempts.push({ path, variant: "minimal", status: minimalResult.status });
        return NextResponse.json(minimalResult.data, { status: minimalResult.status });
      }

      return NextResponse.json(extendedResult.data, { status: extendedResult.status });
    }
  } catch {
    return NextResponse.json(
      { message: "Auth-Service aktuell nicht erreichbar." },
      { status: 503 },
    );
  }

  const acceptWhenBackend404 =
    process.env.AUTH_REGISTER_ACCEPT_WHEN_BACKEND_404 === "true";
  if (acceptWhenBackend404) {
    return NextResponse.json(
      {
        message:
          "Registrierung eingegangen. Ihr Konto wird nach Freischaltung durch den Administrator aktiv.",
      },
      { status: 201 },
    );
  }

  return NextResponse.json(
    {
      message:
        "Der Auth-Service hat unter der konfigurierten Adresse keinen Registrierungs-Endpunkt (alle Versuche: 404). Bitte AUTH_SERVICE_BASE_URL und AUTH_SERVICE_REGISTER_PATH prüfen oder AUTH_REGISTER_ACCEPT_WHEN_BACKEND_404=true setzen, bis das Backend bereit ist.",
      attempts,
    },
    { status: 503 },
  );
}
