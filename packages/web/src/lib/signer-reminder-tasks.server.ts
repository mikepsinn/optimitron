/**
 * Signer-reminder subtask helper.
 *
 * When a citizen wants to commit to reminding a specific head of state to sign
 * the 1% Treaty, we spawn a child task on the parent signer task. The child
 * task is owned + assigned to the citizen so it shows up in their personal
 * queue with its own cost-of-delay accounting.
 *
 * The action link points the citizen at a Google search for the leader's
 * official contact. The instructions template is a Wishonia-voice message the
 * citizen copies and sends — with the canonical treaty URL embedded with
 * `?ref=<citizen's referralCode>` so any signer click-through credits the
 * citizen who reminded.
 *
 * Mirrors `referral-invitation-tasks.server.ts` — same upsert/idempotency
 * pattern, same comment-on-verify pattern, same primary-endpoint flow.
 */

import { TaskCommentKind, TaskCommentSource, TaskStatus } from "@optimitron/db";
import type { Prisma, PrismaClient } from "@optimitron/db";
import { prisma } from "@/lib/prisma";
import { TREATY_SIGN_URL } from "@/lib/campaigns/one-percent-treaty";
import { buildTriggerContext, fireTaskTrigger } from "@/lib/triggers";
import { buildSignerReminderTaskKey } from "@/lib/tasks/task-keys";

type SignerReminderTaskClient =
  | Pick<PrismaClient, "task" | "taskComment" | "taskCommunicationEndpoint">
  | Pick<Prisma.TransactionClient, "task" | "taskComment" | "taskCommunicationEndpoint">;

export interface SignerForReminder {
  id: string;
  taskKey: string;
  countryCode: string;
  leaderName: string;
  governmentName: string;
  roleTitle: string | null;
}

export function buildSignerReminderTaskTitle(signer: SignerForReminder) {
  return `Remind ${signer.leaderName} to sign the 1% Treaty`;
}

export function buildSignerReminderOfficeSearchUrl(signer: SignerForReminder) {
  const parts = [
    signer.leaderName,
    signer.roleTitle,
    signer.governmentName,
    "official contact",
  ].filter((value): value is string => typeof value === "string" && value.trim().length > 0);
  return `https://www.google.com/search?q=${encodeURIComponent(parts.join(" "))}`;
}

export function buildSignerReminderInstructions(args: {
  signer: SignerForReminder;
  referralCode: string;
}) {
  const treatyUrlWithRef = `${TREATY_SIGN_URL}?ref=${encodeURIComponent(args.referralCode)}`;
  return [
    `Hi ${args.signer.leaderName}.`,
    "The 1% Treaty redirects 1% of military spending into pragmatic clinical trials.",
    "Sixty million humans die every year, mostly from things we already know how to fix. The current ratio is roughly 604× more on weapons than on testing which medicines work.",
    "It's a thirty-second task: one signature, one wrist movement.",
    `The treaty is here: ${treatyUrlWithRef}`,
  ].join(" ");
}

export function buildSignerReminderConversionMessage(signer: SignerForReminder) {
  return `${signer.leaderName} signed the 1% Treaty after your reminder. Cost-of-delay counter for ${signer.governmentName} stops here.`;
}

export interface UpsertSignerReminderInput {
  creatorUserId: string;
  now?: Date;
  creatorPersonId: string | null;
  referralCode: string;
  signer: SignerForReminder;
}

export interface UpsertSignerReminderResult {
  alreadyExisted: boolean;
  taskId: string;
  taskKey: string;
}

/**
 * Idempotent on (signer.countryCode, creatorUserId).
 *
 * Backed by the `treaty:signer-reminder` TaskTrigger blueprint. Caller
 * pre-computes the action-link URL (Google search for the signer's office)
 * and the message instructions (treaty URL with `?ref=` embedded), then
 * the trigger spawns the task. Special task fields the trigger framework
 * doesn't model (`assigneeAffiliationSnapshot`, `contextJson`) are patched
 * post-spawn here.
 */
export async function upsertSignerReminderTask(
  input: UpsertSignerReminderInput,
): Promise<UpsertSignerReminderResult> {
  const taskKey = buildSignerReminderTaskKey(input.signer.countryCode, input.creatorUserId);

  const result = await fireTaskTrigger(
    "treaty:signer-reminder",
    buildTriggerContext({
      user: { id: input.creatorUserId, referralCode: input.referralCode },
      signer: {
        countryCode: input.signer.countryCode,
        countryCodeLower: input.signer.countryCode.toLowerCase(),
        leaderName: input.signer.leaderName,
        governmentName: input.signer.governmentName,
        roleTitle: input.signer.roleTitle ?? "",
      },
      parentTaskId: input.signer.id,
      actionLink: {
        url: buildSignerReminderOfficeSearchUrl(input.signer),
        instructions: buildSignerReminderInstructions({
          signer: input.signer,
          referralCode: input.referralCode,
        }),
      },
    }),
    { actorUserId: input.creatorUserId },
  );

  if (result.result === "filteredOut" || result.result === "failed") {
    throw new Error(
      `treaty:signer-reminder trigger did not run (${result.result}: ${result.reason ?? result.error ?? "unknown"}). Did the seed run? Try: pnpm db:seed:triggers`,
    );
  }

  const parent = result.spawnedSpecs.find((s) => s.isParent);
  if (!parent) {
    throw new Error(
      "treaty:signer-reminder trigger has no parent spec. Re-run scripts/seed-task-triggers.ts.",
    );
  }

  // Patch special fields the trigger doesn't model first-class.
  await prisma.task.update({
    where: { id: parent.taskId },
    data: {
      assigneeAffiliationSnapshot: input.signer.governmentName,
      assigneePersonId: input.creatorPersonId,
      contextJson: {
        countryCode: input.signer.countryCode,
        kind: "signer_reminder",
        signerTaskId: input.signer.id,
        signerTaskKey: input.signer.taskKey,
      } satisfies Prisma.InputJsonObject,
    },
  });

  return {
    alreadyExisted: !parent.wasCreated,
    taskId: parent.taskId,
    taskKey,
  };
}

/**
 * Marks a citizen's signer-reminder task as VERIFIED when the corresponding
 * head of state actually signs the treaty (via a click-through carrying the
 * citizen's `?ref=`). Mirrors `verifyReferralInvitationTask`.
 */
export async function verifySignerReminderTask(
  client: SignerReminderTaskClient,
  input: {
    now: Date;
    signer: SignerForReminder;
    taskId: string;
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
      actualEffortSeconds: 60 * 5,
      completedAt: input.now,
      completionEvidence: `${input.signer.leaderName} signed the 1% Treaty after your reminder.`,
      status: TaskStatus.VERIFIED,
      verifiedAt: input.now,
      verifiedByUserId: input.verifiedByUserId,
    },
  });

  if (updated.count === 0) {
    return { commentId: null, message: null, verified: false };
  }

  const message = buildSignerReminderConversionMessage(input.signer);
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
