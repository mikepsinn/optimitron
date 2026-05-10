import {
  CAMPAIGN_EMAIL_FROM_NAME,
  DEFAULT_SYSTEM_EMAIL_FROM,
} from "@optimitron/db/system-identities";
export {
  CAMPAIGN_EMAIL_FROM_NAME,
  CAMPAIGN_SYSTEM_EMAIL,
  DEFAULT_SYSTEM_EMAIL_FROM,
  DEFAULT_UNSUBSCRIBE_EMAIL,
} from "@optimitron/db/system-identities";

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

/** The bare campaign system email address. */
export function getConfiguredFromAddress(): string | null {
  return parseEmailFromHeader(DEFAULT_SYSTEM_EMAIL_FROM)?.address ?? null;
}

/** Format a From header while guaranteeing a display name. */
export function formatEmailFromHeader(
  raw: string | null | undefined,
  fallbackDisplayName: string,
): string {
  const parsed =
    parseEmailFromHeader(raw) ??
    parseEmailFromHeader(DEFAULT_SYSTEM_EMAIL_FROM);
  if (!parsed) return "";

  const displayName = sanitizeDisplayName(
    parsed.displayName ?? fallbackDisplayName,
    fallbackDisplayName,
  );
  return `${displayName} <${parsed.address}>`;
}

/**
 * Format the default platform sender. The default visible sender stays the
 * campaign unless a caller deliberately passes a per-message `from` override.
 */
export function formatDefaultSystemEmailFromHeader(): string {
  return formatSystemEmailFromHeader(CAMPAIGN_EMAIL_FROM_NAME);
}

export function formatSystemEmailFromHeader(displayName: string): string {
  const parsed = parseEmailFromHeader(DEFAULT_SYSTEM_EMAIL_FROM);
  if (!parsed) return "";

  const safeDisplayName = sanitizeDisplayName(
    displayName,
    CAMPAIGN_EMAIL_FROM_NAME,
  );
  return `${safeDisplayName} <${parsed.address}>`;
}

/**
 * Build the share-email From header in the form:
 *   `<senderName> via International Campaign to End War and Disease <hello@updates.warondisease.org>`
 *
 * Used when a user-authored email goes out under the platform's mail domain
 * but the inbox should foreground the named sender (so the recipient sees
 * a friend's name, not a brand they don't recognize). Per docs/questions.md.
 *
 * Uses the platform system sender address.
 */
export function formatShareEmailFromHeader(senderName: string): string {
  const address = getConfiguredFromAddress();
  if (!address) return "";
  const safeSender = sanitizeDisplayName(senderName, "A voter");
  const displayName = `${safeSender} via ${CAMPAIGN_EMAIL_FROM_NAME}`;
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
