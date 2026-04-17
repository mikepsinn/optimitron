import { NextResponse } from "next/server";
import { serverEnv } from "@/lib/env";
import {
  dispatchResendEvent,
  verifyResendSignature,
  type ResendEvent,
} from "@/lib/email/resend-webhook";

export const runtime = "nodejs";

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
    await dispatchResendEvent(event);
  } catch (error) {
    console.error("[RESEND WEBHOOK] Dispatch failed", event.type, event.data?.email_id, error);
    // Return 500 so Resend retries — handlers are idempotent.
    return NextResponse.json({ ok: false, reason: "dispatch_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
