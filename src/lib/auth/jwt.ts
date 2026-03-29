import type {
  JwtPayload,
  Role,
  TokenResponse,
  Tokens,
  User,
} from "./auth.types";

const DEFAULT_ACCESS_TTL_MS = 15 * 60 * 1000;

function decodeBase64Url(value: string): string {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const input = `${base64}${padding}`;

  if (typeof atob === "function") {
    const binary = atob(input);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }

  return Buffer.from(input, "base64").toString("utf8");
}

function numberFromUnknown(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function asMilliseconds(value: number): number {
  return value < 10_000_000_000 ? value * 1000 : value;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((entry): entry is string => typeof entry === "string")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function uniqueRoles(values: string[]): Role[] {
  const normalized = new Set<string>();

  for (const value of values) {
    normalized.add(value);
  }

  return Array.from(normalized) as Role[];
}

export function decodeJwtPayload(token: string): JwtPayload | null {
  const tokenParts = token.split(".");
  if (tokenParts.length < 2) {
    return null;
  }

  try {
    const json = decodeBase64Url(tokenParts[1]);
    const payload = JSON.parse(json) as JwtPayload;
    return payload && typeof payload === "object" ? payload : null;
  } catch {
    return null;
  }
}

export function getJwtExpiration(token: string): number | null {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) {
    return null;
  }

  return payload.exp * 1000;
}

export function isJwtExpired(token: string, now = Date.now()): boolean {
  const expiresAt = getJwtExpiration(token);
  return expiresAt !== null && expiresAt <= now;
}

export function extractRoles(...sources: unknown[]): Role[] {
  const roles: string[] = [];

  for (const source of sources) {
    if (!source || typeof source !== "object") {
      continue;
    }

    const candidate = source as Record<string, unknown>;
    roles.push(...asStringArray(candidate.roles));

    if (typeof candidate.role === "string" && candidate.role.trim().length > 0) {
      roles.push(candidate.role.trim());
    }
  }

  return uniqueRoles(roles);
}

export function extractSessionUser(options: {
  payload?: JwtPayload | null;
  user?: unknown;
  roles?: unknown;
}): User | null {
  const userCandidate =
    options.user && typeof options.user === "object"
      ? (options.user as Record<string, unknown>)
      : null;
  const payload = options.payload ?? null;
  const roles = extractRoles(userCandidate, { roles: options.roles }, payload);

  const assignedUserIds = userCandidate
    ? asStringArray(userCandidate.assignedUserIds)
    : payload?.assignedUserIds && Array.isArray(payload.assignedUserIds)
      ? payload.assignedUserIds.filter((entry): entry is string => typeof entry === "string")
      : [];

  const user: User = {
    id:
      typeof userCandidate?.id === "string"
        ? userCandidate.id
        : typeof payload?.sub === "string"
          ? payload.sub
          : undefined,
    email:
      typeof userCandidate?.email === "string"
        ? userCandidate.email
        : typeof payload?.email === "string"
          ? payload.email
          : undefined,
    role: roles[0],
    roles,
  };

  if (assignedUserIds.length > 0) {
    user.assignedUserIds = assignedUserIds;
  }

  if (userCandidate?.status && typeof userCandidate.status === "string") {
    user.status = userCandidate.status;
  }

  if (!user.id && !user.email && roles.length === 0) {
    return null;
  }

  return {
    ...userCandidate,
    ...user,
  };
}

export function resolveTokenExpiry(
  data: TokenResponse,
  accessToken: string,
): number {
  const explicitExpiresAt =
    numberFromUnknown(data.expiresAt) ?? numberFromUnknown(data.expires_at);
  if (explicitExpiresAt) {
    return asMilliseconds(explicitExpiresAt);
  }

  const expiresIn =
    numberFromUnknown(data.expiresIn) ?? numberFromUnknown(data.expires_in);
  if (expiresIn) {
    return Date.now() + expiresIn * 1000;
  }

  const jwtExpiresAt = getJwtExpiration(accessToken);
  if (jwtExpiresAt) {
    return jwtExpiresAt;
  }

  return Date.now() + DEFAULT_ACCESS_TTL_MS;
}

export function pickTokenValue(
  data: TokenResponse,
  keys: string[],
): string | null {
  for (const key of keys) {
    const value = data[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }
  }

  return null;
}

export function extractTokensFromResponse(
  data: TokenResponse,
): Tokens | null {
  const accessToken =
    pickTokenValue(data, [
      "accessToken",
      "access_token",
      "sessionToken",
      "session_token",
      "token",
    ]) ?? "";
  const refreshToken =
    pickTokenValue(data, ["refreshToken", "refresh_token"]) ?? "";

  if (!accessToken || !refreshToken) {
    return null;
  }

  return {
    accessToken,
    refreshToken,
    expiresAt: resolveTokenExpiry(data, accessToken),
  };
}
