/**
 * Referral-invitation task — backed by the `referral:vote-invitation`
 * TaskTrigger blueprint synced by `pnpm db:sync:managed-data -- --apply`.
 *
 * `createReferralInvitationTask` is a thin wrapper that fires the trigger
 * with the right context and patches the few task fields the trigger
 * framework doesn't model first-class (`assigneeAffiliationSnapshot`,
 * `contextJson`). To change task content (title, description, due date,
 * action-link copy), edit the trigger row, not this file.
 *
 * `verifyReferralInvitationTask` stays here — it's the click-through-vote
 * conversion path, not a spawn.
 */

import { TaskCommentKind, TaskCommentSource, TaskStatus } from "@optimitron/db";
import type { Prisma, PrismaClient } from "@optimitron/db";
import { prisma } from "@/lib/prisma";
import { buildTriggerContext, fireTaskTrigger } from "@/lib/triggers";
import { getReferralInvitationFirstName } from "@/lib/referral-invitation-copy";

type ReferralInvitationTaskClient =
  | Pick<PrismaClient, "task" | "taskComment" | "taskCommunicationEndpoint">
  | Pick<Prisma.TransactionClient, "task" | "taskComment" | "taskCommunicationEndpoint">;

export function buildReferralInvitationTaskTitle(recipientName: string) {
  const firstName = getReferralInvitationFirstName(recipientName) || recipientName;
  return `${firstName}: vote on the 1% Treaty`;
}

export function buildReferralInvitationTaskDescription(recipientName: string) {
  const firstName = getReferralInvitationFirstName(recipientName) || recipientName;
  return [
    `${firstName} was invited to vote on the 1% Treaty.`,
    "The task is complete when their verified vote converts the invitation.",
  ].join("\n\n");
}

export function buildReferralInvitationTaskCompletionMessage(recipientName: string) {
  return `${recipientName} voted on the 1% Treaty. This referral task is now verified.`;
}

export async function createReferralInvitationTask(input: {
  endpoint: { instructions: string; url: string };
  inviteToken: string;
  creatorUserId: string;
  parentTaskId?: string | null;
  recipientName: string;
  recipientPersonId?: string | null;
  referendumSlug: string;
},
db: Prisma.TransactionClient | typeof prisma = prisma,
): Promise<string> {
  const firstName =
    getReferralInvitationFirstName(input.recipientName) || input.recipientName;

  const result = await fireTaskTrigger(
    "referral:vote-invitation",
    buildTriggerContext({
      user: { id: input.creatorUserId },
      recipient: {
        firstName,
        displayName: input.recipientName,
        personId: input.recipientPersonId ?? null,
      },
      inviteToken: input.inviteToken,
      referendumSlug: input.referendumSlug,
      parentTaskId: input.parentTaskId ?? null,
      actionLink: {
        url: input.endpoint.url,
        instructions: input.endpoint.instructions,
      },
    }),
    { actorUserId: input.creatorUserId, db },
  );

  if (result.result === "filteredOut" || result.result === "failed") {
    throw new Error(
      `referral:vote-invitation trigger did not run (${result.result}: ${result.reason ?? result.error ?? "unknown"}). Did managed data sync run? Try: pnpm db:sync:managed-data -- --apply`,
    );
  }

  const parent = result.spawnedSpecs.find((s) => s.isParent);
  if (!parent) {
    throw new Error(
      "referral:vote-invitation trigger has no parent spec. Re-run pnpm db:sync:managed-data -- --apply.",
    );
  }

  // Patch the few fields the trigger framework doesn't model first-class.
  await db.task.update({
    where: { id: parent.taskId },
    data: {
      assigneeAffiliationSnapshot: input.recipientName,
      contextJson: {
        inviteToken: input.inviteToken,
        kind: "referral_invitation",
        referendumSlug: input.referendumSlug,
      } satisfies Prisma.InputJsonObject,
    },
  });

  return parent.taskId;
}

export async function verifyReferralInvitationTask(
  client: ReferralInvitationTaskClient,
  input: {
    invitationId: string;
    recipientName: string;
    taskId: string;
    verifiedAt: Date;
    verifiedByUserId: string;
  },
): Promise<{ commentId: string | null; message: string | null; verified: boolean }> {
  const updated = await client.task.updateMany({
    where: {
      id: input.taskId,
      deletedAt: null,
      status: { not: TaskStatus.VERIFIED },
    },
    data: {
      actualEffortSeconds: 30,
      completedAt: input.verifiedAt,
      completionEvidence:
        `${input.recipientName} verified a vote through referral invitation ${input.invitationId}.`,
      status: TaskStatus.VERIFIED,
      verifiedAt: input.verifiedAt,
      verifiedByUserId: input.verifiedByUserId,
    },
  });

  if (updated.count === 0) {
    return { commentId: null, message: null, verified: false };
  }

  const message = buildReferralInvitationTaskCompletionMessage(input.recipientName);
  const comment = await client.taskComment.create({
    data: {
      authorUserId: input.verifiedByUserId,
      kind: TaskCommentKind.STATUS_UPDATE,
      message,
      source: TaskCommentSource.SYSTEM,
      taskId: input.taskId,
    },
    select: { id: true },
  });

  return { commentId: comment.id, message, verified: true };
}
