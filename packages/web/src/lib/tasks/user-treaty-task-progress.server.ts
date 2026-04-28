import { TaskCommentKind, TaskCommentSource, TaskStatus } from "@optimitron/db";
import type { Prisma, PrismaClient } from "@optimitron/db";
import { prisma } from "@/lib/prisma";
import {
  ensureUserTreatyTask,
  getUserTreatySubtaskKey,
  type UserTreatySubtaskKind,
} from "@/lib/tasks/user-treaty-task.server";

type UserTreatyTaskProgressClient =
  | Pick<PrismaClient, "task" | "taskComment">
  | Pick<Prisma.TransactionClient, "task" | "taskComment">;

const TRAINING_COMPLETION_REQUIRED_SUBTASKS: UserTreatySubtaskKind[] = [
  "shareReferralUrl",
  "assignFirstHuman",
  "assignSecondHuman",
];

const TRAINING_SUBTASKS: UserTreatySubtaskKind[] = [
  ...TRAINING_COMPLETION_REQUIRED_SUBTASKS,
  "completeTraining",
];

async function refreshHumanityManagementTrainingCompletion(
  db: UserTreatyTaskProgressClient,
  input: { now: Date; userId: string },
) {
  const keys = TRAINING_SUBTASKS.map((kind) =>
    getUserTreatySubtaskKey(input.userId, kind),
  );
  const subtasks = await db.task.findMany({
    where: {
      deletedAt: null,
      ownerUserId: input.userId,
      taskKey: { in: keys },
    },
    select: { id: true, status: true, taskKey: true },
  });

  const byKind = new Map<UserTreatySubtaskKind, (typeof subtasks)[number]>();
  for (const task of subtasks) {
    const kind = TRAINING_SUBTASKS.find(
      (candidate) =>
        getUserTreatySubtaskKey(input.userId, candidate) === task.taskKey,
    );
    if (kind) byKind.set(kind, task);
  }

  const completeTask = byKind.get("completeTraining");
  if (!completeTask || completeTask.status === TaskStatus.VERIFIED) return;

  const complete = TRAINING_COMPLETION_REQUIRED_SUBTASKS.every(
    (kind) => byKind.get(kind)?.status === TaskStatus.VERIFIED,
  );

  if (!complete) return;

  const updated = await db.task.updateMany({
    where: {
      deletedAt: null,
      id: completeTask.id,
      ownerUserId: input.userId,
      status: { not: TaskStatus.VERIFIED },
    },
    data: {
      actualEffortSeconds: 15 * 60,
      completedAt: input.now,
      completionEvidence:
        "User shared their referral URL and gave two named humans their 1% Treaty voting tasks.",
      status: TaskStatus.VERIFIED,
      verifiedAt: input.now,
      verifiedByUserId: input.userId,
    },
  });

  if (updated.count > 0) {
    await db.taskComment.create({
      data: {
        authorUserId: input.userId,
        kind: TaskCommentKind.STATUS_UPDATE,
        message:
          "Humanity Management Training complete: referral URL shared and two humans assigned voting tasks.",
        source: TaskCommentSource.WEB,
        taskId: completeTask.id,
      },
    });
  }
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
      id: shareTaskId,
      ownerUserId: input.userId,
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

  if (updated.count > 0) {
    await db.taskComment.create({
      data: {
        authorUserId: input.userId,
        kind: TaskCommentKind.STATUS_UPDATE,
        message: `Shared the 1% Treaty referral URL via ${input.channel ?? "training"}.`,
        source: TaskCommentSource.WEB,
        taskId: shareTaskId,
      },
    });
  }

  await refreshHumanityManagementTrainingCompletion(db, { now, userId: input.userId });
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
      id: { in: assignmentTaskIds },
      ownerUserId: input.userId,
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
      id: targetTask.id,
      ownerUserId: input.userId,
      status: { not: TaskStatus.VERIFIED },
    },
    data: {
      actualEffortSeconds: 5 * 60,
      completedAt: now,
      completionEvidence:
        `${input.recipientName} was given the treaty voting task through referral invitation ${input.invitationId}.`,
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
      message:
        `Gave ${input.recipientName} the treaty voting task through referral invitation ${input.invitationId}.`,
      source: TaskCommentSource.WEB,
      taskId: targetTask.id,
    },
  });

  await refreshHumanityManagementTrainingCompletion(db, { now, userId: input.userId });
  return true;
}
