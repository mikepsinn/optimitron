import type { InboundEmailEvent, ProcessInboundReplyResult } from "@/lib/email/inbound-reply";
import { transactionalSend } from "@/lib/email/outbound-authorization.server";
import {
  getEmailMonitorAddress,
  sendExternalResendEmail,
} from "@/lib/email/resend";

export async function forwardInboundReplyToMonitor(
  event: InboundEmailEvent,
  result: ProcessInboundReplyResult,
) {
  const monitorAddress = getEmailMonitorAddress();
  if (!monitorAddress) {
    return { status: "skipped" as const, reason: "monitor_not_configured" };
  }

  const statusLine =
    result.status === "created"
      ? "created task comment"
      : `skipped: ${result.reason ?? "unknown"}`;
  const text = [
    "Inbound email received.",
    "",
    `Processing result: ${statusLine}`,
    `From: ${event.from}`,
    `To: ${event.to}`,
    `Subject: ${event.subject || "(no subject)"}`,
    `Provider message ID: ${event.providerMessageId}`,
    event.inReplyTo ? `In-Reply-To: ${event.inReplyTo}` : null,
    result.taskCommentId ? `Task comment ID: ${result.taskCommentId}` : null,
    result.taskCommunicationId
      ? `Task communication ID: ${result.taskCommunicationId}`
      : null,
    "",
    "Body:",
    event.text || "(no plain-text body)",
  ]
    .filter((line): line is string => line !== null)
    .join("\n");

  const response = await sendExternalResendEmail({
    // Goes only to the operator's own configured monitor mailbox.
    authorization: transactionalSend("operator_monitor_forward"),
    // Transactional: the operator cannot opt their own monitor mailbox out of
    // the forwards it exists to receive.
    scope: "account_security",
    html: `<pre style="white-space:pre-wrap;font:14px/1.5 monospace;">${escapeHtml(text)}</pre>`,
    replyTo: getReplyToAddress(event.from) ?? undefined,
    skipWishoniaSignature: true,
    subject: `Inbound reply: ${event.subject || "(no subject)"}`,
    text,
    to: monitorAddress,
  });

  return response.status === "sent"
    ? { status: "sent" as const, id: response.id }
    : { status: "skipped" as const, reason: response.status };
}

function getReplyToAddress(raw: string) {
  const trimmed = raw.trim();
  const bracketMatch = trimmed.match(/<([^<>]+)>/);
  const address = (bracketMatch?.[1] ?? trimmed).trim();
  return /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(address) ? address : null;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
