import {
  TaskCategory,
  TaskClaimPolicy,
  TaskDifficulty,
  TaskStatus,
  type Prisma,
} from "@optimitron/db";
import { prisma } from "@/lib/prisma";
import { getWishoniaUserId } from "@/lib/wishonia.server";
import {
  TREATY_DUE_AT,
} from "./treaty-signer-network";
import {
  TREATY_PARENT_TASK_ID,
  TREATY_PARENT_TASK_KEY,
  TREATY_PARENT_TASK_TITLE,
  TREATY_SIGNER_TASK_KEY_PREFIX,
} from "./task-keys";

type DbClient = Prisma.TransactionClient | typeof prisma;

export async function ensureTreatyParentTask(
  input: {
    createdByUserId?: string | null;
    jurisdictionId?: string | null;
  },
  db: DbClient = prisma,
) {
  const createdByUserId = input.createdByUserId?.trim() || await getWishoniaUserId();

  return db.task.upsert({
    where: {
      taskKey: TREATY_PARENT_TASK_KEY,
    },
    update: {
      category: TaskCategory.GOVERNANCE,
      claimPolicy: TaskClaimPolicy.ASSIGNED_ONLY,
      description:
        "Coordinate signature and ratification of the 1% Treaty across national leaders, then keep public pressure on every outstanding signer until the treaty is real.",
      difficulty: TaskDifficulty.EXPERT,
      dueAt: TREATY_DUE_AT,
      interestTags: ["treaty", "disease-eradication", "peace-dividend"],
      isPublic: true,
      jurisdictionId: input.jurisdictionId ?? null,
      skillTags: ["organizing", "diplomacy", "public-pressure"],
      sortOrder: -100,
      status: TaskStatus.ACTIVE,
      title: TREATY_PARENT_TASK_TITLE,
    },
    create: {
      id: TREATY_PARENT_TASK_ID,
      category: TaskCategory.GOVERNANCE,
      claimPolicy: TaskClaimPolicy.ASSIGNED_ONLY,
      createdByUserId,
      description:
        "Coordinate signature and ratification of the 1% Treaty across national leaders, then keep public pressure on every outstanding signer until the treaty is real.",
      difficulty: TaskDifficulty.EXPERT,
      dueAt: TREATY_DUE_AT,
      interestTags: ["treaty", "disease-eradication", "peace-dividend"],
      isPublic: true,
      jurisdictionId: input.jurisdictionId ?? null,
      skillTags: ["organizing", "diplomacy", "public-pressure"],
      sortOrder: -100,
      status: TaskStatus.ACTIVE,
      taskKey: TREATY_PARENT_TASK_KEY,
      title: TREATY_PARENT_TASK_TITLE,
    },
    select: {
      id: true,
      taskKey: true,
      title: true,
    },
  });
}

export async function softDeleteMissingTreatySignerNetworkTasks(
  liveTaskKeys: string[],
  db: DbClient = prisma,
) {
  return db.task.updateMany({
    where: {
      deletedAt: null,
      taskKey: {
        notIn: liveTaskKeys,
        startsWith: `${TREATY_SIGNER_TASK_KEY_PREFIX}:`,
      },
    },
    data: {
      deletedAt: new Date(),
    },
  });
}
