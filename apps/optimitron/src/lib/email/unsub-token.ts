import { createHmac, timingSafeEqual } from "node:crypto";
import type { EmailScope } from "@/lib/email/scopes";

export interface UnsubTokenPayload {
  userId: string;
  scope: EmailScope;
  /** Optional — when provided, ties the unsubscribe event back to the email that triggered it. */
  emailLogId?: string;
}

function payloadToCanonicalString(payload: UnsubTokenPayload): string {
  return `${payload.userId}|${payload.scope}|${payload.emailLogId ?? ""}`;
}

function computeHmac(payload: UnsubTokenPayload): string {
  // Read from `process.env` directly (not the cached `serverEnv`) so the token
  // module reflects the current runtime secret. Centralized env validation
  // still asserts presence at server boot.
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("NEXTAUTH_SECRET is not configured");
  return createHmac("sha256", secret).update(payloadToCanonicalString(payload)).digest("hex");
}

/**
 * Sign a payload for inclusion in an unsubscribe URL. Deterministic: the same
 * payload always produces the same token, so links embedded in previous
 * emails keep working indefinitely.
 */
export function signUnsubToken(payload: UnsubTokenPayload): string {
  return computeHmac(payload);
}

/**
 * Constant-time verify. Returns false for tampered payloads, wrong secrets,
 * or malformed token strings.
 */
export function verifyUnsubToken(payload: UnsubTokenPayload, token: string): boolean {
  if (typeof token !== "string" || token.length === 0) return false;
  let expected: string;
  try {
    expected = computeHmac(payload);
  } catch {
    return false;
  }
  if (token.length !== expected.length) return false;
  try {
    return timingSafeEqual(Buffer.from(token, "hex"), Buffer.from(expected, "hex"));
  } catch {
    return false;
  }
}
