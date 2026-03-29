"use client";

import type { LoginPayload } from "./auth.types";

function detectPlatform(): string {
  if (typeof navigator === "undefined") {
    return "Unknown Device";
  }

  const navigatorWithUserAgentData = navigator as Navigator & {
    userAgentData?: { platform?: string };
  };
  const userAgentDataPlatform =
    typeof navigatorWithUserAgentData.userAgentData?.platform === "string"
      ? navigatorWithUserAgentData.userAgentData.platform
      : "";
  const platform = userAgentDataPlatform || navigator.platform || navigator.userAgent;
  const normalized = platform.toLowerCase();

  if (normalized.includes("win")) return "Windows";
  if (normalized.includes("mac")) return "Mac";
  if (normalized.includes("iphone")) return "iPhone";
  if (normalized.includes("ipad")) return "iPad";
  if (normalized.includes("android")) return "Android";
  if (normalized.includes("linux")) return "Linux";

  return "Unknown Device";
}

function detectBrowser(): string {
  if (typeof navigator === "undefined") {
    return "Browser";
  }

  const userAgent = navigator.userAgent.toLowerCase();

  if (userAgent.includes("edg/")) return "Edge";
  if (userAgent.includes("opr/") || userAgent.includes("opera")) return "Opera";
  if (userAgent.includes("chrome/")) return "Chrome";
  if (userAgent.includes("safari/") && !userAgent.includes("chrome/")) return "Safari";
  if (userAgent.includes("firefox/")) return "Firefox";

  return "Browser";
}

async function hashString(value: string): Promise<string | undefined> {
  if (typeof crypto?.subtle === "undefined") {
    return undefined;
  }

  const encoded = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

export async function getDeviceContext(): Promise<
  Pick<LoginPayload, "deviceFingerprint" | "deviceName">
> {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return {};
  }

  const deviceName = `${detectPlatform()} ${detectBrowser()}`.trim();

  const fingerprintSource = [
    navigator.userAgent,
    navigator.language,
    navigator.platform,
    window.screen?.width,
    window.screen?.height,
    window.screen?.colorDepth,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
  ].join("|");

  const deviceFingerprint = await hashString(fingerprintSource);

  return {
    deviceFingerprint,
    deviceName,
  };
}
