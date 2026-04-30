import { serverEnv } from "@/lib/env";

export interface ParsedEmailFromHeader {
  address: string;
  displayName: string | null;
}

/**
 * Parse a `Display Name <email@example.com>` style string into its parts.
 * Falls back to treating the whole string as a bare address if no angle brackets.
 * Returns null when the input is empty or has no `@`-bearing address.
 */
export function parseEmailFromHeader(
  raw: string | null | undefined,
): ParsedEmailFromHeader | null {
  const trimmed = raw?.trim();
  if (!trimmed) return null;

  const angleMatch = trimmed.match(/^([\s\S]*?)<([^<>]+)>\s*$/);
  if (angleMatch) {
    const address = angleMatch[2]!.trim();
    if (!isHeaderAddress(address)) return null;
    const rawName = angleMatch[1]!.trim();
    const displayName = stripQuotes(rawName) || null;
    return { address, displayName };
  }

  if (!isHeaderAddress(trimmed)) return null;
  return { address: trimmed, displayName: null };
}

/** The bare email address from `EMAIL_FROM`, or null when unset/malformed. */
export function getConfiguredFromAddress(): string | null {
  return parseEmailFromHeader(serverEnv.EMAIL_FROM)?.address ?? null;
}

/** Format a From header while guaranteeing a display name. */
export function formatEmailFromHeader(
  raw: string | null | undefined,
  fallbackDisplayName: string,
): string {
  const parsed = parseEmailFromHeader(raw);
  if (!parsed) return "";

  const displayName = sanitizeDisplayName(
    parsed.displayName ?? fallbackDisplayName,
    fallbackDisplayName,
  );
  return `${displayName} <${parsed.address}>`;
}

/**
 * Build the share-email From header in the form:
 *   `<senderName> via Earth Optimization Services <noreply@warondisease.org>`
 *
 * Used when a user-authored email goes out under the platform's mail domain
 * but the inbox should foreground the named sender (so the recipient sees
 * a friend's name, not a brand they don't recognize). Per docs/questions.md.
 *
 * Returns "" if EMAIL_FROM is unset/malformed (caller bails out gracefully).
 */
export function formatShareEmailFromHeader(senderName: string): string {
  const address = getConfiguredFromAddress();
  if (!address) return "";
  const safeSender = sanitizeDisplayName(senderName, "A voter");
  const displayName = `${safeSender} via Earth Optimization Services`;
  return `${displayName} <${address}>`;
}

/** Sanitize a sender display name for use inside an RFC 5322 header. */
export function sanitizeDisplayName(name: string, fallback: string): string {
  return name.replace(/[<>\r\n"]/g, "").trim() || fallback;
}

function stripQuotes(name: string): string {
  return name.replace(/^"(.*)"$/, "$1");
}

function isHeaderAddress(address: string): boolean {
  return address.includes("@") && !/[<>\r\n\s]/.test(address);
}
