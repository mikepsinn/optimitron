import { randomUUID } from "node:crypto";
import { Resend } from "resend";
import { serverEnv } from "@/lib/env";
import { canSendEmailToUser } from "@/lib/email/can-send.server";
import {
  DEFAULT_UNSUBSCRIBE_EMAIL,
  formatDefaultSystemEmailFromHeader,
} from "@/lib/email/from-address";
import {
  evaluateOutboundEmailPolicy,
  type OutboundSuppressionReason,
} from "@/lib/email/outbound-mode";
import {
  assertGenuineSendAuthorization,
  type SendAuthorization,
} from "@/lib/email/outbound-authorization.server";
import { composeOutboundEmailBody } from "@/lib/email/preview-envelope";
import { renderReactEmailBody } from "@/lib/email/render-react-email";
import { isTransactionalScope } from "@/lib/email/scopes";
import { buildUnsubscribeUrl } from "@/lib/email/unsub-url";
import type { EmailScope } from "@/lib/email/scopes";
import type { WishoniaSignatureSelection } from "@/lib/email/wishonia-signature";

interface BaseMessage {
  /**
   * Who said to send this. Required on every path: recipient-initiated
   * (`transactional`), a signed-in human pressing send (`owner`), or a
   * human-approved ExternalActionRequest (`approved`). See
   * `@/lib/email/outbound-authorization.server`.
   */
  authorization: SendAuthorization;
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
  /** See {@link BaseMessage.authorization}. */
  authorization: SendAuthorization;
  /** Category of email, used when composing the immutable envelope. */
  scope: EmailScope;
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

/** Exact request body handed to `resend.emails.send`. */
export interface ResendProviderEnvelope {
  bcc?: string[];
  from: string;
  headers?: Record<string, string>;
  html: string;
  replyTo?: string;
  subject: string;
  text: string;
  to: [string];
}

export interface PrepareResendProviderEnvelopeInput {
  bcc?: string[];
  from?: string | null;
  headers?: Record<string, string>;
  html: string;
  replyTo?: string | null;
  scope: EmailScope;
  skipWishoniaSignature?: boolean;
  subject: string;
  text: string;
  to: string;
  unsubscribeUrl?: string | null;
  wishoniaSelection?: WishoniaSignatureSelection;
}

export class ResendDeliveryError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly retryable: boolean,
  ) {
    super(message);
    this.name = "ResendDeliveryError";
  }
}

export type SendResult =
  | { status: "disabled" }
  | { status: "suppressed"; reason: "user_opt_out" | OutboundSuppressionReason }
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

// Env-level emergency stop. It covers To and BCC at the lowest send boundary,
// including mock sends, so callers cannot bypass it accidentally.
function checkOutboundPolicyForRecipients(
  recipients: readonly string[],
): SendResult | null {
  for (const to of recipients) {
    const decision = evaluateOutboundEmailPolicy({
      allowlist: serverEnv.OUTBOUND_EMAIL_ALLOWLIST,
      mode: serverEnv.OUTBOUND_EMAIL_MODE,
      to,
    });
    if (decision.allowed) continue;
    const recipientDomain = to.split("@")[1] ?? "unknown";
    console.warn(
      `[OUTBOUND-EMAIL] Suppressed send to @${recipientDomain}: ${decision.reason}`,
    );
    return { status: "suppressed", reason: decision.reason };
  }
  return null;
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
// The host regex requires a `http://` or `https://` scheme prefix. Without
// it, a user-controlled task title or comment body containing the bare word
// "localhost" (e.g. "Login broken on localhost") would trip the guard and
// silently fail the whole batch. We only care about actual URLs that would
// dead-link in the recipient's client.
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
    /https?:\/\/(?:localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])(?::\d+)?/i;
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

function resolveBcc(message: {
  bcc?: string[] | null;
  scope?: EmailScope;
  to: string;
}) {
  const recipient = message.to.trim().toLowerCase();
  const monitorBcc =
    message.scope === "magic_link" ? null : getEmailMonitorAddress();
  const bcc = normalizeEmailList([
    ...(message.bcc ?? []),
    ...(monitorBcc ? [monitorBcc] : []),
  ]).filter((email) => email !== recipient);

  return bcc.length > 0 ? bcc : undefined;
}

/**
 * Resolve every provider-visible field once. Approval flows persist this exact
 * object and later send it without consulting mutable drafts or environment.
 */
export function prepareResendProviderEnvelope(
  message: PrepareResendProviderEnvelopeInput,
): ResendProviderEnvelope {
  const unsubscribeHeaders = buildUnsubscribeHeaders(
    message.unsubscribeUrl ?? null,
  );
  const headers = mergeEmailHeaders(message.headers, unsubscribeHeaders);
  const signed = composeOutboundEmailBody(message, {
    skipWishoniaSignature: Boolean(message.skipWishoniaSignature),
    hasFromOverride: Boolean(message.from),
    unsubscribeUrl: message.unsubscribeUrl ?? "",
    wishoniaSelection: message.wishoniaSelection,
  });
  assertEmailSafe({ ...signed, headers });
  const to = message.to.trim().toLowerCase();
  const bcc = resolveBcc({
    bcc: message.bcc,
    scope: message.scope,
    to,
  });
  return {
    from: message.from ?? getEmailFromAddress(),
    to: [to],
    ...(bcc ? { bcc } : {}),
    ...(message.replyTo ? { replyTo: message.replyTo } : {}),
    subject: message.subject,
    html: signed.html,
    text: signed.text,
    ...(headers ? { headers } : {}),
  };
}

function retryableResendCode(code: string, statusCode?: number | null) {
  return (
    code === "concurrent_idempotent_requests" ||
    code === "rate_limit_exceeded" ||
    code === "application_error" ||
    code === "internal_server_error" ||
    statusCode === 429 ||
    (typeof statusCode === "number" && statusCode >= 500)
  );
}

async function sendProviderEnvelope(
  envelope: ResendProviderEnvelope,
  idempotencyKey?: string,
) {
  try {
    const response = idempotencyKey
      ? await getResendClient().emails.send(envelope, { idempotencyKey })
      : await getResendClient().emails.send(envelope);
    if (response.error) {
      throw new ResendDeliveryError(
        response.error.message,
        response.error.name,
        retryableResendCode(response.error.name, response.error.statusCode),
      );
    }
    return response.data?.id ?? null;
  } catch (error) {
    if (error instanceof ResendDeliveryError) throw error;
    throw new ResendDeliveryError(
      error instanceof Error ? error.message : String(error),
      "transport_error",
      true,
    );
  }
}

async function deliverProviderEnvelope(input: {
  envelope: ResendProviderEnvelope;
  idempotencyKey?: string;
  recipientUserId?: string | null;
  scope: EmailScope;
  skipSuppressionCheck?: boolean;
  unsubscribeUrl: string | null;
}): Promise<SendResult> {
  if (!isResendConfigured()) return { status: "disabled" };
  const policy = checkOutboundPolicyForRecipients(
    normalizeEmailList([...input.envelope.to, ...(input.envelope.bcc ?? [])]),
  );
  if (policy) return policy;
  if (
    input.recipientUserId &&
    !input.skipSuppressionCheck &&
    !(await canSendEmailToUser(input.recipientUserId, input.scope))
  ) {
    return { status: "suppressed", reason: "user_opt_out" };
  }
  assertEmailSafe({
    headers: input.envelope.headers,
    html: input.envelope.html,
    text: input.envelope.text,
  });
  if (isMockSendEnabled()) return buildMockSendResult(input.unsubscribeUrl);
  const id = await sendProviderEnvelope(input.envelope, input.idempotencyKey);
  return { status: "sent", id, unsubscribeUrl: input.unsubscribeUrl };
}

/** Send an already-composed immutable envelope with a provider idempotency key. */
export async function sendPreparedResendEmail(input: {
  authorization: SendAuthorization;
  envelope: ResendProviderEnvelope;
  idempotencyKey: string;
  recipientUserId: string | null;
  scope: EmailScope;
}): Promise<SendResult> {
  assertGenuineSendAuthorization(input.authorization);
  if (!input.idempotencyKey || input.idempotencyKey.length > 256) {
    throw new ResendDeliveryError(
      "Resend idempotency keys must contain 1-256 characters",
      "invalid_idempotency_key",
      false,
    );
  }

  return deliverProviderEnvelope({
    envelope: input.envelope,
    idempotencyKey: input.idempotencyKey,
    recipientUserId: input.recipientUserId,
    scope: input.scope,
    unsubscribeUrl: null,
  });
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
  assertGenuineSendAuthorization(message.authorization);
  if (!isResendConfigured()) return { status: "disabled" };
  const unsubscribeUrl = resolveUnsubscribeUrl(message);
  const envelope = prepareResendProviderEnvelope({
    ...message,
    unsubscribeUrl,
  });
  return deliverProviderEnvelope({
    envelope,
    recipientUserId: message.userId,
    scope: message.scope,
    skipSuppressionCheck: message.skipSuppressionCheck,
    unsubscribeUrl,
  });
}

export async function sendReactEmail(
  message: ResendReactMessage,
): Promise<SendResult> {
  assertGenuineSendAuthorization(message.authorization);
  if (!isResendConfigured()) return { status: "disabled" };
  const unsubscribeUrl = resolveUnsubscribeUrl(message);
  const rendered = await renderReactEmailBody(message.react);
  const envelope = prepareResendProviderEnvelope({
    ...message,
    ...rendered,
    unsubscribeUrl,
  });
  return deliverProviderEnvelope({
    envelope,
    recipientUserId: message.userId,
    scope: message.scope,
    skipSuppressionCheck: message.skipSuppressionCheck,
    unsubscribeUrl,
  });
}

export async function sendExternalResendEmail(
  message: ExternalResendMessage,
): Promise<SendResult> {
  assertGenuineSendAuthorization(message.authorization);
  if (!isResendConfigured()) return { status: "disabled" };
  const unsubscribeUrl = message.unsubscribeUrl ?? null;
  const envelope = prepareResendProviderEnvelope({
    ...message,
    unsubscribeUrl,
  });
  return deliverProviderEnvelope({
    envelope,
    scope: message.scope,
    unsubscribeUrl,
  });
}
