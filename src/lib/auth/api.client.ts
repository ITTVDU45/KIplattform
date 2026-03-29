import { authService, AuthServiceError } from "./auth.service";
import { clearClientAuthState } from "./token.storage";

export class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly data?: unknown,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

let refreshPromise: Promise<void> | null = null;

function mergeHeaders(initialHeaders: HeadersInit | undefined): Headers {
  const headers = new Headers(initialHeaders);

  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  return headers;
}

function redirectToLogin(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.location.assign("/login");
}

async function parseApiResponse(response: Response): Promise<unknown> {
  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }

  const text = await response.text();
  return text ? { message: text } : null;
}

function toErrorMessage(data: unknown, fallback: string): string {
  if (!data || typeof data !== "object") {
    return fallback;
  }

  const candidate = data as Record<string, unknown>;
  const message =
    candidate.message ??
    candidate.error ??
    candidate.detail ??
    candidate.description;

  if (typeof message === "string" && message.trim().length > 0) {
    return message;
  }

  return fallback;
}

async function ensureFreshToken(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = authService
      .refresh()
      .then(() => undefined)
      .catch((error: unknown) => {
        if (error instanceof AuthServiceError) {
          throw error;
        }
        throw new AuthServiceError("Token-Refresh fehlgeschlagen.");
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  try {
    await refreshPromise;
    return true;
  } catch {
    clearClientAuthState();
    redirectToLogin();
    return false;
  }
}

async function runRequest<T>(
  input: string | URL | Request,
  init: RequestInit,
): Promise<T> {
  const response = await fetch(input, {
    ...init,
    credentials: init.credentials ?? "include",
    headers: mergeHeaders(init.headers),
  });

  const data = await parseApiResponse(response);

  if (!response.ok) {
    throw new ApiClientError(
      toErrorMessage(data, "API-Request fehlgeschlagen."),
      response.status,
      data,
    );
  }

  return data as T;
}

export async function apiFetch<T>(
  input: string | URL | Request,
  init: RequestInit = {},
): Promise<T> {
  try {
    return await runRequest<T>(input, init);
  } catch (error: unknown) {
    if (!(error instanceof ApiClientError) || error.status !== 401) {
      throw error;
    }

    const refreshed = await ensureFreshToken();
    if (!refreshed) {
      throw error;
    }

    return runRequest<T>(input, init);
  }
}
