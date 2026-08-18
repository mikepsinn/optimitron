/**
 * Server-side outbound email kill switch.
 *
 * `OUTBOUND_EMAIL_MODE`:
 * - "off"        → suppress every outbound email.
 * - "allowlist"  → send only to recipients matching OUTBOUND_EMAIL_ALLOWLIST.
 * - "on" / unset → send normally (production default).
 *
 * `OUTBOUND_EMAIL_ALLOWLIST`: comma-separated entries. Entries with a
 * leading "@" (or bare domains) match every address at that domain;
 * entries containing "@" elsewhere match one address exactly. Matching is
 * case-insensitive.
 *
 * Pure module — enforcement lives inside the lowest-level send paths in
 * `@/lib/email/resend` so no call site can forget it.
 */

export type OutboundEmailMode = "off" | "allowlist" | "on";

export type OutboundSuppressionReason =
  | "outbound_mode_off"
  | "recipient_not_allowlisted";

export type OutboundEmailPolicyDecision =
  | { allowed: true }
  | { allowed: false; reason: OutboundSuppressionReason };

export function parseOutboundEmailAllowlist(
  raw: string | null | undefined,
): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter((entry) => entry.length > 0);
}

export function isEmailAllowlisted(
  email: string,
  allowlistEntries: readonly string[],
): boolean {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return false;
  // No "@" in the recipient → not a routable address; never allowlisted.
  const domain = normalized.split("@")[1] ?? "";
  if (!domain) return false;

  return allowlistEntries.some((entry) => {
    if (entry.startsWith("@")) return domain === entry.slice(1);
    if (entry.includes("@")) return normalized === entry;
    // Bare token without "@" — treat as a domain so "example.org" and
    // "@example.org" behave identically (forgiving config parsing).
    return domain === entry;
  });
}

export function evaluateOutboundEmailPolicy(input: {
  allowlist: string | null | undefined;
  mode: OutboundEmailMode | undefined;
  to: string;
}): OutboundEmailPolicyDecision {
  // Unset mode → "on" so existing production deployments are unaffected.
  const mode = input.mode ?? "on";
  if (mode === "on") return { allowed: true };
  if (mode === "off") return { allowed: false, reason: "outbound_mode_off" };

  const entries = parseOutboundEmailAllowlist(input.allowlist);
  if (isEmailAllowlisted(input.to, entries)) return { allowed: true };
  return { allowed: false, reason: "recipient_not_allowlisted" };
}
