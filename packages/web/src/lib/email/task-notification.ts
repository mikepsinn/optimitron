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
import { sendExternalResendEmail, type SendResult } from "@/lib/email/resend";
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
  if (
    !serverEnv.RESEND_WEBHOOK_SECRET ||
    !serverEnv.REPLY_EMAIL_DOMAIN
  ) {
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

export interface SendTaskNotificationEmailInput {
  taskId: string;
  recipientEmail: string;
  subject: string;
  text: string;
  html?: string;
  /// Per-message From override. Falls back to the campaign default
  /// (`International Campaign to End War and Disease <hello@updates.warondisease.org>`).
  from?: string;
}

export interface SendTaskNotificationResult {
  /// "sent" | "disabled" | "failed". Disabled = email infrastructure not
  /// configured (mock or no API key). Failed = the send raised an error.
  status: "sent" | "disabled" | "failed";
  providerMessageId?: string | null;
  errorMessage?: string;
  replyTo: string;
}

export async function sendTaskNotificationEmail(
  input: SendTaskNotificationEmailInput,
): Promise<SendTaskNotificationResult> {
  const replyTo = getReplyAddress(input.taskId);
  try {
    const result: SendResult = await sendExternalResendEmail({
      to: input.recipientEmail,
      subject: input.subject,
      text: input.text,
      // Resend requires html — fall back to a minimal wrapper around text.
      html:
        input.html ?? `<p>${escapeHtml(input.text).replace(/\n/g, "<br>")}</p>`,
      replyTo,
      from: input.from,
    });
    if (result.status === "disabled") {
      return { status: "disabled", replyTo };
    }
    if (result.status === "suppressed") {
      // External path doesn't run user-suppression checks — this branch is
      // unreachable today, but the type union forces us to handle it.
      return {
        status: "failed",
        replyTo,
        errorMessage: "Email suppressed by user opt-out",
      };
    }
    return {
      status: "sent",
      providerMessageId: result.id ?? null,
      replyTo,
    };
  } catch (error) {
    return {
      status: "failed",
      errorMessage: error instanceof Error ? error.message : String(error),
      replyTo,
    };
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
