import type { EmailScope } from "@/lib/email/scopes";
import { signUnsubToken } from "@/lib/email/unsub-token";
import { getBaseUrl } from "@/lib/url";

interface BuildUnsubscribeUrlInput {
  /** Omit for recipients with no account and pass `email` instead. */
  userId?: string;
  /**
   * Recipient address, for people with no `User` row. Exactly one of `userId`
   * or `email` must be set — a link with neither identifies nobody and the
   * route would reject it.
   */
  email?: string;
  scope: EmailScope;
  /** When set, the resulting click can be attributed back to this email. */
  emailLogId?: string;
  /** Override the base origin (tests / preview URLs). */
  baseUrl?: string;
}

/**
 * Build the owned, token-signed unsubscribe URL that goes into every outbound
 * email — both the visible footer link and the RFC 8058 `List-Unsubscribe`
 * header. One function so we never have mismatched URLs.
 */
export function buildUnsubscribeUrl(input: BuildUnsubscribeUrlInput): string {
  const base = (input.baseUrl ?? getBaseUrl()).replace(/\/+$/, "");
  const email = input.email?.trim().toLowerCase();
  if (!input.userId && !email) {
    throw new Error(
      "buildUnsubscribeUrl requires userId or email; a link identifying nobody cannot be honoured",
    );
  }
  const token = signUnsubToken({
    userId: input.userId,
    email,
    scope: input.scope,
    emailLogId: input.emailLogId,
  });
  // Order matters: `u,s,t[,em]` reproduces the exact query string this function
  // has always emitted for account holders, so links already in inboxes stay
  // byte-identical. `e` only appears on the no-account path.
  const params = new URLSearchParams();
  if (input.userId) params.set("u", input.userId);
  params.set("s", input.scope);
  params.set("t", token);
  if (email) params.set("e", email);
  if (input.emailLogId) params.set("em", input.emailLogId);
  return `${base}/api/email/unsubscribe?${params.toString()}`;
}
