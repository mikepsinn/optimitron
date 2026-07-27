/**
 * Task visibility predicate shared by every surface that reads a task or its
 * children (comments, activity, votes, applications). This is THE access rule
 * for /tasks/[id] — moved here verbatim from tasks.server.ts so API routes and
 * MCP handlers can reuse it without importing the whole tasks module. Do not
 * write a second predicate; extend this one.
 */

import {
  ActivityType,
  OrganizationMemberRole,
  type Prisma,
  type TaskStatus,
} from "@optimitron/db";
import { prisma } from "@/lib/prisma";

/** Error message API routes map to HTTP 404. Private tasks throw the same
 * message as missing ones so they stay indistinguishable. */
export const TASK_NOT_FOUND_MESSAGE = "Task not found";

export type TaskAccessAction =
  | "READ"
  | "READ_INTERNAL"
  | "COMMENT"
  | "EXECUTE"
  | "MANAGE"
  | "VERIFY";

export interface TaskClientAccessBoundary {
  allowPersonalPrivate: boolean;
  /** null is reserved for trusted local clients; remote OAuth grants use IDs. */
  organizationIds: readonly string[] | null;
}

export function isTaskWithinClientAccessBoundary(
  task: { isPublic: boolean; ownerOrganizationId?: string | null },
  boundary: TaskClientAccessBoundary,
) {
  if (task.isPublic) return true;
  if (!task.ownerOrganizationId) return boundary.allowPersonalPrivate;
  return (
    boundary.organizationIds === null ||
    boundary.organizationIds.includes(task.ownerOrganizationId)
  );
}

export function getTaskClientAccessWhere(
  boundary: TaskClientAccessBoundary,
): Prisma.TaskWhereInput {
  const allowed: Prisma.TaskWhereInput[] = [{ isPublic: true }];
  if (boundary.allowPersonalPrivate) {
    allowed.push({ isPublic: false, ownerOrganizationId: null });
  }
  if (boundary.organizationIds === null) {
    allowed.push({ isPublic: false, ownerOrganizationId: { not: null } });
  } else if (boundary.organizationIds.length > 0) {
    allowed.push({
      isPublic: false,
      ownerOrganizationId: { in: [...boundary.organizationIds] },
    });
  }
  return { OR: allowed };
}

const CONTRIBUTOR_ORGANIZATION_ROLES = [
  OrganizationMemberRole.OWNER,
  OrganizationMemberRole.ADMIN,
  OrganizationMemberRole.MEMBER,
] as const;

const MANAGER_ORGANIZATION_ROLES = [
  OrganizationMemberRole.OWNER,
  OrganizationMemberRole.ADMIN,
] as const;

const NON_DOCUMENT_REVIEW_TASK_WHERE: Prisma.TaskWhereInput = {
  OR: [
    { taskKey: null },
    { taskKey: { not: { startsWith: "document-review:" } } },
  ],
};

function excludeDocumentReviews(
  where: Prisma.TaskWhereInput,
): Prisma.TaskWhereInput {
  return { AND: [where, NON_DOCUMENT_REVIEW_TASK_WHERE] };
}

function organizationAccessWhere(
  userId: string,
  roles?: readonly OrganizationMemberRole[],
): Prisma.TaskWhereInput[] {
  const membership = {
    some: {
      ...(roles ? { role: { in: [...roles] } } : {}),
      userId,
    },
  };

  return [
    { ownerOrganization: { members: membership } },
    { assigneeOrganization: { members: membership } },
  ];
}

export function getTaskAccessWhere(input: {
  action: TaskAccessAction;
  personId?: string | null;
  userId?: string | null;
}): Prisma.TaskWhereInput {
  const userId = input.userId?.trim();
  if (!userId) {
    return input.action === "READ"
      ? { isPublic: true }
      : { id: "__unreachable__" };
  }

  const principalWhere: Prisma.TaskWhereInput[] = [
    { createdByUserId: userId },
    {
      managers: {
        some: { deletedAt: null, userId },
      },
    },
  ];
  if (input.personId) {
    principalWhere.push({ assigneePersonId: input.personId });
  }

  if (input.action === "READ" || input.action === "READ_INTERNAL") {
    principalWhere.push(
      ...organizationAccessWhere(userId).map(excludeDocumentReviews),
      ...organizationAccessWhere(userId, MANAGER_ORGANIZATION_ROLES),
    );
    return input.action === "READ"
      ? { OR: [{ isPublic: true }, ...principalWhere] }
      : { OR: principalWhere };
  }

  if (input.action === "COMMENT" || input.action === "EXECUTE") {
    principalWhere.push(
      ...organizationAccessWhere(userId, CONTRIBUTOR_ORGANIZATION_ROLES).map(
        excludeDocumentReviews,
      ),
    );
    if (input.action === "EXECUTE") {
      return {
        AND: [{ OR: principalWhere }, NON_DOCUMENT_REVIEW_TASK_WHERE],
      };
    }
    return input.action === "COMMENT"
      ? {
          OR: [
            { isPublic: true },
            ...principalWhere,
            ...organizationAccessWhere(userId, MANAGER_ORGANIZATION_ROLES),
          ],
        }
      : { OR: principalWhere };
  }

  return {
    OR: [
      { createdByUserId: userId },
      {
        managers: {
          some: { deletedAt: null, userId },
        },
      },
      ...organizationAccessWhere(userId, MANAGER_ORGANIZATION_ROLES),
    ],
  };
}

export function getTaskVisibilityWhere(input?: {
  assigneeOrganizationId?: string | null;
  assigneePersonId?: string | null;
  personId?: string | null;
  status?: TaskStatus | null;
  targetOrganizationId?: string | null;
  taskId?: string | null;
  userId?: string | null;
  visibility?:
    | "public"
    | "created"
    | "accessible"
    | "personal"
    | "target"
    | "private";
}): Prisma.TaskWhereInput {
  const baseWhere: Prisma.TaskWhereInput = {
    assigneeOrganizationId: input?.assigneeOrganizationId ?? undefined,
    assigneePersonId: input?.assigneePersonId ?? undefined,
    deletedAt: null,
    id: input?.taskId ?? undefined,
    status: input?.status ?? undefined,
  };
  const targetWhere: Prisma.TaskWhereInput | null = input?.targetOrganizationId
    ? {
        OR: [
          { assigneeOrganizationId: input.targetOrganizationId },
          { ownerOrganizationId: input.targetOrganizationId },
        ],
      }
    : null;

  const withTarget = (
    accessWhere?: Prisma.TaskWhereInput,
  ): Prisma.TaskWhereInput => {
    if (targetWhere && accessWhere) {
      return { AND: [baseWhere, targetWhere, accessWhere] };
    }
    return {
      ...baseWhere,
      ...(targetWhere ?? {}),
      ...(accessWhere ?? {}),
    };
  };

  const visibility = input?.visibility ?? "public";
  if (visibility === "target") {
    return withTarget();
  }
  if (visibility === "created") {
    if (!input?.userId) {
      return withTarget({ createdByUserId: "__unreachable__" });
    }

    return withTarget({ createdByUserId: input.userId });
  }

  // "personal" = anything I created OR anything assigned to my Person.
  // Used by the MCP getMyQueue / getNextAction / getQueueAudit handlers
  // so trigger-spawned tasks (assignee = me, creator = system) surface
  // alongside tasks I authored myself.
  if (visibility === "personal") {
    if (!input?.userId) {
      return withTarget({ createdByUserId: "__unreachable__" });
    }
    const ors: Prisma.TaskWhereInput[] = [{ createdByUserId: input.userId }];
    if (input.personId) {
      ors.push({ assigneePersonId: input.personId });
    }
    return withTarget({ OR: ors });
  }

  if (
    (visibility === "accessible" || visibility === "private") &&
    input?.userId
  ) {
    // Accessible tasks include public work and private work connected to the
    // viewer by creation, assignment, management, or organization membership.
    // from /tasks "Your Tasks" → /tasks/[id]. "private" narrows the same
    // access predicate to non-public rows only.
    const accessWhere = getTaskAccessWhere({
      action: "READ",
      personId: input.personId,
      userId: input.userId,
    });
    if (visibility === "private") {
      return withTarget({ AND: [accessWhere, { isPublic: false }] });
    }
    return withTarget(accessWhere);
  }
  if (visibility === "private") {
    // Anonymous callers have no private tasks by definition.
    return withTarget({ createdByUserId: "__unreachable__" });
  }

  return withTarget({ isPublic: true });
}

/**
 * True when the viewer can see the task — the same "accessible" predicate
 * /tasks/[id] uses. Platform administrators have no implicit private-work
 * access; break-glass access is separate and audited.
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
        select: { personId: true },
      })
    : null;

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

/**
 * Internal task-thread items are narrower than public task access. They are
 * visible to the task creator or assignee, direct task managers, and members
 * of an owning or assigned organization.
 */
export async function canUserViewInternalTaskContent(
  taskId: string,
  userId?: string | null,
): Promise<boolean> {
  const normalizedTaskId = typeof taskId === "string" ? taskId.trim() : "";
  if (!normalizedTaskId || !userId) return false;

  const viewer = await prisma.user.findUnique({
    where: { id: userId },
    select: { personId: true },
  });
  if (!viewer) return false;

  const task = await prisma.task.findFirst({
    where: {
      deletedAt: null,
      id: normalizedTaskId,
      ...getTaskAccessWhere({
        action: "READ_INTERNAL",
        personId: viewer.personId,
        userId,
      }),
    },
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

async function canUserAccessTask(
  taskId: string,
  userId: string | null | undefined,
  action: Exclude<TaskAccessAction, "READ" | "READ_INTERNAL">,
): Promise<boolean> {
  const normalizedTaskId = typeof taskId === "string" ? taskId.trim() : "";
  if (!normalizedTaskId || !userId) return false;

  const viewer = await prisma.user.findUnique({
    where: { id: userId },
    select: { personId: true },
  });
  if (!viewer) return false;

  const task = await prisma.task.findFirst({
    where: {
      deletedAt: null,
      id: normalizedTaskId,
      ...getTaskAccessWhere({ action, personId: viewer.personId, userId }),
    },
    select: { id: true },
  });
  return task != null;
}

export function canUserCommentOnTask(
  taskId: string,
  userId: string | null | undefined,
) {
  return canUserAccessTask(taskId, userId, "COMMENT");
}

export function canUserExecuteTask(
  taskId: string,
  userId: string | null | undefined,
) {
  return canUserAccessTask(taskId, userId, "EXECUTE");
}

export function canUserManageTask(
  taskId: string,
  userId: string | null | undefined,
) {
  return canUserAccessTask(taskId, userId, "MANAGE");
}

export function canUserVerifyTask(
  taskId: string,
  userId: string | null | undefined,
) {
  return canUserAccessTask(taskId, userId, "VERIFY");
}

export async function authorizeTaskBreakGlassAccess(input: {
  adminUserId: string;
  reason: string;
  taskId: string;
}): Promise<void> {
  const reason = input.reason.trim();
  if (reason.length < 10) {
    throw new Error("Break-glass access requires a specific reason");
  }

  await prisma.$transaction(async (tx) => {
    const [admin, task] = await Promise.all([
      tx.user.findFirst({
        where: { deletedAt: null, id: input.adminUserId, isAdmin: true },
        select: { id: true },
      }),
      tx.task.findFirst({
        where: { deletedAt: null, id: input.taskId },
        select: { id: true, isPublic: true },
      }),
    ]);

    if (!admin) throw new Error("Platform administrator required");
    if (!task) throw new Error(TASK_NOT_FOUND_MESSAGE);

    await tx.activity.create({
      data: {
        description: "Private task break-glass access authorized",
        entityId: task.id,
        entityType: "Task",
        metadata: JSON.stringify({ isPublic: task.isPublic, reason }),
        type: ActivityType.CONTENT_ACCESS_CHANGED,
        userId: admin.id,
      },
    });
  });
}
