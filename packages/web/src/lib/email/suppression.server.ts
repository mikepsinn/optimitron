import { ActivityType } from "@optimitron/db";
import { prisma } from "@/lib/prisma";
import {
  isMasterScope,
  isTransactionalScope,
  type EmailScope,
} from "@/lib/email/scopes";

const MASTER_SCOPE = "all" satisfies EmailScope;

export type UnsubscribeVia =
  | "GET"
  | "POST"
  | "complaint"
  | "hard_bounce"
  | "preferences"
  | "reply";

export interface UnsubscribeEffectInput {
  userId: string;
  scope: EmailScope;
  emailLogId?: string | null;
  via: UnsubscribeVia;
}

export interface AddressUnsubscribeEffectInput {
  email: string;
  scope: EmailScope;
  via: UnsubscribeVia;
  reason?: string | null;
}

/** Maps the arrival channel onto `EmailSuppression.source`. */
function sourceForVia(via: UnsubscribeVia): string {
  switch (via) {
    case "GET":
    case "POST":
      return "link";
    case "preferences":
      return "admin";
    case "complaint":
    case "hard_bounce":
      return "complaint";
    case "reply":
      return "reply";
  }
}

/**
 * Apply an unsubscribe for a recipient with no `User` row. Idempotent.
 *
 * `applyUnsubscribe` silently returns when the user lookup misses, which is
 * correct for account holders but leaves cold-contacted people with nowhere to
 * record a refusal. This writes the address-keyed row that
 * `canSendEmailToAddress` reads at the send boundary.
 *
 * Unsubscribing from the master scope deletes the narrower rows: they are
 * redundant once "all" is set, and leaving them behind would make a later
 * re-subscribe from "all" appear to do nothing.
 */
export async function applyAddressUnsubscribe(
  input: AddressUnsubscribeEffectInput,
): Promise<void> {
  if (isTransactionalScope(input.scope)) {
    // Defensive — a person cannot opt out of sign-in links.
    return;
  }

  const email = input.email.trim().toLowerCase();
  if (!email) return;

  await prisma.$transaction(async (tx) => {
    await tx.emailSuppression.upsert({
      where: { email_scope: { email, scope: input.scope } },
      create: {
        email,
        scope: input.scope,
        source: sourceForVia(input.via),
        reason: input.reason ?? null,
      },
      update: {},
    });

    if (isMasterScope(input.scope)) {
      await tx.emailSuppression.deleteMany({
        where: { email, scope: { not: MASTER_SCOPE } },
      });
    }
  });
}

/**
 * Undo an address-keyed unsubscribe. Idempotent.
 *
 * Resubscribing to a specific scope clears only that scope's row, mirroring
 * `applyResubscribe`: the master block stays in place unless the master
 * scope itself is what's being resubscribed.
 */
export async function applyAddressResubscribe(
  input: Omit<AddressUnsubscribeEffectInput, "via" | "reason">,
): Promise<void> {
  const email = input.email.trim().toLowerCase();
  if (!email) return;

  await prisma.emailSuppression.deleteMany({
    where: {
      email,
      scope: isMasterScope(input.scope) ? MASTER_SCOPE : input.scope,
    },
  });
}

/**
 * Apply an unsubscribe to the DB. Idempotent. Flipping the master scope also
 * sets `newsletterSubscribed=false` so legacy checks still suppress sends.
 */
export async function applyUnsubscribe(input: UnsubscribeEffectInput): Promise<void> {
  if (isTransactionalScope(input.scope)) {
    // Defensive — never suppress transactional mail.
    return;
  }

  const targetingMaster = isMasterScope(input.scope);
  await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: input.userId },
      select: {
        id: true,
        newsletterSubscribed: true,
        unsubscribedScopes: true,
      },
    });
    if (!user) return;

    const already =
      user.unsubscribedScopes.includes(input.scope) ||
      (targetingMaster && !user.newsletterSubscribed);
    if (already) return;

    const nextScopes = user.unsubscribedScopes.includes(input.scope)
      ? user.unsubscribedScopes
      : [...user.unsubscribedScopes, input.scope];

    await tx.user.update({
      where: { id: user.id },
      data: {
        unsubscribedScopes: nextScopes,
        ...(targetingMaster ? { newsletterSubscribed: false } : {}),
      },
    });

    await tx.activity.create({
      data: {
        userId: user.id,
        type: ActivityType.UNSUBSCRIBED,
        description: `Unsubscribed from ${input.scope}`,
        metadata: JSON.stringify({
          scope: input.scope,
          action: "unsubscribe",
          via: input.via,
        }),
        entityType: input.emailLogId ? "EmailLog" : null,
        entityId: input.emailLogId ?? null,
      },
    });
  });
}

export interface ResubscribeEffectInput {
  userId: string;
  scope: EmailScope;
  emailLogId?: string | null;
  via: UnsubscribeVia;
}

/** Reverse of {@link applyUnsubscribe}. Idempotent. */
export async function applyResubscribe(input: ResubscribeEffectInput): Promise<void> {
  if (isTransactionalScope(input.scope)) return;

  const targetingMaster = isMasterScope(input.scope);
  await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: input.userId },
      select: {
        id: true,
        newsletterSubscribed: true,
        unsubscribedScopes: true,
      },
    });
    if (!user) return;

    const alreadySubscribed =
      !user.unsubscribedScopes.includes(input.scope) &&
      (targetingMaster ? user.newsletterSubscribed : true);
    if (alreadySubscribed) return;

    await tx.user.update({
      where: { id: user.id },
      data: {
        unsubscribedScopes: user.unsubscribedScopes.filter((s) => s !== input.scope),
        ...(targetingMaster ? { newsletterSubscribed: true } : {}),
      },
    });

    await tx.activity.create({
      data: {
        userId: user.id,
        type: ActivityType.UNSUBSCRIBED,
        description: `Resubscribed to ${input.scope}`,
        metadata: JSON.stringify({
          scope: input.scope,
          action: "resubscribe",
          via: input.via,
        }),
        entityType: input.emailLogId ? "EmailLog" : null,
        entityId: input.emailLogId ?? null,
      },
    });
  });
}
