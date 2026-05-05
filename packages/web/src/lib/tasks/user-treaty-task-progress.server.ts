import { TaskCommentKind, TaskCommentSource, TaskStatus } from "@optimitron/db";
import type { Prisma, PrismaClient } from "@optimitron/db";
import { prisma } from "@/lib/prisma";
import { buildTriggerContext, fireTaskTriggersForEvent } from "@/lib/triggers";
import {
  ensureUserTreatyTask,
  getUserTreatySubtaskKey,
} from "@/lib/tasks/user-treaty-task.server";

type UserTreatyTaskProgressClient = Prisma.TransactionClient | typeof prisma;

async function fireVerifiedSubtaskEvent(
  db: UserTreatyTaskProgressClient,
  input: {
    kind:
      | "assignFirstHuman"
      | "assignSecondHuman"
      | "phoneScript"
      | "shareReferralUrl"
      | "signTreatyPersonally";
    userId: string;
  },
) {
  await fireTaskTriggersForEvent(
    "task.statusChanged.VERIFIED",
    buildTriggerContext({
      user: { id: input.userId },
      task: { taskKey: getUserTreatySubtaskKey(input.userId, input.kind) },
    }),
    { actorUserId: input.userId, db },
  );
}

/**
 * Verify the user's `signTreatyPersonally` HMT subtask. Trust-the-user:
 * called when the dashboard records that they clicked through to
 * `1percenttreaty.org/treaty` to publicly sign. There's no callback from
 * 1percenttreaty.org back to us (yet — it's a future signature webhook),
 * so we mirror the `phoneScript` pattern: the user attests by clicking,
 * we mark the subtask done, the gate evaluates, completeTraining
 * auto-VERIFIES once all five siblings are green.
 *
 * Idempotent — repeat calls after the task is already VERIFIED no-op
 * because the updateMany filters on `status: { not: VERIFIED }`.
 */
export async function markUserTreatyPersonalSignComplete(
  input: {
    now?: Date;
    personId?: string | null;
    userId: string;
  },
  db: UserTreatyTaskProgressClient = prisma,
): Promise<boolean> {
  const now = input.now ?? new Date();
  const treatyTask = await ensureUserTreatyTask(
    {
      now,
      personId: input.personId ?? null,
      userId: input.userId,
    },
    db,
  );
  const signTaskId = treatyTask.subtaskIds.signTreatyPersonally;

  const updated = await db.task.updateMany({
    where: {
      deletedAt: null,
      createdByUserId: input.userId,
      id: signTaskId,
      status: { not: TaskStatus.VERIFIED },
    },
    data: {
      actualEffortSeconds: 30,
      completedAt: now,
      completionEvidence:
        "User reported publicly signing the 1% Treaty at 1percenttreaty.org.",
      status: TaskStatus.VERIFIED,
      verifiedAt: now,
      verifiedByUserId: input.userId,
    },
  });

  if (updated.count === 0) return false;

  await db.taskComment.create({
    data: {
      authorUserId: input.userId,
      kind: TaskCommentKind.STATUS_UPDATE,
      message: "Signed the 1% Treaty publicly.",
      source: TaskCommentSource.WEB,
      taskId: signTaskId,
    },
  });

  await fireVerifiedSubtaskEvent(db, {
    kind: "signTreatyPersonally",
    userId: input.userId,
  });
  return true;
}

export async function markUserTreatyReferralShareComplete(
  input: {
    channel?: string | null;
    now?: Date;
    personId?: string | null;
    taskId?: string | null;
    userId: string;
  },
  db: UserTreatyTaskProgressClient = prisma,
): Promise<boolean> {
  const now = input.now ?? new Date();
  const treatyTask = await ensureUserTreatyTask(
    {
      now,
      personId: input.personId ?? null,
      userId: input.userId,
    },
    db,
  );
  const shareTaskId = treatyTask.subtaskIds.shareReferralUrl;
  if (input.taskId && input.taskId !== shareTaskId) return false;

  const updated = await db.task.updateMany({
    where: {
      deletedAt: null,
      createdByUserId: input.userId,
      id: shareTaskId,
      status: { not: TaskStatus.VERIFIED },
    },
    data: {
      actualEffortSeconds: 30,
      completedAt: now,
      completionEvidence: `Shared the 1% Treaty referral URL via ${input.channel ?? "training"}.`,
      status: TaskStatus.VERIFIED,
      verifiedAt: now,
      verifiedByUserId: input.userId,
    },
  });

  if (updated.count === 0) return false;

  await db.taskComment.create({
    data: {
      authorUserId: input.userId,
      kind: TaskCommentKind.STATUS_UPDATE,
      message: `Shared the 1% Treaty referral URL via ${input.channel ?? "training"}.`,
      source: TaskCommentSource.WEB,
      taskId: shareTaskId,
    },
  });

  await fireVerifiedSubtaskEvent(db, {
    kind: "shareReferralUrl",
    userId: input.userId,
  });
  return true;
}

export async function markUserTreatyPhoneCallComplete(
  input: {
    invitationId: string;
    now?: Date;
    personId?: string | null;
    recipientName: string;
    userId: string;
  },
  db: UserTreatyTaskProgressClient = prisma,
): Promise<boolean> {
  const now = input.now ?? new Date();
  const treatyTask = await ensureUserTreatyTask(
    {
      now,
      personId: input.personId ?? null,
      userId: input.userId,
    },
    db,
  );
  const phoneTaskId = treatyTask.subtaskIds.phoneScript;

  const updated = await db.task.updateMany({
    where: {
      deletedAt: null,
      createdByUserId: input.userId,
      id: phoneTaskId,
      status: { not: TaskStatus.VERIFIED },
    },
    data: {
      actualEffortSeconds: 10 * 60,
      completedAt: now,
      completionEvidence: `Called ${input.recipientName} through referral invitation ${input.invitationId}.`,
      status: TaskStatus.VERIFIED,
      verifiedAt: now,
      verifiedByUserId: input.userId,
    },
  });

  if (updated.count === 0) return false;

  await db.taskComment.create({
    data: {
      authorUserId: input.userId,
      kind: TaskCommentKind.STATUS_UPDATE,
      message: `Called ${input.recipientName}. Phone-call training task verified for referral invitation ${input.invitationId}.`,
      source: TaskCommentSource.WEB,
      taskId: phoneTaskId,
    },
  });

  await fireVerifiedSubtaskEvent(db, {
    kind: "phoneScript",
    userId: input.userId,
  });
  return true;
}

export async function markNextHumanAssignmentSubtaskComplete(
  input: {
    invitationId: string;
    now?: Date;
    personId?: string | null;
    recipientName: string;
    userId: string;
  },
  db: UserTreatyTaskProgressClient = prisma,
): Promise<boolean> {
  const now = input.now ?? new Date();
  const treatyTask = await ensureUserTreatyTask(
    {
      now,
      personId: input.personId ?? null,
      userId: input.userId,
    },
    db,
  );
  const assignmentTaskIds = [
    treatyTask.subtaskIds.assignFirstHuman,
    treatyTask.subtaskIds.assignSecondHuman,
  ];

  const existingProgress = await db.taskComment.findFirst({
    where: {
      deletedAt: null,
      message: { contains: input.invitationId },
      taskId: { in: assignmentTaskIds },
    },
    select: { id: true },
  });
  if (existingProgress) return false;

  const tasks = await db.task.findMany({
    where: {
      deletedAt: null,
      createdByUserId: input.userId,
      id: { in: assignmentTaskIds },
    },
    select: { id: true, status: true },
  });
  const byId = new Map(tasks.map((task) => [task.id, task]));
  const targetTask = assignmentTaskIds
    .map((id) => byId.get(id))
    .find((task) => task && task.status !== TaskStatus.VERIFIED);

  if (!targetTask) return false;

  const updated = await db.task.updateMany({
    where: {
      deletedAt: null,
      createdByUserId: input.userId,
      id: targetTask.id,
      status: { not: TaskStatus.VERIFIED },
    },
    data: {
      actualEffortSeconds: 5 * 60,
      completedAt: now,
      completionEvidence: `${input.recipientName} was given the treaty voting task through referral invitation ${input.invitationId}.`,
      status: TaskStatus.VERIFIED,
      verifiedAt: now,
      verifiedByUserId: input.userId,
    },
  });

  if (updated.count === 0) return false;

  await db.taskComment.create({
    data: {
      authorUserId: input.userId,
      kind: TaskCommentKind.STATUS_UPDATE,
      message: `Gave ${input.recipientName} the treaty voting task through referral invitation ${input.invitationId}.`,
      source: TaskCommentSource.WEB,
      taskId: targetTask.id,
    },
  });

  const subtaskKind =
    targetTask.id === treatyTask.subtaskIds.assignFirstHuman
      ? ("assignFirstHuman" as const)
      : ("assignSecondHuman" as const);
  await fireVerifiedSubtaskEvent(db, {
    kind: subtaskKind,
    userId: input.userId,
  });
  return true;
}
