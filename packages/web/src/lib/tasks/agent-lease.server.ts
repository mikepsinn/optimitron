import { TaskStatus, type Prisma } from "@optimitron/db";
import { prisma } from "@/lib/prisma";

/** Default lease duration: 10 minutes. */
const DEFAULT_LEASE_SECONDS = 600;

async function lockActiveTask(tx: Prisma.TransactionClient, taskId: string) {
  const [task] = await tx.$queryRaw<Array<{ status: TaskStatus }>>`
    SELECT "status"
    FROM "Task"
    WHERE "id" = ${taskId} AND "deletedAt" IS NULL
    FOR UPDATE
  `;
  if (!task) throw new Error("Task not found.");
  if (task.status !== TaskStatus.ACTIVE) {
    throw new Error("Task is not active.");
  }
}

/**
 * Acquire a short-lived lease on a task. Prevents multiple agents from
 * working the same task simultaneously. This is separate from TaskClaim,
 * which handles human work-completion semantics.
 *
 * Expired leases are automatically cleaned up on acquire.
 */
export async function acquireLease(
  taskId: string,
  agentId: string,
  leaseSeconds = DEFAULT_LEASE_SECONDS,
) {
  return prisma.$transaction(async (tx) => {
    // Serialize with task completion and competing acquisitions; the locked
    // row carries the current lifecycle state.
    await lockActiveTask(tx, taskId);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + leaseSeconds * 1000);

    // Release any expired leases on this task
    await tx.agentTaskLease.updateMany({
      where: {
        taskId,
        released: false,
        expiresAt: { lt: now },
      },
      data: {
        released: true,
        releasedAt: now,
      },
    });

    // Check for active leases held by other agents
    const activeLease = await tx.agentTaskLease.findFirst({
      where: {
        taskId,
        released: false,
        expiresAt: { gte: now },
        agentId: { not: agentId },
      },
      select: { agentId: true, expiresAt: true },
    });

    if (activeLease) {
      throw new Error(
        `Task is leased by agent "${activeLease.agentId}" until ${activeLease.expiresAt.toISOString()}.`,
      );
    }

    // Upsert: renew if this agent already has a lease, else create
    return tx.agentTaskLease.upsert({
      where: { taskId_agentId: { taskId, agentId } },
      update: {
        expiresAt,
        lastHeartbeatAt: now,
        released: false,
        releasedAt: null,
      },
      create: {
        agentId,
        expiresAt,
        lastHeartbeatAt: now,
        taskId,
      },
    });
  });
}

/**
 * Extend an active lease. Throws if the lease expired or doesn't exist.
 */
export async function heartbeatLease(
  taskId: string,
  agentId: string,
  leaseSeconds = DEFAULT_LEASE_SECONDS,
) {
  return prisma.$transaction(async (tx) => {
    await lockActiveTask(tx, taskId);
    const now = new Date();
    const lease = await tx.agentTaskLease.findUnique({
      where: { taskId_agentId: { taskId, agentId } },
      select: { id: true, expiresAt: true, released: true },
    });

    if (!lease || lease.released) {
      throw new Error("No active lease found. Acquire a new lease.");
    }
    if (lease.expiresAt < now) {
      throw new Error("Lease has expired. Acquire a new lease.");
    }

    return tx.agentTaskLease.update({
      where: { id: lease.id },
      data: {
        expiresAt: new Date(now.getTime() + leaseSeconds * 1000),
        lastHeartbeatAt: now,
      },
    });
  });
}

/**
 * Voluntarily release a lease so another agent can pick up the task.
 */
export async function releaseLease(taskId: string, agentId: string) {
  const lease = await prisma.agentTaskLease.findUnique({
    where: { taskId_agentId: { taskId, agentId } },
    select: { id: true, released: true },
  });

  if (!lease) {
    throw new Error("No lease found for this task/agent.");
  }
  if (lease.released) {
    return lease;
  }

  return prisma.agentTaskLease.update({
    where: { id: lease.id },
    data: {
      released: true,
      releasedAt: new Date(),
    },
  });
}

/**
 * Check whether a task has an active (non-expired, non-released) lease.
 */
export async function isTaskLeased(taskId: string) {
  const now = new Date();
  const activeLease = await prisma.agentTaskLease.findFirst({
    where: {
      taskId,
      released: false,
      expiresAt: { gte: now },
    },
    select: { agentId: true, expiresAt: true },
  });

  return activeLease
    ? {
        leased: true as const,
        agentId: activeLease.agentId,
        expiresAt: activeLease.expiresAt,
      }
    : { leased: false as const };
}
