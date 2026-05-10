import { randomUUID } from "node:crypto";
import { render } from "@react-email/components";
import { Resend } from "resend";
import { serverEnv } from "@/lib/env";
import { canSendEmailToUser } from "@/lib/email/can-send.server";
import {
  DEFAULT_UNSUBSCRIBE_EMAIL,
  formatDefaultSystemEmailFromHeader,
} from "@/lib/email/from-address";
import { EMAIL_UNSUBSCRIBE_URL_PLACEHOLDER } from "@/lib/email/placeholders";
import { isTransactionalScope } from "@/lib/email/scopes";
import { buildUnsubscribeUrl } from "@/lib/email/unsub-url";
import { appendWishoniaSignature } from "@/lib/email/wishonia-signature";
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

function replaceUnsubscribePlaceholder<
  T extends { html: string; text: string },
>(message: T, unsubscribeUrl: string | null): T {
  if (!unsubscribeUrl) {
    return message;
  }
  if (
    !message.html.includes(EMAIL_UNSUBSCRIBE_URL_PLACEHOLDER) &&
    !message.text.includes(EMAIL_UNSUBSCRIBE_URL_PLACEHOLDER)
  ) {
    return message;
  }
  return {
    ...message,
    html: message.html.replaceAll(
      EMAIL_UNSUBSCRIBE_URL_PLACEHOLDER,
      unsubscribeUrl,
    ),
    text: message.text.replaceAll(
      EMAIL_UNSUBSCRIBE_URL_PLACEHOLDER,
      unsubscribeUrl,
    ),
  };
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

  /// Skip Wishonia auto-sign when the caller set a per-message `from`. A real
  /// human (e.g. a referrer inviting a friend) is the sender — Wishonia
  /// signing on top would double-attribute. The share-email path renders its
  /// own sender sign-off in the body via buildSenderSignature*.
  const body = replaceUnsubscribePlaceholder(message, unsubscribeUrl);
  const signed =
    body.from || body.skipWishoniaSignature
      ? body
      : appendWishoniaSignature(body);
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
  const renderedHtml = await render(message.react);
  const renderedText = await render(message.react, { plainText: true });
  const body = replaceUnsubscribePlaceholder(
    { html: renderedHtml, text: renderedText },
    unsubscribeUrl,
  );
  /// See sendResendEmail for why we gate on `from`.
  const signed = message.from
    ? body
    : message.skipWishoniaSignature
      ? body
      : appendWishoniaSignature(body);

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

  /// See sendResendEmail for why we gate on `from`.
  const body = replaceUnsubscribePlaceholder(message, unsubscribeUrl);
  const signed =
    body.from || body.skipWishoniaSignature
      ? body
      : appendWishoniaSignature(body);
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
