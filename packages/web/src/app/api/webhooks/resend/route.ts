import { NextResponse } from "next/server";
import { serverEnv } from "@/lib/env";
import {
  dispatchResendEvent,
  verifyResendSignature,
  type ResendEvent,
} from "@/lib/email/resend-webhook";
import {
  processInboundReply,
  type InboundEmailEvent,
} from "@/lib/email/inbound-reply";
import { forwardInboundReplyToMonitor } from "@/lib/email/inbound-monitor-forward";
import { getReceivedEmailContent } from "@/lib/email/resend";

export const runtime = "nodejs";

async function normalizeInboundEvent(
  event: ResendEvent,
): Promise<InboundEmailEvent | null> {
  const data = event.data;
  if (!data.email_id) return null;

  // Resend keeps inbound body content out of the webhook payload. Fetch the
  // received email before dispatching so task comments are not empty metadata.
  const email = await getReceivedEmailContent(data.email_id);
  const webhookTo = Array.isArray(data.to) ? data.to[0] : data.to;
  const to = email.to[0] ?? webhookTo;
  const from = email.from || (typeof data.from === "string" ? data.from : null);
  if (!to || !from) return null;

  return {
    from,
    to,
    subject: email.subject || data.subject || "",
    text: email.text ?? htmlToPlainText(email.html),
    html: email.html,
    providerMessageId: data.email_id,
    inReplyTo:
      getHeaderValue(email.headers, "in-reply-to") ??
      (typeof data.in_reply_to === "string" ? data.in_reply_to : null),
  };
}

async function dispatchInboundReceivedEvent(event: ResendEvent) {
  const inboundEvent = await normalizeInboundEvent(event);
  if (!inboundEvent) {
    return { ok: false, reason: "malformed_inbound_event", status: 400 };
  }

  const result = await processInboundReply(inboundEvent);
  try {
    await forwardInboundReplyToMonitor(inboundEvent, result);
  } catch (monitorError) {
    console.error(
      "[RESEND WEBHOOK] Inbound monitor forward failed",
      inboundEvent.providerMessageId,
      monitorError,
    );
  }

  return { ok: true, result, status: 200 };
}

function getHeaderValue(
  headers: Record<string, string> | null | undefined,
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

export async function POST(request: Request) {
  if (!serverEnv.RESEND_WEBHOOK_SECRET) {
    // Unconfigured — treat as disabled so Resend doesn't retry indefinitely.
    return NextResponse.json({ ok: false, reason: "webhook_not_configured" }, { status: 200 });
  }

  const rawBody = await request.text();

  const verified = verifyResendSignature({
    rawBody,
    svixId: request.headers.get("svix-id"),
    svixTimestamp: request.headers.get("svix-timestamp"),
    svixSignature: request.headers.get("svix-signature"),
    secret: serverEnv.RESEND_WEBHOOK_SECRET,
  });
  if (!verified) {
    return NextResponse.json({ ok: false, reason: "invalid_signature" }, { status: 401 });
  }

  let event: ResendEvent;
  try {
    event = JSON.parse(rawBody) as ResendEvent;
  } catch {
    return NextResponse.json({ ok: false, reason: "invalid_body" }, { status: 400 });
  }

  if (!event?.type || !event.data?.email_id) {
    return NextResponse.json({ ok: false, reason: "malformed_event" }, { status: 400 });
  }

  try {
    if (event.type === "email.received") {
      const inbound = await dispatchInboundReceivedEvent(event);
      if (!inbound.ok) {
        return NextResponse.json(
          { ok: false, reason: inbound.reason },
          { status: inbound.status },
        );
      }
      return NextResponse.json({ ok: true, ...inbound.result });
    }

    await dispatchResendEvent(event);
  } catch (error) {
    console.error("[RESEND WEBHOOK] Dispatch failed", event.type, event.data?.email_id, error);
    // Return 500 so Resend retries — handlers are idempotent.
    return NextResponse.json({ ok: false, reason: "dispatch_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
