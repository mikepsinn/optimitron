import { randomUUID } from "node:crypto";
import { render } from "@react-email/components";
import { Resend } from "resend";
import { serverEnv } from "@/lib/env";
import { canSendEmailToUser } from "@/lib/email/can-send.server";
import { formatEmailFromHeader, parseEmailFromHeader } from "@/lib/email/from-address";
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
  subject: string;
  to: string;
}

interface ResendMessage extends BaseMessage {
  html: string;
  text: string;
}

interface ResendReactMessage extends BaseMessage {
  react: React.ReactElement;
}

interface ExternalResendMessage {
  from?: string;
  html: string;
  subject: string;
  text: string;
  to: string;
  unsubscribeUrl?: string | null;
}

export type SendResult =
  | { status: "disabled" }
  | { status: "suppressed"; reason: "user_opt_out" }
  | { status: "sent"; id: string | null; unsubscribeUrl: string | null };

let resendClient: Resend | null = null;

function isMockSendEnabled() {
  return serverEnv.RESEND_MOCK_SEND === "1" && serverEnv.NODE_ENV !== "production";
}

function buildMockSendResult(unsubscribeUrl: string | null): SendResult {
  return {
    status: "sent",
    id: `mock_resend_${randomUUID()}`,
    unsubscribeUrl,
  };
}

export function getEmailFromAddress() {
  return formatEmailFromHeader(serverEnv.EMAIL_FROM, "Wishonia");
}

export function isResendConfigured() {
  return isMockSendEnabled() || Boolean(serverEnv.RESEND_API_KEY && getEmailFromAddress());
}

function getResendClient() {
  if (!serverEnv.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not configured.");
  }

  resendClient ??= new Resend(serverEnv.RESEND_API_KEY);
  return resendClient;
}

function buildUnsubscribeHeaders(unsubscribeUrl: string | null): Record<string, string> | undefined {
  if (!unsubscribeUrl) {
    return undefined;
  }

  const mailtoAddr = parseEmailFromHeader(serverEnv.EMAIL_FROM)?.address ?? "unsubscribe@optimitron.com";
  const mailto = `mailto:${mailtoAddr}?subject=unsubscribe`;
  return {
    "List-Unsubscribe": `<${unsubscribeUrl}>, <${mailto}>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  };
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

export async function sendResendEmail(message: ResendMessage): Promise<SendResult> {
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

  if (isMockSendEnabled()) {
    return buildMockSendResult(unsubscribeUrl);
  }

  const resend = getResendClient();
  const response = await resend.emails.send({
    from: getEmailFromAddress(),
    to: [message.to],
    subject: message.subject,
    html: message.html,
    text: message.text,
    ...(unsubscribeHeaders ? { headers: unsubscribeHeaders } : {}),
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

export async function sendReactEmail(message: ResendReactMessage): Promise<SendResult> {
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

  if (isMockSendEnabled()) {
    return buildMockSendResult(unsubscribeUrl);
  }

  const resend = getResendClient();
  const html = await render(message.react);
  const text = await render(message.react, { plainText: true });

  const response = await resend.emails.send({
    from: getEmailFromAddress(),
    to: [message.to],
    subject: message.subject,
    html,
    text,
    ...(unsubscribeHeaders ? { headers: unsubscribeHeaders } : {}),
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

export async function sendExternalResendEmail(message: ExternalResendMessage): Promise<SendResult> {
  if (!isResendConfigured()) {
    return { status: "disabled" };
  }

  const unsubscribeUrl = message.unsubscribeUrl ?? null;
  const unsubscribeHeaders = buildUnsubscribeHeaders(unsubscribeUrl);

  if (isMockSendEnabled()) {
    return buildMockSendResult(unsubscribeUrl);
  }

  const resend = getResendClient();
  const response = await resend.emails.send({
    from: message.from ?? getEmailFromAddress(),
    to: [message.to],
    subject: message.subject,
    html: message.html,
    text: message.text,
    ...(unsubscribeHeaders ? { headers: unsubscribeHeaders } : {}),
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
