/**
 * Task notification email helper.
 *
 * Wraps `sendExternalResendEmail` with the reply-to-routing token so inbound
 * replies land at the correct task. The address format is
 * `reply+{taskId}@{REPLY_EMAIL_DOMAIN}` (default `reply.warondisease.org`).
 *
 * `getReplyAddress` and `parseReplyAddress` are kept side-by-side as a single
 * source of truth on the address shape — change the encoding here and the
 * inbound webhook automatically picks up the new format on the next decode.
 */
import { sendExternalResendEmail, type SendResult } from "@/lib/email/resend";
import { serverEnv } from "@/lib/env";

const DEFAULT_REPLY_DOMAIN = "reply.warondisease.org";
const DEFAULT_BASE_URL = "https://warondisease.org";

export function getReplyEmailDomain(): string {
  return serverEnv.REPLY_EMAIL_DOMAIN ?? DEFAULT_REPLY_DOMAIN;
}

export function getReplyAddress(taskId: string): string {
  return `reply+${taskId}@${getReplyEmailDomain()}`;
}

/**
 * Resolve the canonical app base URL for outbound email links. Reads in
 * priority order: NEXT_PUBLIC_BASE_URL (explicit, also available server-side
 * since NEXT_PUBLIC_ vars are inlined into the runtime), NEXTAUTH_URL (set
 * per deployment), then a hardcoded production fallback. Always returned
 * without a trailing slash so callers can append `/path` directly.
 */
export function getAppBaseUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_BASE_URL ??
    serverEnv.NEXTAUTH_URL ??
    DEFAULT_BASE_URL;
  return raw.replace(/\/$/, "");
}

/** Build the URL where a task can be viewed in the app. */
export function getTaskUrl(taskId: string): string {
  return `${getAppBaseUrl()}/tasks/${taskId}`;
}

/**
 * Decode a `reply+{taskId}@{REPLY_EMAIL_DOMAIN}` address back into the taskId.
 * Returns null for any address that doesn't match the expected shape.
 *
 * Tolerates: case-insensitive domain match, surrounding whitespace, and
 * RFC-5322 angle brackets (`<addr@host>` style).
 */
export function parseReplyAddress(rawAddress: string): { taskId: string } | null {
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
  /// Per-message From override. Falls back to platform default
  /// (`Earth Optimization Services <noreply@warondisease.org>`).
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
      html: input.html ?? `<p>${escapeHtml(input.text).replace(/\n/g, "<br>")}</p>`,
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
