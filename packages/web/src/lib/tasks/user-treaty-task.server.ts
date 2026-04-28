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
export const USER_TREATY_TASK_TITLE =
  "Get 4 billion people to vote on the 1% Treaty";
export const HUMANITY_MANAGEMENT_TRAINING_TASK_TITLE =
  "Complete Humanity Management Training";
const USER_TREATY_TASK_ROLE_TITLE =
  "Humanity Manager, Earth Optimization Services, LLC";

export type UserTreatySubtaskKind =
  | "completeTraining"
  | "shareReferralUrl"
  | "assignFirstHuman"
  | "assignSecondHuman";

export type UserTreatySubtaskIds = Record<UserTreatySubtaskKind, string>;
export type UserTreatySubtaskStatuses = Record<UserTreatySubtaskKind, TaskStatus>;

const USER_TREATY_SUBTASKS: Array<{
  kind: UserTreatySubtaskKind;
  title: string;
  description: string;
  estimatedEffortHours: number;
  sortOrder: number;
}> = [
  {
    kind: "shareReferralUrl",
    title: "Share your 1% Treaty referral URL",
    description:
      "Copy or post your referral URL so anyone who votes through it is attributed to your treaty-vote lineage.",
    estimatedEffortHours: 0.02,
    sortOrder: 0,
  },
  {
    kind: "assignFirstHuman",
    title: "Give your first human the 1% Treaty voting task",
    description:
      "Create one named invitation and actually contact that person with their voting task. If they vote, they get promoted too.",
    estimatedEffortHours: 0.1,
    sortOrder: 10,
  },
  {
    kind: "assignSecondHuman",
    title: "Give your second human the 1% Treaty voting task",
    description:
      "Create a second named invitation and actually contact that person with their voting task. If they vote, they get promoted too.",
    estimatedEffortHours: 0.1,
    sortOrder: 20,
  },
  {
    kind: "completeTraining",
    title: HUMANITY_MANAGEMENT_TRAINING_TASK_TITLE,
    description:
      "Finish the launch sequence: share your referral URL, give two named humans their voting tasks, and let the referral graph trace what happens next.",
    estimatedEffortHours: 0.25,
    sortOrder: 30,
  },
];

const WISHONIA_WELCOME_COMMENT = [
  "Welcome. I'm Wishonia.",
  "",
  "On Earth, 60 million humans die every year, mostly from things we already know how to fix. The 1% Treaty redirects 1% of military spending into pragmatic clinical trials. It would prevent ~10.7 billion deaths over the coming century, divided across a majority of humans on Earth.",
  "",
  "Your Humanity Management objective: get 4 billion people to vote on the 1% Treaty. Start small: share your referral URL, then give two humans their voting tasks.",
  "",
  "Each named invitation becomes your local follow-up task. When that human votes, the task completes. Their own training tree belongs to them; the referral graph keeps the lineage.",
  "",
  "It's almost like treating people like humans works better. Weird.",
].join("\n");

export function getUserTreatyTaskKey(userId: string) {
  return `${USER_TREATY_TASK_KEY_PREFIX}:${userId}`;
}

export function getUserTreatySubtaskKey(
  userId: string,
  kind: UserTreatySubtaskKind,
) {
  return `${getUserTreatyTaskKey(userId)}:${kind}`;
}

function buildUserTreatyTaskDescription() {
  return [
    "Humanity Management objective for the 1% Treaty.",
    "North star: get 4 billion people to vote on the treaty without turning the task tree into an infinite pyramid of confusion.",
    "",
    "This task owns your local next actions. The viral lineage is traced through referral, invitation, share-attempt, and vote records.",
    "",
    `Send invitations: ${ROUTES.send}`,
    `See your dashboard: ${ROUTES.dashboard}`,
  ].join("\n");
}

function buildUserTreatyTaskMaintenanceData(dueAt?: Date) {
  return {
    ...(dueAt ? { dueAt } : {}),
    description: buildUserTreatyTaskDescription(),
    roleTitle: USER_TREATY_TASK_ROLE_TITLE,
    title: USER_TREATY_TASK_TITLE,
  };
}

type UserTreatyTaskClient =
  | Pick<PrismaClient, "task" | "taskComment">
  | Pick<Prisma.TransactionClient, "task" | "taskComment">;

export interface EnsureUserTreatyTaskResult {
  created: boolean;
  taskId: string;
  subtaskIds: UserTreatySubtaskIds;
  subtaskStatuses: UserTreatySubtaskStatuses;
}

async function ensureUserTreatySubtask(
  db: UserTreatyTaskClient,
  input: {
    def: (typeof USER_TREATY_SUBTASKS)[number];
    dueAt: Date;
    parentTaskId: string;
    personId: string | null;
    userId: string;
  },
): Promise<{ id: string; status: TaskStatus }> {
  const taskKey = getUserTreatySubtaskKey(input.userId, input.def.kind);
  const existing = await db.task.findUnique({
    where: { taskKey },
    select: { deletedAt: true, id: true, status: true },
  });

  const data = {
    ...(input.personId ? { assigneePersonId: input.personId } : {}),
    category: TaskCategory.OUTREACH,
    claimPolicy: TaskClaimPolicy.ASSIGNED_ONLY,
    contextJson: {
      kind: "user_treaty_subtask",
      subtaskKind: input.def.kind,
      userId: input.userId,
    } satisfies Prisma.InputJsonObject,
    description: input.def.description,
    difficulty: TaskDifficulty.TRIVIAL,
    dueAt: input.dueAt,
    estimatedEffortHours: input.def.estimatedEffortHours,
    interestTags: ["one-percent-treaty", "war-on-disease"],
    isPublic: false,
    ownerUserId: input.userId,
    parentTaskId: input.parentTaskId,
    roleTitle: USER_TREATY_TASK_ROLE_TITLE,
    skillTags: ["voting", "outreach"],
    sortOrder: input.def.sortOrder,
    taskKey,
    title: input.def.title,
  };

  if (existing && !existing.deletedAt) {
    const updated = await db.task.update({
      where: { id: existing.id },
      data,
      select: { id: true, status: true },
    });
    return updated;
  }

  if (existing && existing.deletedAt) {
    const restored = await db.task.update({
      where: { id: existing.id },
      data: {
        ...data,
        deletedAt: null,
        status: TaskStatus.ACTIVE,
      },
      select: { id: true, status: true },
    });
    return restored;
  }

  const created = await db.task.create({
    data: {
      ...data,
      assigneePersonId: input.personId,
      status: TaskStatus.ACTIVE,
    },
    select: { id: true, status: true },
  });
  return created;
}

async function ensureUserTreatySubtasks(
  db: UserTreatyTaskClient,
  input: {
    dueAt: Date;
    parentTaskId: string;
    personId: string | null;
    userId: string;
  },
): Promise<Pick<EnsureUserTreatyTaskResult, "subtaskIds" | "subtaskStatuses">> {
  const idEntries: Array<readonly [UserTreatySubtaskKind, string]> = [];
  const statusEntries: Array<readonly [UserTreatySubtaskKind, TaskStatus]> = [];
  for (const def of USER_TREATY_SUBTASKS) {
    const subtask = await ensureUserTreatySubtask(db, { ...input, def });
    idEntries.push([def.kind, subtask.id] as const);
    statusEntries.push([def.kind, subtask.status] as const);
  }

  return {
    subtaskIds: Object.fromEntries(idEntries) as UserTreatySubtaskIds,
    subtaskStatuses: Object.fromEntries(statusEntries) as UserTreatySubtaskStatuses,
  };
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
  const now = input.now ?? new Date();
  const dueAt = new Date(
    now.getTime() + USER_TREATY_TASK_DUE_DAYS * 24 * 60 * 60 * 1000,
  );
  const existing = await db.task.findUnique({
    where: { taskKey },
    select: { deletedAt: true, id: true },
  });

  if (existing && !existing.deletedAt) {
    await db.task.update({
      where: { id: existing.id },
      data: buildUserTreatyTaskMaintenanceData(),
      select: { id: true },
    });
    const subtasks = await ensureUserTreatySubtasks(db, {
      dueAt,
      parentTaskId: existing.id,
      personId: input.personId,
      userId: input.userId,
    });
    return { created: false, taskId: existing.id, ...subtasks };
  }

  const parent = await db.task.findUnique({
    where: { taskKey: TREATY_PARENT_TASK_KEY },
    select: { id: true },
  });

  if (existing && existing.deletedAt) {
    const restored = await db.task.update({
      where: { id: existing.id },
      data: {
        ...buildUserTreatyTaskMaintenanceData(dueAt),
        deletedAt: null,
        status: TaskStatus.ACTIVE,
      },
      select: { id: true },
    });
    const subtasks = await ensureUserTreatySubtasks(db, {
      dueAt,
      parentTaskId: restored.id,
      personId: input.personId,
      userId: input.userId,
    });
    return { created: false, taskId: restored.id, ...subtasks };
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
      roleTitle: USER_TREATY_TASK_ROLE_TITLE,
      skillTags: ["voting", "outreach"],
      status: TaskStatus.ACTIVE,
      taskKey,
      title: USER_TREATY_TASK_TITLE,
    },
    select: { id: true },
  });

  const subtasks = await ensureUserTreatySubtasks(db, {
    dueAt,
    parentTaskId: created.id,
    personId: input.personId,
    userId: input.userId,
  });

  return { created: true, taskId: created.id, ...subtasks };
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
