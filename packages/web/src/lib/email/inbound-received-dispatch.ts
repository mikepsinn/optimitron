import {
  processInboundReply,
  type InboundEmailEvent,
} from "@/lib/email/inbound-reply";
import { processInboundUnsubscribe } from "@/lib/email/inbound-unsubscribe";
import { forwardInboundReplyToMonitor } from "@/lib/email/inbound-monitor-forward";
import {
  getReceivedEmailContent,
  type ReceivedEmailContent,
} from "@/lib/email/resend";
import type { ResendEvent } from "@/lib/email/resend-webhook";

interface NormalizedInboundEvent {
  contentFetchError?: unknown;
  inboundEvent: InboundEmailEvent;
}

export async function dispatchInboundReceivedEvent(event: ResendEvent) {
  const normalized = await normalizeInboundEvent(event);
  if (!normalized) {
    return { ok: false, reason: "malformed_inbound_event", status: 400 };
  }

  const { contentFetchError, inboundEvent } = normalized;
  if (contentFetchError) {
    await forwardInboundEventToMonitor(inboundEvent, {
      reason: "content_fetch_error",
      status: "skipped",
    });
    throw contentFetchError;
  }

  try {
    const unsubscribe = await processInboundUnsubscribe(inboundEvent);
    if (unsubscribe.handled) {
      await forwardInboundEventToMonitor(inboundEvent, {
        reason:
          unsubscribe.status === "unsubscribed"
            ? `unsubscribe:${unsubscribe.scope ?? "unknown"}`
            : `unsubscribe_skipped:${unsubscribe.reason ?? "unknown"}`,
        status: "skipped",
        taskCommunicationId: unsubscribe.taskCommunicationId,
      });
      return { ok: true, result: unsubscribe, status: 200 };
    }

    const result = await processInboundReply(inboundEvent);
    await forwardInboundEventToMonitor(inboundEvent, result);
    return { ok: true, result, status: 200 };
  } catch (error) {
    await forwardInboundEventToMonitor(inboundEvent, {
      reason: "processing_error",
      status: "skipped",
    });
    throw error;
  }
}

async function normalizeInboundEvent(
  event: ResendEvent,
): Promise<NormalizedInboundEvent | null> {
  const data = event.data;
  if (!data.email_id) return null;

  const webhookTo = Array.isArray(data.to) ? data.to[0] : data.to;

  // Resend keeps inbound body content out of the webhook payload. Fetch the
  // received email before dispatching so task comments are not empty metadata.
  let email: ReceivedEmailContent;
  try {
    email = await getReceivedEmailContent(data.email_id);
  } catch (error) {
    const from = typeof data.from === "string" ? data.from : null;
    const to = typeof webhookTo === "string" ? webhookTo : null;
    if (!to || !from) return null;

    const html = typeof data.html === "string" ? data.html : null;
    return {
      contentFetchError: error,
      inboundEvent: {
        from,
        to,
        subject: data.subject || "",
        text: coalesceInboundText(
          typeof data.text === "string" ? data.text : null,
          html,
        ),
        html,
        providerMessageId: data.email_id,
        inReplyTo:
          typeof data.in_reply_to === "string" ? data.in_reply_to : null,
      },
    };
  }

  const to = email.to[0] ?? webhookTo;
  const from = email.from || (typeof data.from === "string" ? data.from : null);
  if (!to || !from) return null;

  return {
    inboundEvent: {
      from,
      to,
      subject: email.subject || data.subject || "",
      text: coalesceInboundText(email.text, email.html),
      html: email.html,
      providerMessageId: data.email_id,
      inReplyTo:
        getHeaderValue(email.headers, "in-reply-to") ??
        (typeof data.in_reply_to === "string" ? data.in_reply_to : null),
    },
  };
}

function coalesceInboundText(
  text: string | null | undefined,
  html: string | null,
) {
  if (typeof text === "string" && text.trim().length > 0) return text;
  return htmlToPlainText(html);
}

async function forwardInboundEventToMonitor(
  inboundEvent: InboundEmailEvent,
  result: Awaited<ReturnType<typeof processInboundReply>>,
) {
  try {
    await forwardInboundReplyToMonitor(inboundEvent, result);
  } catch (monitorError) {
    console.error(
      "[RESEND WEBHOOK] Inbound monitor forward failed",
      inboundEvent.providerMessageId,
      monitorError,
    );
  }
}

function getHeaderValue(
  headers: ReceivedEmailContent["headers"] | null | undefined,
  name: string,
) {
  const needle = name.toLowerCase();
  for (const [key, value] of Object.entries(headers ?? {})) {
    if (key.toLowerCase() === needle && value.trim()) {
      return value.trim();
    }
  }
  return null;
}

function htmlToPlainText(html: string | null) {
  if (!html) return "";
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .trim();
}
