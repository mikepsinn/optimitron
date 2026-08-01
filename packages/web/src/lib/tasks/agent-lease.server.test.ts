import { TaskClaimPolicy, TaskStatus } from "@optimitron/db";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { completeSelfTask } from "../tasks.server";
import { acquireLease, heartbeatLease } from "./agent-lease.server";

const TEST_PREFIX = "agent_lease_integrity_";

async function cleanup() {
  await prisma.agentTaskLease.deleteMany({
    where: { taskId: { startsWith: TEST_PREFIX } },
  });
  await prisma.task.deleteMany({
    where: { id: { startsWith: TEST_PREFIX } },
  });
  await prisma.user.deleteMany({
    where: { id: { startsWith: TEST_PREFIX } },
  });
}

async function createTask(
  suffix: string,
  status: TaskStatus = TaskStatus.ACTIVE,
) {
  const user = await prisma.user.create({
    data: {
      email: `${TEST_PREFIX}${suffix}@example.test`,
      id: `${TEST_PREFIX}user_${suffix}`,
    },
  });
  const task = await prisma.task.create({
    data: {
      claimPolicy: TaskClaimPolicy.OPEN_SINGLE,
      contextJson: { executorType: "self" },
      createdByUserId: user.id,
      description: "Agent lease lifecycle regression fixture.",
      id: `${TEST_PREFIX}task_${suffix}`,
      isPublic: false,
      status,
      title: `Lease ${suffix}`,
    },
  });
  return { task, user };
}

describe.sequential("agent task lease lifecycle integrity", () => {
  beforeEach(cleanup);
  afterAll(cleanup);

  it("rejects missing and soft-deleted tasks without creating leases", async () => {
    const missingTaskId = `${TEST_PREFIX}task_missing`;
    await expect(acquireLease(missingTaskId, "agent-a")).rejects.toThrow(
      "Task not found.",
    );

    const { task } = await createTask("deleted");
    await prisma.task.update({
      where: { id: task.id },
      data: { deletedAt: new Date("2025-01-01T00:00:00.000Z") },
    });
    await expect(acquireLease(task.id, "agent-a")).rejects.toThrow(
      "Task not found.",
    );

    await expect(
      prisma.agentTaskLease.count({
        where: { taskId: { in: [missingTaskId, task.id] } },
      }),
    ).resolves.toBe(0);
  });

  it.each([TaskStatus.DRAFT, TaskStatus.VERIFIED, TaskStatus.STALE])(
    "rejects a %s task without creating a lease",
    async (status) => {
      const { task } = await createTask(status.toLowerCase(), status);

      await expect(acquireLease(task.id, "agent-a")).rejects.toThrow(
        "Task is not active.",
      );
      await expect(
        prisma.agentTaskLease.count({ where: { taskId: task.id } }),
      ).resolves.toBe(0);
    },
  );

  it("serializes competing acquisitions so only one agent gets the task", async () => {
    const { task } = await createTask("competing_agents");

    const results = await Promise.allSettled([
      acquireLease(task.id, "agent-a", 3_600),
      acquireLease(task.id, "agent-b", 3_600),
    ]);

    expect(
      results.filter((result) => result.status === "fulfilled"),
    ).toHaveLength(1);
    expect(
      results.filter((result) => result.status === "rejected"),
    ).toHaveLength(1);
    await expect(
      prisma.agentTaskLease.count({
        where: { released: false, taskId: task.id },
      }),
    ).resolves.toBe(1);
  });

  it("does not renew a lease after its task stops being active", async () => {
    const { task } = await createTask("heartbeat_completed");
    const lease = await acquireLease(task.id, "agent-a", 3_600);
    await prisma.task.update({
      where: { id: task.id },
      data: { status: TaskStatus.VERIFIED },
    });

    await expect(heartbeatLease(task.id, "agent-a", 7_200)).rejects.toThrow(
      "Task is not active.",
    );
    await expect(
      prisma.agentTaskLease.findUniqueOrThrow({
        where: { id: lease.id },
        select: { expiresAt: true },
      }),
    ).resolves.toEqual({ expiresAt: lease.expiresAt });
  });

  it("never leaves a completed task with an active lease when completion races acquisition", async () => {
    const { task, user } = await createTask("completion_race");

    const results = await Promise.allSettled([
      acquireLease(task.id, "agent-a", 3_600),
      completeSelfTask(task.id, user.id, "Finished the personal task."),
    ]);

    expect(
      results.filter((result) => result.status === "fulfilled"),
    ).toHaveLength(1);
    expect(
      results.filter((result) => result.status === "rejected"),
    ).toHaveLength(1);

    const [persistedTask, activeLeaseCount] = await Promise.all([
      prisma.task.findUniqueOrThrow({
        where: { id: task.id },
        select: { status: true },
      }),
      prisma.agentTaskLease.count({
        where: { released: false, taskId: task.id },
      }),
    ]);
    if (persistedTask.status === TaskStatus.VERIFIED) {
      expect(activeLeaseCount).toBe(0);
    } else {
      expect(persistedTask.status).toBe(TaskStatus.ACTIVE);
      expect(activeLeaseCount).toBe(1);
    }
  });
});
