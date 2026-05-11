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
