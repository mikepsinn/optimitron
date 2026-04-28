import {
  TaskCategory,
  TaskClaimPolicy,
  TaskCommentKind,
  TaskCommentSource,
  TaskDifficulty,
  TaskStatus,
} from "@optimitron/db";
import type { Prisma, PrismaClient } from "@optimitron/db";
import { prisma } from "@/lib/prisma";
import { ROUTES } from "@/lib/routes";
import { TREATY_PARENT_TASK_KEY } from "@/lib/tasks/task-keys";

const USER_TREATY_TASK_KEY_PREFIX = "program:one-percent-treaty:user";
const USER_TREATY_TASK_DUE_DAYS = 7;

const WISHONIA_WELCOME_COMMENT = [
  "Welcome. I'm Wishonia.",
  "",
  "On Earth, 60 million humans die every year, mostly from things we already know how to fix. The 1% Treaty redirects 1% of military spending into pragmatic clinical trials. It would prevent ~10.7 billion deaths over the coming century, divided across a majority of humans on Earth.",
  "",
  "Your job: get your network to vote on it. Each person you invite becomes a subtask under this one. When they vote, the subtask completes.",
  "",
  "It's almost like treating people like humans works better. Weird.",
].join("\n");

export function getUserTreatyTaskKey(userId: string) {
  return `${USER_TREATY_TASK_KEY_PREFIX}:${userId}`;
}

function buildUserTreatyTaskDescription() {
  return [
    "8 billion humans are waiting for treatments that already work. The 1% Treaty redirects 1% of military spending into pragmatic clinical trials.",
    "Your job: get the rest of humanity to vote on it. One person at a time, 30 seconds at a time.",
    "",
    `Send invitations: ${ROUTES.send}`,
    `See your dashboard: ${ROUTES.dashboard}`,
    "",
    "Each invitation you send becomes a subtask under this one. When the invitee votes, the subtask completes. When this task is complete, your share of humanity is voting.",
  ].join("\n");
}

type UserTreatyTaskClient =
  | Pick<PrismaClient, "task" | "taskComment">
  | Pick<Prisma.TransactionClient, "task" | "taskComment">;

export interface EnsureUserTreatyTaskResult {
  created: boolean;
  taskId: string;
}

export async function ensureUserTreatyTask(
  input: {
    now?: Date;
    personId: string | null;
    userId: string;
  },
  db: UserTreatyTaskClient = prisma,
): Promise<EnsureUserTreatyTaskResult> {
  const taskKey = getUserTreatyTaskKey(input.userId);
  const existing = await db.task.findUnique({
    where: { taskKey },
    select: { deletedAt: true, id: true },
  });

  if (existing && !existing.deletedAt) {
    return { created: false, taskId: existing.id };
  }

  const parent = await db.task.findUnique({
    where: { taskKey: TREATY_PARENT_TASK_KEY },
    select: { id: true },
  });

  const now = input.now ?? new Date();
  const dueAt = new Date(
    now.getTime() + USER_TREATY_TASK_DUE_DAYS * 24 * 60 * 60 * 1000,
  );

  if (existing && existing.deletedAt) {
    const restored = await db.task.update({
      where: { id: existing.id },
      data: {
        deletedAt: null,
        dueAt,
        status: TaskStatus.ACTIVE,
      },
      select: { id: true },
    });
    return { created: false, taskId: restored.id };
  }

  const created = await db.task.create({
    data: {
      assigneePersonId: input.personId,
      category: TaskCategory.OUTREACH,
      claimPolicy: TaskClaimPolicy.ASSIGNED_ONLY,
      contextJson: {
        kind: "user_treaty",
        userId: input.userId,
      } satisfies Prisma.InputJsonObject,
      description: buildUserTreatyTaskDescription(),
      difficulty: TaskDifficulty.TRIVIAL,
      dueAt,
      estimatedEffortHours: 0.5,
      interestTags: ["one-percent-treaty", "war-on-disease"],
      isPublic: false,
      ownerUserId: input.userId,
      parentTaskId: parent?.id ?? null,
      roleTitle: "Treaty network promoter",
      skillTags: ["voting", "outreach"],
      status: TaskStatus.ACTIVE,
      taskKey,
      title: "Get the rest of humanity to vote on the 1% Treaty",
    },
    select: { id: true },
  });

  return { created: true, taskId: created.id };
}

export const WISHONIA_AUTHOR_NAME = "Wishonia";

export function buildWishoniaWelcomeComment() {
  return {
    authorNameOverride: WISHONIA_AUTHOR_NAME,
    kind: TaskCommentKind.COMMENT,
    message: WISHONIA_WELCOME_COMMENT,
    source: TaskCommentSource.SYSTEM,
  };
}
