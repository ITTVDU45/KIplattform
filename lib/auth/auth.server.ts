import "server-only";

export const AUTH_SERVICE_BASE_URL =
  process.env.AUTH_SERVICE_BASE_URL?.replace(/\/+$/, "") ??
  "https://auth.ci-hosting.de";

export const AUTH_SERVICE_LOGIN_PATH =
  process.env.AUTH_SERVICE_LOGIN_PATH ?? "/user/login";

export const AUTH_SERVICE_REGISTER_PATH =
  process.env.AUTH_SERVICE_REGISTER_PATH ?? "/user/register";

export const AUTH_SERVICE_REGISTER_URL =
  process.env.AUTH_SERVICE_REGISTER_URL ??
  "https://api.ci-hosting.de/user/register";

export const AUTH_SERVICE_REFRESH_PATH =
  process.env.AUTH_SERVICE_REFRESH_PATH ?? "/refresh";

function buildUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${AUTH_SERVICE_BASE_URL}${normalizedPath}`;
}

export function authServiceUrl(path: string): string {
  return buildUrl(path);
}

export async function parseUpstreamBody(response: Response): Promise<unknown> {
  if (response.status === 204) {
    return {};
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    try {
      return await response.json();
    } catch {
      return {};
    }
  }

  const text = await response.text();
  if (!text) {
    return {};
  }

  const preMatch = text.match(/<pre>([\s\S]*?)<\/pre>/i);
  if (preMatch?.[1]) {
    return { message: preMatch[1].trim() };
  }

  return { message: text };
}
