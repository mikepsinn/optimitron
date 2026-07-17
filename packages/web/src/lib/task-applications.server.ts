import { Prisma } from "@optimitron/db";
import {
  OrganizationMemberRole,
  TaskApplicationEventType,
  TaskApplicationStatus,
} from "@optimitron/db/enums";
import { prisma } from "@/lib/prisma";
import { canUserViewTask } from "@/lib/tasks/task-visibility.server";

export const applicationSelect = {
  id: true,
  status: true,
  applicationMessage: true,
  answersJson: true,
  applicantNameSnapshot: true,
  applicantEmailSnapshot: true,
  reviewScore: true,
  reviewNote: true,
  appliedAt: true,
  reviewedAt: true,
  offeredAt: true,
  acceptedAt: true,
  rejectedAt: true,
  createdAt: true,
  updatedAt: true,
  applicantUser: {
    select: {
      id: true,
      email: true,
      person: {
        select: {
          id: true,
          handle: true,
          displayName: true,
          image: true,
        },
      },
    },
  },
  applicantPerson: {
    select: {
      id: true,
      handle: true,
      displayName: true,
      email: true,
      image: true,
    },
  },
  reviewerUser: {
    select: {
      id: true,
      email: true,
      person: {
        select: {
          displayName: true,
        },
      },
    },
  },
} satisfies Prisma.TaskApplicationSelect;

export type TaskApplicationRow = Prisma.TaskApplicationGetPayload<{
  select: typeof applicationSelect;
}>;

export async function getTaskApplications(
  taskId: string,
): Promise<TaskApplicationRow[]> {
  return prisma.taskApplication.findMany({
    where: { taskId, deletedAt: null },
    select: applicationSelect,
    orderBy: { appliedAt: "asc" },
  });
}

export async function getTaskApplication(
  appId: string,
): Promise<TaskApplicationRow | null> {
  return prisma.taskApplication.findUnique({
    where: { id: appId },
    select: applicationSelect,
  });
}

const REVIEWER_ORGANIZATION_ROLES = [
  OrganizationMemberRole.OWNER,
  OrganizationMemberRole.ADMIN,
] as const;
const REVIEWER_TASK_MANAGER_ROLES = ["owner", "manager", "reviewer"] as const;

export async function canReviewTaskApplications(
  userId: string,
  taskId: string,
): Promise<boolean> {
  const [task, user] = await Promise.all([
    prisma.task.findUnique({
      where: { id: taskId },
      select: {
        assigneeOrganizationId: true,
        createdByUserId: true,
        deletedAt: true,
        ownerOrganizationId: true,
      },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { isAdmin: true },
    }),
  ]);

  if (!task || task.deletedAt) return false;
  if (user?.isAdmin || task.createdByUserId === userId) return true;

  const taskManager = await prisma.taskManager.findFirst({
    where: {
      deletedAt: null,
      role: { in: [...REVIEWER_TASK_MANAGER_ROLES] },
      taskId,
      userId,
    },
    select: { role: true },
  });
  if (taskManager) return true;

  const reviewerOrganizationIds = [
    task.ownerOrganizationId,
    task.assigneeOrganizationId,
  ].filter((id): id is string => Boolean(id));
  const uniqueReviewerOrganizationIds = [...new Set(reviewerOrganizationIds)];

  if (uniqueReviewerOrganizationIds.length === 0) return false;

  const membership = await prisma.organizationMember.findFirst({
    where: {
      organizationId: {
        in: uniqueReviewerOrganizationIds,
      },
      role: { in: [...REVIEWER_ORGANIZATION_ROLES] },
      userId,
    },
    select: { role: true },
  });

  return Boolean(membership);
}

export async function assertCanReviewTaskApplications(
  userId: string,
  taskId: string,
): Promise<void> {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { id: true, deletedAt: true },
  });

  if (!task || task.deletedAt) {
    throw new Error("Task not found");
  }

  if (!(await canReviewTaskApplications(userId, taskId))) {
    // A private task the caller can't even view must stay indistinguishable
    // from a missing one — same predicate as /tasks/[id].
    if (!(await canUserViewTask(taskId, userId))) {
      throw new Error("Task not found");
    }
    throw new Error("Forbidden");
  }
}

export interface ApplicationUpdateInput {
  status?: TaskApplicationStatus;
  reviewScore?: number | null;
  reviewNote?: string | null;
  answersJson?: Record<string, unknown> | null;
  reviewerUserId?: string;
}

export async function updateTaskApplication(
  appId: string,
  data: ApplicationUpdateInput,
): Promise<TaskApplicationRow> {
  const now = new Date();

  return prisma.$transaction(async (tx) => {
    const existing = await tx.taskApplication.findUnique({
      where: { id: appId },
      select: {
        answersJson: true,
        deletedAt: true,
        jurisdictionId: true,
        reviewNote: true,
        reviewScore: true,
        reviewedAt: true,
        offeredAt: true,
        acceptedAt: true,
        rejectedAt: true,
        withdrawnAt: true,
        status: true,
      },
    });

    if (!existing || existing.deletedAt) {
      throw new Error("Application not found");
    }

    const updateData: Prisma.TaskApplicationUpdateInput = {
      updatedAt: now,
    };

    if (data.reviewerUserId !== undefined) {
      updateData.reviewerUser = { connect: { id: data.reviewerUserId } };
    }
    if (data.status !== undefined) {
      updateData.status = data.status;
      if (
        data.status === TaskApplicationStatus.UNDER_REVIEW &&
        !existing.reviewedAt
      ) {
        updateData.reviewedAt = now;
      }
      if (data.status === TaskApplicationStatus.OFFERED && !existing.offeredAt) {
        updateData.offeredAt = now;
      }
      if (
        data.status === TaskApplicationStatus.ACCEPTED &&
        !existing.acceptedAt
      ) {
        updateData.acceptedAt = now;
      }
      if (
        data.status === TaskApplicationStatus.REJECTED &&
        !existing.rejectedAt
      ) {
        updateData.rejectedAt = now;
      }
      if (
        data.status === TaskApplicationStatus.WITHDRAWN &&
        !existing.withdrawnAt
      ) {
        updateData.withdrawnAt = now;
      }
    }
    if (data.reviewScore !== undefined) {
      updateData.reviewScore = data.reviewScore;
      if (!existing.reviewedAt) updateData.reviewedAt = now;
    }
    if (data.reviewNote !== undefined) {
      updateData.reviewNote = data.reviewNote;
      if (!existing.reviewedAt) updateData.reviewedAt = now;
    }
    if (data.answersJson !== undefined) {
      updateData.answersJson =
        data.answersJson === null
          ? Prisma.JsonNull
          : (data.answersJson as Prisma.InputJsonValue);
      if (!existing.reviewedAt) updateData.reviewedAt = now;
    }

    const updated = await tx.taskApplication.update({
      where: { id: appId },
      data: updateData,
      select: applicationSelect,
    });

    const statusChanged =
      data.status !== undefined && data.status !== existing.status;
    const reviewChanged =
      data.reviewScore !== undefined ||
      data.reviewNote !== undefined ||
      data.answersJson !== undefined;

    if (statusChanged || reviewChanged) {
      await tx.taskApplicationEvent.create({
        data: {
          actorUserId: data.reviewerUserId ?? null,
          applicationId: appId,
          beforeJson: {
            answersJson: existing.answersJson ?? null,
            reviewNote: existing.reviewNote,
            reviewScore: existing.reviewScore,
            status: existing.status,
          } as Prisma.InputJsonValue,
          afterJson: {
            answersJson: updated.answersJson ?? null,
            reviewNote: updated.reviewNote,
            reviewScore: updated.reviewScore,
            status: updated.status,
          } as Prisma.InputJsonValue,
          eventType: statusChanged
            ? TaskApplicationEventType.STATUS_CHANGED
            : TaskApplicationEventType.REVIEWED,
          fromStatus: statusChanged ? existing.status : null,
          jurisdictionId: existing.jurisdictionId,
          note: data.reviewNote ?? null,
          toStatus: statusChanged ? data.status ?? null : null,
        },
      });
    }

    return updated;
  });
}
