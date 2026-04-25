import { createHmac, timingSafeEqual } from "node:crypto";
import { ActivityType } from "@optimitron/db";
import { prisma } from "@/lib/prisma";
import { applyUnsubscribe } from "@/lib/email/suppression.server";

/** Minimal Resend webhook event shapes. Trim/extend as we use more fields. */
export type ResendEventType =
  | "email.sent"
  | "email.delivered"
  | "email.delivery_delayed"
  | "email.bounced"
  | "email.complained"
  | "email.opened"
  | "email.clicked";

export interface ResendEvent {
  type: ResendEventType;
  created_at?: string;
  data: {
    email_id: string;
    to?: string[];
    subject?: string;
    bounce?: { type?: "hard" | "soft"; message?: string };
    [key: string]: unknown;
  };
}

/**
 * Verify a svix-format webhook signature (what Resend uses). Returns true on
 * match. Constant-time compare. The `secret` is the raw, non-prefixed secret
 * from the Resend dashboard (or prefixed with `whsec_` — we strip that).
 */
export function verifyResendSignature(input: {
  rawBody: string;
  svixId: string | null;
  svixTimestamp: string | null;
  svixSignature: string | null;
  secret: string;
}): boolean {
  const { rawBody, svixId, svixTimestamp, svixSignature, secret } = input;
  if (!svixId || !svixTimestamp || !svixSignature || !secret) return false;

  const rawSecret = secret.startsWith("whsec_") ? secret.slice("whsec_".length) : secret;
  let secretBytes: Buffer;
  try {
    secretBytes = Buffer.from(rawSecret, "base64");
  } catch {
    return false;
  }
  if (secretBytes.length === 0) return false;

  const toSign = `${svixId}.${svixTimestamp}.${rawBody}`;
  const expected = createHmac("sha256", secretBytes).update(toSign).digest();

  // Signature header contains one or more `v1,<base64>` entries, space-separated.
  for (const entry of svixSignature.split(" ")) {
    const [version, sigBase64] = entry.split(",", 2);
    if (version !== "v1" || !sigBase64) continue;
    let received: Buffer;
    try {
      received = Buffer.from(sigBase64, "base64");
    } catch {
      continue;
    }
    if (received.length !== expected.length) continue;
    if (timingSafeEqual(received, expected)) return true;
  }
  return false;
}

/**
 * Look up the EmailLog + user for a webhook event, by Resend's message ID.
 * Returns null when the event refers to a message we didn't send (or we never
 * persisted the id — old rows pre-dating this schema).
 */
async function findEmailLogContext(providerMessageId: string) {
  return prisma.emailLog.findFirst({
    where: { providerMessageId },
    select: {
      id: true,
      userId: true,
      templateId: true,
    },
  });
}

async function writeWebhookActivity(input: {
  userId: string;
  emailLogId: string;
  action: string;
  extra?: Record<string, unknown>;
}) {
  await prisma.activity.create({
    data: {
      userId: input.userId,
      type: ActivityType.UNSUBSCRIBED,
      description: `Email webhook: ${input.action}`,
      metadata: JSON.stringify({ action: input.action, via: "webhook", ...input.extra }),
      entityType: "EmailLog",
      entityId: input.emailLogId,
    },
  });
}

export async function applyComplaintEvent(event: ResendEvent): Promise<void> {
  const ctx = await findEmailLogContext(event.data.email_id);
  if (!ctx?.userId) return;
  await applyUnsubscribe({
    userId: ctx.userId,
    scope: "all",
    emailLogId: ctx.id,
    via: "complaint",
  });
}

export async function applyBounceEvent(event: ResendEvent): Promise<void> {
  const ctx = await findEmailLogContext(event.data.email_id);
  if (!ctx) return;

  await prisma.emailLog.update({
    where: { id: ctx.id },
    data: { bouncedAt: new Date() },
  });

  const bounceType = event.data.bounce?.type;
  if (bounceType === "hard" && ctx.userId) {
    // Invalid address — stop sending entirely, mirroring the complaint effect.
    await applyUnsubscribe({
      userId: ctx.userId,
      scope: "all",
      emailLogId: ctx.id,
      via: "hard_bounce",
    });
  } else if (ctx.userId) {
    await writeWebhookActivity({
      userId: ctx.userId,
      emailLogId: ctx.id,
      action: "soft_bounce",
      extra: { bounceType: bounceType ?? null },
    });
  }
}

export async function applyDeliveredEvent(event: ResendEvent): Promise<void> {
  const ctx = await findEmailLogContext(event.data.email_id);
  if (!ctx) return;
  await prisma.emailLog.updateMany({
    where: { id: ctx.id, deliveredAt: null },
    data: { deliveredAt: new Date() },
  });
}

export async function applyOpenedEvent(event: ResendEvent): Promise<void> {
  const ctx = await findEmailLogContext(event.data.email_id);
  if (!ctx) return;
  await prisma.emailLog.updateMany({
    where: { id: ctx.id, openedAt: null },
    data: { openedAt: new Date() },
  });
}

/** Fan out by event type. Unknown types are ignored (not errors). */
export async function dispatchResendEvent(event: ResendEvent): Promise<void> {
  switch (event.type) {
    case "email.complained":
      await applyComplaintEvent(event);
      return;
    case "email.bounced":
      await applyBounceEvent(event);
      return;
    case "email.delivered":
      await applyDeliveredEvent(event);
      return;
    case "email.opened":
      await applyOpenedEvent(event);
      return;
    // email.sent / email.clicked / email.delivery_delayed — no-op for now.
    default:
      return;
  }
}
