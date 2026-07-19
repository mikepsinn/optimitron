import {
  OrganizationMemberRole,
  TaskCategory,
  TaskClaimPolicy,
  TaskStatus,
  type Prisma,
} from "@optimitron/db";
import {
  getOrganizationPlanningRootTaskKey,
  getPersonPlanningRootTaskKey,
  OPTIMIZE_EARTH_ROOT_TASK_ID,
} from "@optimitron/db/task-keys";
import type { prisma } from "../prisma";

// Accepts the plain client or a transaction client so org creation can build
// the planning root inside its own transaction (person.server DbClient pattern).
type PlanningDbClient = Prisma.TransactionClient | typeof prisma;

// Thrown when the managed task sync has not seeded the optimize-earth root.
// Callers that must not fail on an unseeded database (org creation) catch
// this specifically; the lazy ensure path repairs the branch later.
export class MissingOptimizeEarthRootError extends Error {
  constructor() {
    super(
      "Optimize Earth root is missing. Run managed task sync before proposing planning tasks.",
    );
    this.name = "MissingOptimizeEarthRootError";
  }
}

// Thrown when the caller may not plan for the requested organization (not an
// OWNER/ADMIN/MEMBER). Callers that can fall back to a personal branch catch
// this specifically rather than swallowing every error.
export class OrganizationPlanningAccessError extends Error {
  constructor() {
    super("Organization planning requires OWNER, ADMIN, or MEMBER access.");
    this.name = "OrganizationPlanningAccessError";
  }
}

function asObject(value: unknown) {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

export async function ensureExecutionPlanningBranch(input: {
  organizationId?: string | null;
  personId?: string | null;
  prisma: PlanningDbClient;
  userId: string;
}) {
  const root = await input.prisma.task.findFirst({
    where: {
      deletedAt: null,
      id: OPTIMIZE_EARTH_ROOT_TASK_ID,
    },
    select: { id: true },
  });
  if (!root) {
    throw new MissingOptimizeEarthRootError();
  }

  const organizationId = input.organizationId;
  const target = organizationId
    ? await (async () => {
        const organization = await input.prisma.organization.findFirst({
          where: {
            deletedAt: null,
            id: organizationId,
            members: {
              some: {
                role: {
                  in: [
                    OrganizationMemberRole.OWNER,
                    OrganizationMemberRole.ADMIN,
                    OrganizationMemberRole.MEMBER,
                  ],
                },
                userId: input.userId,
              },
            },
          },
          select: { id: true, name: true },
        });
        if (!organization) {
          throw new OrganizationPlanningAccessError();
        }
        return {
          description: `Private work root for ${organization.name}.`,
          organizationId: organization.id,
          personId: null,
          taskKey: getOrganizationPlanningRootTaskKey(organization.id),
          title: `Optimize ${organization.name}`,
        };
      })()
    : await (async () => {
        const { ensurePersonForUser } = await import("../person.server");
        const person = await ensurePersonForUser(
          input.userId,
          {},
          input.prisma,
        );
        if (input.personId && input.personId !== person.id) {
          throw new Error("Personal planning root must belong to the caller.");
        }
        return {
          description: `Private work root for ${person.displayName}.`,
          organizationId: null,
          personId: person.id,
          taskKey: getPersonPlanningRootTaskKey(person.id),
          title: `Optimize ${person.displayName}'s life`,
        };
      })();

  const taskKey = target.taskKey;

  const branchSelect = {
    assigneeOrganizationId: true,
    assigneePersonId: true,
    createdByUserId: true,
    id: true,
    isPublic: true,
    ownerOrganizationId: true,
    parentTaskId: true,
    taskKey: true,
  } as const;
  const validateAndRepairBranch = async (branch: {
    assigneeOrganizationId: string | null;
    assigneePersonId: string | null;
    createdByUserId: string;
    id: string;
    isPublic: boolean;
    ownerOrganizationId: string | null;
    parentTaskId: string | null;
    taskKey: string | null;
  }) => {
    const matchesTarget = target.organizationId
      ? branch.assigneeOrganizationId === target.organizationId ||
        branch.ownerOrganizationId === target.organizationId
      : branch.assigneePersonId === target.personId &&
        branch.createdByUserId === input.userId;
    if (branch.parentTaskId !== root.id || branch.isPublic || !matchesTarget) {
      throw new Error(
        `Reserved execution planning branch ${taskKey} is not private, rooted, and assigned to the expected target.`,
      );
    }
    return input.prisma.task.update({
      where: { id: branch.id },
      data: {
        assigneeOrganizationId: null,
        assigneePersonId: target.personId,
        claimPolicy: TaskClaimPolicy.ASSIGNED_ONLY,
        deletedAt: null,
        description: target.description,
        isPublic: false,
        ownerOrganizationId: target.organizationId,
        parentTaskId: root.id,
        status: TaskStatus.ACTIVE,
        title: target.title,
      },
      select: { id: true, taskKey: true, title: true },
    });
  };
  const existing = await input.prisma.task.findFirst({
    where: { deletedAt: null, taskKey },
    select: branchSelect,
  });
  if (existing) return validateAndRepairBranch(existing);

  try {
    return await input.prisma.task.create({
      data: {
        assigneeOrganizationId: null,
        assigneePersonId: target.personId,
        category: TaskCategory.OTHER,
        claimPolicy: TaskClaimPolicy.ASSIGNED_ONLY,
        createdByUserId: input.userId,
        description: target.description,
        isPublic: false,
        ownerOrganizationId: target.organizationId,
        parentTaskId: root.id,
        status: TaskStatus.ACTIVE,
        taskKey,
        title: target.title,
      },
      select: { id: true, taskKey: true, title: true },
    });
  } catch (error) {
    // Concurrency on the unique taskKey: another request created the branch
    // between our findFirst and create. Note this recovery cannot run inside
    // an open Postgres transaction (the P2002 aborts it) — in-tx callers only
    // create branches for brand-new targets whose key cannot preexist.
    if (asObject(error)?.code !== "P2002") throw error;
    const racedBranch = await input.prisma.task.findFirst({
      where: { deletedAt: null, taskKey },
      select: branchSelect,
    });
    if (racedBranch) return validateAndRepairBranch(racedBranch);
    throw error;
  }
}
