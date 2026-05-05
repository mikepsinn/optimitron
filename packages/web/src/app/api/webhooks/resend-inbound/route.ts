/**
 * Inbound email webhook (Resend Inbound Parse, or fallback Cloudflare Email
 * Worker forwarding to the same shape).
 *
 * Mirrors the outbound webhook at `/api/webhooks/resend/route.ts`:
 *   1. Verify svix-format signature (Resend Inbound uses the same scheme as
 *      the outbound webhook — the `RESEND_INBOUND_WEBHOOK_SECRET` env var
 *      is the secret).
 *   2. Parse the JSON body into our normalized `InboundEmailEvent` shape.
 *   3. Dispatch to `processInboundReply()` which writes the TaskComment +
 *      TaskCommunication and notifies the task creator/recipients.
 *
 * Returns 200 on accepted (incl. silent-skip cases like duplicate
 * providerMessageId, malformed To address) so the provider stops retrying.
 * Returns 500 only on unexpected dispatch errors so the provider does retry.
 *
 * Cloudflare Email Worker compatibility: the worker should POST to this
 * route with the same JSON shape and the same svix headers. Set
 * `RESEND_INBOUND_WEBHOOK_SECRET` to a value the worker can also sign with.
 */
import { NextResponse } from "next/server";
import { serverEnv } from "@/lib/env";
import { verifyResendSignature } from "@/lib/email/resend-webhook";
import {
  processInboundReply,
  type InboundEmailEvent,
} from "@/lib/email/inbound-reply";

export const runtime = "nodejs";

/**
 * Provider payload shape. Resend Inbound's exact JSON keys are subject to
 * change as the product matures; this normalizer covers the documented
 * fields (and is permissive about missing optional ones).
 */
interface ResendInboundPayload {
  type?: string;
  data?: {
    email_id?: string;
    from?: string;
    to?: string[] | string;
    subject?: string;
    text?: string;
    html?: string;
    in_reply_to?: string;
    [key: string]: unknown;
  };
}

function normalize(payload: ResendInboundPayload): InboundEmailEvent | null {
  const data = payload.data;
  if (!data) return null;
  const to = Array.isArray(data.to) ? data.to[0] : data.to;
  if (!to || !data.from || !data.email_id) return null;
  return {
    from: data.from,
    to,
    subject: data.subject ?? "",
    text: data.text ?? "",
    html: data.html ?? null,
    providerMessageId: data.email_id,
    inReplyTo: data.in_reply_to ?? null,
  };
}

export async function POST(request: Request) {
  if (!serverEnv.RESEND_INBOUND_WEBHOOK_SECRET) {
    // Unconfigured — accept silently so the provider doesn't retry forever.
    return NextResponse.json(
      { ok: false, reason: "webhook_not_configured" },
      { status: 200 },
    );
  }

  const rawBody = await request.text();

  const verified = verifyResendSignature({
    rawBody,
    svixId: request.headers.get("svix-id"),
    svixTimestamp: request.headers.get("svix-timestamp"),
    svixSignature: request.headers.get("svix-signature"),
    secret: serverEnv.RESEND_INBOUND_WEBHOOK_SECRET,
  });
  if (!verified) {
    return NextResponse.json(
      { ok: false, reason: "invalid_signature" },
      { status: 401 },
    );
  }

  let payload: ResendInboundPayload;
  try {
    payload = JSON.parse(rawBody) as ResendInboundPayload;
  } catch {
    return NextResponse.json(
      { ok: false, reason: "invalid_body" },
      { status: 400 },
    );
  }

  const event = normalize(payload);
  if (!event) {
    return NextResponse.json(
      { ok: false, reason: "malformed_event" },
      { status: 400 },
    );
  }

  try {
    const result = await processInboundReply(event);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error(
      "[INBOUND WEBHOOK] Dispatch failed",
      event.providerMessageId,
      error,
    );
    // 500 → provider retries. processInboundReply is idempotent on
    // providerMessageId, so retries are safe.
    return NextResponse.json(
      { ok: false, reason: "dispatch_failed" },
      { status: 500 },
    );
  }
}
