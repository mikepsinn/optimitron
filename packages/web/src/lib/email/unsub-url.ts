import { getEmailBaseUrl } from "@/lib/email-urls";
import type { EmailScope } from "@/lib/email/scopes";
import { signUnsubToken } from "@/lib/email/unsub-token";

interface BuildUnsubscribeUrlInput {
  userId: string;
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
  const base = (input.baseUrl ?? getEmailBaseUrl()).replace(/\/+$/, "");
  const token = signUnsubToken({
    userId: input.userId,
    scope: input.scope,
    emailLogId: input.emailLogId,
  });
  const params = new URLSearchParams({
    u: input.userId,
    s: input.scope,
    t: token,
  });
  if (input.emailLogId) params.set("em", input.emailLogId);
  return `${base}/api/email/unsubscribe?${params.toString()}`;
}
