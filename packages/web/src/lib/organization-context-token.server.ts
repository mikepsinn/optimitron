/**
 * HMAC-signed cross-host organization identity tokens.
 *
 * `organizationId` is never trusted from URL params. A malicious host could
 * spoof `?org=rival` to poison another organization's attribution. Instead:
 *   - Server-side resolution from hostname for first-party pages.
 *   - Signed tokens for trusted third-party handoffs and iframe embeds.
 */

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const SIGNING_KEY =
  process.env.ORG_CONTEXT_SECRET ?? process.env.REASONING_ORG_CONTEXT_SECRET ?? "";

export const TOKEN_DEFAULT_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

export type OrgContextPayload = {
  organizationId: string;
  /** ISO timestamp when token was issued. */
  issuedAt: string;
  /** ISO timestamp when token expires. */
  expiresAt: string;
  /** Random per-session salt. */
  sessionSalt: string;
};

export type OrgContextToken = {
  payload: OrgContextPayload;
  signature: string;
  /** Wire format: base64url(payload).signature */
  encoded: string;
};

export type OrgContextVerification =
  | { ok: true; organizationId: string; payload: OrgContextPayload }
  | {
      ok: false;
      reason: "no-token" | "bad-format" | "bad-signature" | "expired" | "no-secret";
    };

/**
 * Issue a signed token for the given organization. Caller is the origin
 * server that has already verified the requester is authorized for this org.
 */
export function issueOrgContextToken(
  organizationId: string,
  options: { ttlSeconds?: number; now?: Date } = {},
): OrgContextToken {
  if (!SIGNING_KEY) {
    throw new Error(
      "ORG_CONTEXT_SECRET (or legacy REASONING_ORG_CONTEXT_SECRET) is not configured; cannot issue org-context tokens",
    );
  }
  const now = options.now ?? new Date();
  const ttl = options.ttlSeconds ?? TOKEN_DEFAULT_TTL_SECONDS;
  const payload: OrgContextPayload = {
    organizationId,
    issuedAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + ttl * 1000).toISOString(),
    sessionSalt: randomHex(16),
  };
  const payloadB64 = base64UrlEncode(JSON.stringify(payload));
  const signature = signPayload(payloadB64);
  return {
    payload,
    signature,
    encoded: `${payloadB64}.${signature}`,
  };
}

/**
 * Verify a token and return the contained organizationId if valid.
 * Invalid tokens always fall back to anonymous org attribution: never throws,
 * never trusts.
 */
export function verifyOrgContextToken(
  encoded: string | null | undefined,
  options: { now?: Date } = {},
): OrgContextVerification {
  if (!encoded || encoded.length === 0) {
    return { ok: false, reason: "no-token" };
  }
  if (!SIGNING_KEY) {
    return { ok: false, reason: "no-secret" };
  }

  const parts = encoded.split(".");
  if (parts.length !== 2) {
    return { ok: false, reason: "bad-format" };
  }
  const [payloadB64, providedSig] = parts as [string, string];

  const expectedSig = signPayload(payloadB64);
  if (!constantTimeEqual(providedSig, expectedSig)) {
    return { ok: false, reason: "bad-signature" };
  }

  let payload: OrgContextPayload;
  try {
    payload = JSON.parse(base64UrlDecode(payloadB64)) as OrgContextPayload;
  } catch {
    return { ok: false, reason: "bad-format" };
  }
  if (
    typeof payload.organizationId !== "string" ||
    typeof payload.expiresAt !== "string"
  ) {
    return { ok: false, reason: "bad-format" };
  }

  const now = options.now ?? new Date();
  if (new Date(payload.expiresAt).getTime() <= now.getTime()) {
    return { ok: false, reason: "expired" };
  }

  return { ok: true, organizationId: payload.organizationId, payload };
}

function signPayload(payloadB64: string): string {
  return createHmac("sha256", SIGNING_KEY).update(payloadB64).digest("hex");
}

function constantTimeEqual(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    if (bufA.length !== bufB.length) return false;
    return timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

function base64UrlEncode(input: string): string {
  return Buffer.from(input, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function base64UrlDecode(input: string): string {
  const padded = input.padEnd(
    input.length + ((4 - (input.length % 4)) % 4),
    "=",
  );
  const standard = padded.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(standard, "base64").toString("utf8");
}

function randomHex(bytes: number): string {
  return randomBytes(bytes).toString("hex");
}
