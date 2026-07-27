/**
 * Task notification email helper.
 *
 * Wraps `sendExternalResendEmail` with the reply-to-routing token so inbound
 * replies land at the correct task via `/api/webhooks/resend`. The address
 * format is `reply+{taskId}@{REPLY_EMAIL_DOMAIN}`.
 *
 * `getReplyAddress` and `parseReplyAddress` are kept side-by-side as a single
 * source of truth on the address shape — change the encoding here and the
 * inbound webhook automatically picks up the new format on the next decode.
 */
import { serverEnv } from "@/lib/env";
import { WAR_ON_DISEASE_REPLY_DOMAIN } from "@/lib/domains";
import { getBaseUrl } from "@/lib/url";

export function getReplyEmailDomain(): string {
  return serverEnv.REPLY_EMAIL_DOMAIN ?? WAR_ON_DISEASE_REPLY_DOMAIN;
}

export function getReplyAddress(taskId: string): string {
  return `reply+${taskId}@${getReplyEmailDomain()}`;
}

export function getConfiguredTaskReplyAddress(taskId: string): string | null {
  if (!serverEnv.RESEND_WEBHOOK_SECRET || !serverEnv.REPLY_EMAIL_DOMAIN) {
    return null;
  }
  return `reply+${taskId}@${serverEnv.REPLY_EMAIL_DOMAIN}`;
}

export function getTaskEmailReplyInstruction(): string | null {
  return serverEnv.RESEND_WEBHOOK_SECRET && serverEnv.REPLY_EMAIL_DOMAIN
    ? "Reply to this email to add a comment to the task."
    : null;
}

/**
 * Resolve the canonical app base URL for outbound task email links.
 */
export function getAppBaseUrl(): string {
  return getBaseUrl();
}

/** Build the URL where a task can be viewed in the app. */
export function getTaskUrl(taskId: string): string {
  return `${getAppBaseUrl()}/tasks/${taskId}`;
}

/** Build the URL that opens the task page at its completion form. */
export function getTaskCompletionUrl(taskId: string): string {
  return `${getTaskUrl(taskId)}#complete`;
}

/**
 * Decode a `reply+{taskId}@{REPLY_EMAIL_DOMAIN}` address back into the taskId.
 * Returns null for any address that doesn't match the expected shape.
 *
 * Tolerates: case-insensitive domain match, surrounding whitespace, and
 * RFC-5322 angle brackets (`<addr@host>` style).
 */
export function parseReplyAddress(
  rawAddress: string,
): { taskId: string } | null {
  if (!rawAddress) return null;
  const trimmed = rawAddress.trim();
  // Strip optional angle brackets: `Display Name <addr@host>` → `addr@host`
  const angleMatch = trimmed.match(/<([^>]+)>/);
  const address = angleMatch?.[1]?.trim() ?? trimmed;
  const expectedDomain = getReplyEmailDomain().toLowerCase();
  const atIdx = address.lastIndexOf("@");
  if (atIdx < 0) return null;
  const local = address.slice(0, atIdx);
  const domain = address.slice(atIdx + 1).toLowerCase();
  if (domain !== expectedDomain) return null;
  if (!local.toLowerCase().startsWith("reply+")) return null;
  const taskId = local.slice("reply+".length);
  if (!taskId) return null;
  return { taskId };
}
