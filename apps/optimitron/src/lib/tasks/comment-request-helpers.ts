import { createHash } from "node:crypto";

/** Hash a request-identifying value (IP, user-agent) for abuse detection storage. */
export function hashRequestValue(value: string | null | undefined): string | null {
  if (!value) return null;
  return createHash("sha256").update(value).digest("hex").slice(0, 32);
}

/** Extract a client IP from a Next.js request. Falls back to null if not available. */
export function getClientIp(request: Request): string | null {
  const headers = request.headers;
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() ?? null;
  }
  return headers.get("x-real-ip") ?? null;
}
