import { NextResponse } from "next/server";
import {
  AUTH_SERVICE_REGISTER_URL,
  parseUpstreamBody,
} from "@/lib/auth/auth.server";
import type { RegisterSalutation } from "@/lib/auth/auth.types";

interface RegisterBody {
  salutation?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
}

const VALID_SALUTATIONS: RegisterSalutation[] = ["Herr", "Frau", "Divers"];

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isValidSalutation(value: unknown): value is RegisterSalutation {
  return typeof value === "string" && VALID_SALUTATIONS.includes(value as RegisterSalutation);
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
    !isValidSalutation(body.salutation) ||
    !isNonEmptyString(body.firstName) ||
    !isNonEmptyString(body.lastName) ||
    !isNonEmptyString(body.email) ||
    !isNonEmptyString(body.password)
  ) {
    return NextResponse.json(
      {
        message:
          "Anrede, Vorname, Nachname, E-Mail und Passwort sind erforderlich.",
      },
      { status: 400 },
    );
  }

  const payload = {
    anrede: body.salutation,
    firstname: body.firstName.trim(),
    lastname: body.lastName.trim(),
    email: body.email.trim(),
    password: body.password,
  };

  try {
    const upstreamResponse = await fetch(AUTH_SERVICE_REGISTER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const data = await parseUpstreamBody(upstreamResponse);
    return NextResponse.json(data, { status: upstreamResponse.status });
  } catch {
    return NextResponse.json(
      { message: "Auth-Service aktuell nicht erreichbar." },
      { status: 503 },
    );
  }
}
