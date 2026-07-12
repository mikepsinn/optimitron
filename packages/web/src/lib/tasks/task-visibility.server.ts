/**
 * Task visibility predicate shared by every surface that reads a task or its
 * children (comments, activity, votes, applications). This is THE access rule
 * for /tasks/[id] — moved here verbatim from tasks.server.ts so API routes and
 * MCP handlers can reuse it without importing the whole tasks module. Do not
 * write a second predicate; extend this one.
 */

import type { Prisma, TaskStatus } from "@optimitron/db";
import { prisma } from "@/lib/prisma";

/** Error message API routes map to HTTP 404. Private tasks throw the same
 * message as missing ones so they stay indistinguishable. */
export const TASK_NOT_FOUND_MESSAGE = "Task not found";

export function getTaskVisibilityWhere(input?: {
  assigneeOrganizationId?: string | null;
  assigneePersonId?: string | null;
  personId?: string | null;
  status?: TaskStatus | null;
  targetOrganizationId?: string | null;
  taskId?: string | null;
  userId?: string | null;
  visibility?: "public" | "created" | "accessible" | "personal" | "target";
}): Prisma.TaskWhereInput {
  const baseWhere: Prisma.TaskWhereInput = {
    assigneeOrganizationId: input?.assigneeOrganizationId ?? undefined,
    assigneePersonId: input?.assigneePersonId ?? undefined,
    deletedAt: null,
    id: input?.taskId ?? undefined,
    status: input?.status ?? undefined,
    ...(input?.targetOrganizationId
      ? {
          OR: [
            { assigneeOrganizationId: input.targetOrganizationId },
            { ownerOrganizationId: input.targetOrganizationId },
          ],
        }
      : {}),
  };

  const visibility = input?.visibility ?? "public";
  if (visibility === "target") {
    return baseWhere;
  }
  if (visibility === "created") {
    if (!input?.userId) {
      return {
        ...baseWhere,
        createdByUserId: "__unreachable__",
      };
    }

    return {
      ...baseWhere,
      createdByUserId: input.userId,
    };
  }

  // "personal" = anything I created OR anything assigned to my Person.
  // Used by the MCP getMyQueue / getNextAction / getQueueAudit handlers
  // so trigger-spawned tasks (assignee = me, creator = system) surface
  // alongside tasks I authored myself.
  if (visibility === "personal") {
    if (!input?.userId) {
      return { ...baseWhere, createdByUserId: "__unreachable__" };
    }
    const ors: Prisma.TaskWhereInput[] = [{ createdByUserId: input.userId }];
    if (input.personId) {
      ors.push({ assigneePersonId: input.personId });
    }
    return { ...baseWhere, OR: ors };
  }

  if (visibility === "accessible" && input?.userId) {
    // A task is "accessible" to a signed-in viewer if it is public, the
    // viewer created it, OR it is assigned to the viewer's Person. The last
    // clause matters for private trigger-spawned tasks (assignee = me,
    // creator = system) so they don't 404 when their assignee clicks them
    // from /tasks "Your Tasks" → /tasks/[id].
    const ors: Prisma.TaskWhereInput[] = [
      { isPublic: true },
      { createdByUserId: input.userId },
    ];
    if (input.personId) {
      ors.push({ assigneePersonId: input.personId });
    }
    return { ...baseWhere, OR: ors };
  }

  return {
    ...baseWhere,
    isPublic: true,
  };
}

/**
 * True when the viewer can see the task — the same "accessible" predicate
 * /tasks/[id] uses (public, creator, or assignee Person), plus an admin
 * override. Missing/deleted tasks return false so callers 404 uniformly.
 */
export async function canUserViewTask(
  taskId: string,
  userId?: string | null,
): Promise<boolean> {
  const normalizedTaskId = typeof taskId === "string" ? taskId.trim() : "";
  if (!normalizedTaskId) {
    return false;
  }

  const viewer = userId
    ? await prisma.user.findUnique({
        where: { id: userId },
        select: { isAdmin: true, personId: true },
      })
    : null;

  if (viewer?.isAdmin) {
    const existing = await prisma.task.findFirst({
      where: { id: normalizedTaskId, deletedAt: null },
      select: { id: true },
    });
    return existing != null;
  }

  const task = await prisma.task.findFirst({
    where: getTaskVisibilityWhere({
      taskId: normalizedTaskId,
      userId: userId ?? undefined,
      personId: viewer?.personId ?? null,
      visibility: "accessible",
    }),
    select: { id: true },
  });
  return task != null;
}

/** Throw the 404-mapped error unless the viewer can see the task. */
export async function assertUserCanViewTask(
  taskId: string,
  userId?: string | null,
): Promise<void> {
  if (!(await canUserViewTask(taskId, userId))) {
    throw new Error(TASK_NOT_FOUND_MESSAGE);
  }
}
