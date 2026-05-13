import { randomUUID } from "node:crypto";
import { Resend } from "resend";
import { serverEnv } from "@/lib/env";
import { canSendEmailToUser } from "@/lib/email/can-send.server";
import {
  DEFAULT_UNSUBSCRIBE_EMAIL,
  formatDefaultSystemEmailFromHeader,
} from "@/lib/email/from-address";
import { composeOutboundEmailBody } from "@/lib/email/preview-envelope";
import { renderReactEmailBody } from "@/lib/email/render-react-email";
import { isTransactionalScope } from "@/lib/email/scopes";
import { buildUnsubscribeUrl } from "@/lib/email/unsub-url";
import type { EmailScope } from "@/lib/email/scopes";

interface BaseMessage {
  /** The recipient's `User.id` — required so we can check suppression + build the unsubscribe URL. */
  userId: string;
  /** Category of email, drives suppression + the `List-Unsubscribe` URL scope. */
  scope: EmailScope;
  /** When set, embedded in the unsubscribe URL so clicks attribute back. */
  emailLogId?: string;
  /** When true, bypass the DB-backed suppression check (cron has already filtered). */
  skipSuppressionCheck?: boolean;
  bcc?: string[];
  /// Optional RFC-5322 headers such as Message-ID / In-Reply-To for mail
  /// threading. Unsubscribe headers are still owned by this helper.
  headers?: Record<string, string>;
  /// Optional Reply-To header. Task notifications use this for per-task reply
  /// routing when inbound email has been explicitly configured.
  replyTo?: string;
  /// Comment-notification emails already attribute the visible comment author
  /// in the body, so callers can suppress the generic Wishonia sign-off.
  skipWishoniaSignature?: boolean;
  subject: string;
  to: string;
}

interface ResendMessage extends BaseMessage {
  html: string;
  text: string;
  /// Per-message From override (e.g. share emails: "Mike via International Campaign to End War and Disease"
  /// from formatShareEmailFromHeader). Omit to use the default system address.
  from?: string;
}

interface ResendReactMessage extends BaseMessage {
  react: React.ReactElement;
  from?: string;
}

interface ExternalResendMessage {
  from?: string;
  /// Optional RFC-5322 headers such as Message-ID / In-Reply-To for mail
  /// threading. Unsubscribe headers are still owned by this helper.
  headers?: Record<string, string>;
  /// Optional Reply-To header. Lets task notifications route inbound replies
  /// to a per-task address without
  /// changing the From line that recipients see.
  replyTo?: string;
  /// Comment-notification emails already attribute the visible comment author
  /// in the body, so callers can suppress the generic Wishonia sign-off.
  skipWishoniaSignature?: boolean;
  html: string;
  bcc?: string[];
  subject: string;
  text: string;
  to: string;
  unsubscribeUrl?: string | null;
}

export type SendResult =
  | { status: "disabled" }
  | { status: "suppressed"; reason: "user_opt_out" }
  | { status: "sent"; id: string | null; unsubscribeUrl: string | null };

export interface ReceivedEmailContent {
  from: string;
  to: string[];
  subject: string;
  text: string | null;
  html: string | null;
  headers: Record<string, string> | null;
}

let resendClient: Resend | null = null;

function isMockSendEnabled() {
  return (
    serverEnv.RESEND_MOCK_SEND === "1" && serverEnv.NODE_ENV !== "production"
  );
}

function buildMockSendResult(unsubscribeUrl: string | null): SendResult {
  return {
    status: "sent",
    id: `mock_resend_${randomUUID()}`,
    unsubscribeUrl,
  };
}

export function getEmailFromAddress() {
  // Default sender is the campaign brand; share emails override via the
  // per-message `from` field with
  // formatShareEmailFromHeader (so the recipient's inbox foregrounds the
  // friend's name instead of a corporate brand they don't recognize).
  return formatDefaultSystemEmailFromHeader();
}

export function isResendConfigured() {
  return (
    isMockSendEnabled() ||
    Boolean(serverEnv.RESEND_API_KEY && getEmailFromAddress())
  );
}

function getResendClient() {
  if (!serverEnv.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not configured.");
  }

  resendClient ??= new Resend(serverEnv.RESEND_API_KEY);
  return resendClient;
}

export async function getReceivedEmailContent(
  emailId: string,
): Promise<ReceivedEmailContent> {
  const response = await getResendClient().emails.receiving.get(emailId);
  if (response.error) {
    throw new Error(response.error.message);
  }
  if (!response.data) {
    throw new Error(`Resend returned no received email data for ${emailId}.`);
  }

  return {
    from: response.data.from,
    to: response.data.to,
    subject: response.data.subject,
    text: response.data.text,
    html: response.data.html,
    headers: response.data.headers,
  };
}

function buildUnsubscribeHeaders(
  unsubscribeUrl: string | null,
): Record<string, string> | undefined {
  if (!unsubscribeUrl) {
    return undefined;
  }

  const mailto = `mailto:${DEFAULT_UNSUBSCRIBE_EMAIL}?subject=unsubscribe`;
  return {
    "List-Unsubscribe": `<${unsubscribeUrl}>, <${mailto}>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  };
}

function mergeEmailHeaders(
  messageHeaders: Record<string, string> | undefined,
  unsubscribeHeaders: Record<string, string> | undefined,
) {
  const headers = {
    ...(messageHeaders ?? {}),
    ...(unsubscribeHeaders ?? {}),
  };
  return Object.keys(headers).length > 0 ? headers : undefined;
}

function resolveUnsubscribeUrl(message: BaseMessage): string | null {
  if (isTransactionalScope(message.scope)) {
    return null;
  }

  return buildUnsubscribeUrl({
    userId: message.userId,
    scope: message.scope,
    emailLogId: message.emailLogId,
  });
}

// Fail-loud guard at the send boundary: refuse to dispatch any email whose
// composed body OR generated headers contain an unreachable token. Catches
// localhost / loopback URLs (would 404 in the recipient's mail client) and
// unsubstituted `{{UNSUBSCRIBE_URL}}` placeholders (the substitution step
// somewhere upstream forgot to run). Private — test through the three send
// paths.
//
// Word-boundary regex for hostnames avoids false positives like
// "notlocalhostish"; IPv6 loopback uses a separate branch since `[` is a
// non-word character that breaks `\b`.
//
// Codex review (2026-05-12) caught that the `List-Unsubscribe` header
// (built separately via `buildUnsubscribeUrl()` → `getBaseUrl()`) could
// contain localhost while the body is clean. Now scans headers too.
function assertEmailSafe(input: {
  html: string;
  text: string;
  headers?: Record<string, string>;
}): void {
  const headerString = input.headers
    ? Object.entries(input.headers)
        .map(([k, v]) => `${k}: ${v}`)
        .join("\n")
    : "";
  const combined = `${input.html}\n${input.text}\n${headerString}`;
  const hostRegex =
    /\b(?:localhost|127\.0\.0\.1|0\.0\.0\.0)(?::\d+)?\b|\[::1\](?::\d+)?/i;
  const offenders: string[] = [];
  const hostMatch = combined.match(hostRegex);
  if (hostMatch) offenders.push(hostMatch[0]);
  if (combined.includes("{{UNSUBSCRIBE_URL}}")) {
    offenders.push("{{UNSUBSCRIBE_URL}}");
  }
  if (offenders.length) {
    throw new Error(
      `Refusing to send email: payload contains unreachable token(s) [${offenders.join(", ")}]`,
    );
  }
}

function normalizeEmailList(emails: readonly string[] | null | undefined) {
  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const email of emails ?? []) {
    const value = email.trim().toLowerCase();
    if (!value || seen.has(value)) {
      continue;
    }
    seen.add(value);
    normalized.push(value);
  }

  return normalized;
}

function resolveBcc(message: { bcc?: string[] | null; to: string }) {
  const recipient = message.to.trim().toLowerCase();
  const monitorBcc = getEmailMonitorAddress();
  const bcc = normalizeEmailList([
    ...(message.bcc ?? []),
    ...(monitorBcc ? [monitorBcc] : []),
  ]).filter((email) => email !== recipient);

  return bcc.length > 0 ? bcc : undefined;
}

export function getEmailMonitorAddress() {
  const configured = serverEnv.EMAIL_MONITOR_BCC?.trim();
  if (!configured) {
    return null;
  }

  const lowered = configured.toLowerCase();
  if (lowered === "0" || lowered === "false") {
    return null;
  }

  return configured;
}

export async function sendResendEmail(
  message: ResendMessage,
): Promise<SendResult> {
  if (!isResendConfigured()) {
    return { status: "disabled" };
  }

  if (!message.skipSuppressionCheck) {
    const allowed = await canSendEmailToUser(message.userId, message.scope);
    if (!allowed) {
      return { status: "suppressed", reason: "user_opt_out" };
    }
  }

  const unsubscribeUrl = resolveUnsubscribeUrl(message);
  const unsubscribeHeaders = buildUnsubscribeHeaders(unsubscribeUrl);
  const headers = mergeEmailHeaders(message.headers, unsubscribeHeaders);

  if (isMockSendEnabled()) {
    return buildMockSendResult(unsubscribeUrl);
  }

  // Substitute the unsubscribe URL + append the Wishonia signature unless
  // the caller has its own sender identity (per-message `from`) or has
  // explicitly opted out. Shared with the preview pipeline so previews
  // and real sends compose identically.
  const signed = composeOutboundEmailBody(message, {
    skipWishoniaSignature: Boolean(message.skipWishoniaSignature),
    hasFromOverride: Boolean(message.from),
    unsubscribeUrl: unsubscribeUrl ?? "",
  });
  assertEmailSafe({ ...signed, headers });
  const resend = getResendClient();
  const bcc = resolveBcc(message);
  const response = await resend.emails.send({
    from: message.from ?? getEmailFromAddress(),
    to: [message.to],
    ...(bcc ? { bcc } : {}),
    ...(message.replyTo ? { replyTo: message.replyTo } : {}),
    subject: message.subject,
    html: signed.html,
    text: signed.text,
    ...(headers ? { headers } : {}),
  });

  if (response.error) {
    throw new Error(response.error.message);
  }

  return {
    status: "sent",
    id: response.data?.id ?? null,
    unsubscribeUrl,
  };
}

export async function sendReactEmail(
  message: ResendReactMessage,
): Promise<SendResult> {
  if (!isResendConfigured()) {
    return { status: "disabled" };
  }

  if (!message.skipSuppressionCheck) {
    const allowed = await canSendEmailToUser(message.userId, message.scope);
    if (!allowed) {
      return { status: "suppressed", reason: "user_opt_out" };
    }
  }

  const unsubscribeUrl = resolveUnsubscribeUrl(message);
  const unsubscribeHeaders = buildUnsubscribeHeaders(unsubscribeUrl);
  const headers = mergeEmailHeaders(message.headers, unsubscribeHeaders);

  if (isMockSendEnabled()) {
    return buildMockSendResult(unsubscribeUrl);
  }

  const resend = getResendClient();
  const rendered = await renderReactEmailBody(message.react);
  const signed = composeOutboundEmailBody(
    rendered,
    {
      skipWishoniaSignature: Boolean(message.skipWishoniaSignature),
      hasFromOverride: Boolean(message.from),
      unsubscribeUrl: unsubscribeUrl ?? "",
    },
  );
  assertEmailSafe({ ...signed, headers });

  const bcc = resolveBcc(message);
  const response = await resend.emails.send({
    from: message.from ?? getEmailFromAddress(),
    to: [message.to],
    ...(bcc ? { bcc } : {}),
    ...(message.replyTo ? { replyTo: message.replyTo } : {}),
    subject: message.subject,
    html: signed.html,
    text: signed.text,
    ...(headers ? { headers } : {}),
  });

  if (response.error) {
    throw new Error(response.error.message);
  }

  return {
    status: "sent",
    id: response.data?.id ?? null,
    unsubscribeUrl,
  };
}

export async function sendExternalResendEmail(
  message: ExternalResendMessage,
): Promise<SendResult> {
  if (!isResendConfigured()) {
    return { status: "disabled" };
  }

  const unsubscribeUrl = message.unsubscribeUrl ?? null;
  const unsubscribeHeaders = buildUnsubscribeHeaders(unsubscribeUrl);
  const headers = mergeEmailHeaders(message.headers, unsubscribeHeaders);

  if (isMockSendEnabled()) {
    return buildMockSendResult(unsubscribeUrl);
  }

  // Shared composer: substitute unsub URL + apply Wishonia signature gate.
  const signed = composeOutboundEmailBody(message, {
    skipWishoniaSignature: Boolean(message.skipWishoniaSignature),
    hasFromOverride: Boolean(message.from),
    unsubscribeUrl: unsubscribeUrl ?? "",
  });
  assertEmailSafe({ ...signed, headers });
  const resend = getResendClient();
  const bcc = resolveBcc(message);
  const response = await resend.emails.send({
    from: message.from ?? getEmailFromAddress(),
    to: [message.to],
    ...(bcc ? { bcc } : {}),
    subject: message.subject,
    html: signed.html,
    text: signed.text,
    ...(message.replyTo ? { replyTo: message.replyTo } : {}),
    ...(headers ? { headers } : {}),
  });

  if (response.error) {
    throw new Error(response.error.message);
  }

  return {
    status: "sent",
    id: response.data?.id ?? null,
    unsubscribeUrl,
  };
}
