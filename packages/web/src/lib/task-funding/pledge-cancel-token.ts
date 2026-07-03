import { createHmac, timingSafeEqual } from "node:crypto";
import { getBaseUrl } from "@/lib/url";

/**
 * Signed pledge-cancel links (mirrors `@/lib/email/unsub-token`).
 *
 * Token format: `{pledgeId}.{hmacHex}` — a single URL-safe query param the
 * pledge-confirmation email can embed. The HMAC covers
 * `pledge-cancel|{pledgeId}`, so a token for one pledge can never cancel
 * another and a token minted for a different purpose never verifies here.
 * Deliberately no expiry: cancellation must keep working for as long as the
 * card is uncharged, and the endpoint itself refuses anything already called.
 */

const PLEDGE_CANCEL_PURPOSE = "pledge-cancel";

function computeHmac(pledgeId: string): string {
  // Read from `process.env` directly (not the cached `serverEnv`) so the
  // token module reflects the current runtime secret. Centralized env
  // validation still asserts presence at server boot.
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("NEXTAUTH_SECRET is not configured");
  return createHmac("sha256", secret)
    .update(`${PLEDGE_CANCEL_PURPOSE}|${pledgeId}`)
    .digest("hex");
}

/**
 * Deterministic: the same pledge always produces the same token, so cancel
 * links embedded in already-sent emails keep working indefinitely.
 */
export function createPledgeCancelToken(pledgeId: string): string {
  return `${pledgeId}.${computeHmac(pledgeId)}`;
}

/**
 * Constant-time verify. Returns the pledge id for a valid token, null for
 * tampered payloads, wrong secrets, or malformed token strings.
 */
export function verifyPledgeCancelToken(token: string): string | null {
  if (typeof token !== "string" || token.length === 0) return null;
  // Pledge ids are cuids (no dots); split on the LAST dot anyway so an id
  // containing one still round-trips.
  const separator = token.lastIndexOf(".");
  if (separator <= 0 || separator === token.length - 1) return null;
  const pledgeId = token.slice(0, separator);
  const signature = token.slice(separator + 1);
  let expected: string;
  try {
    expected = computeHmac(pledgeId);
  } catch {
    return null;
  }
  if (signature.length !== expected.length) return null;
  try {
    return timingSafeEqual(
      Buffer.from(signature, "hex"),
      Buffer.from(expected, "hex"),
    )
      ? pledgeId
      : null;
  } catch {
    return null;
  }
}

/** Absolute cancel URL for the pledge-confirmation email. */
export function buildPledgeCancelUrl(pledgeId: string): string {
  const token = createPledgeCancelToken(pledgeId);
  return `${getBaseUrl()}/api/task-funding/pledge/cancel?token=${encodeURIComponent(token)}`;
}
