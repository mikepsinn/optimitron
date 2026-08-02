import {
  TaskApplicationPolicy,
  TaskCategory,
  TaskClaimPolicy,
  TaskClaimStatus,
  TaskCompensationKind,
  TaskExecutionMode,
  TaskStatus,
} from "@optimitron/db";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { OwnerSendAuthorization } from "@/lib/email/outbound-authorization.server";

const mocks = vi.hoisted(() => ({
  countTaskCommunications: vi.fn(),
  ensureExecutionPlanningBranch: vi.fn(),
  grantWishes: vi.fn(),
  notifyTaskAssigneeOfAssignment: vi.fn(),
  queueTaskPayoutForVerifiedClaim: vi.fn(),
  prisma: {
    taskCreate: vi.fn(),
    taskFindFirst: vi.fn(),
    taskUpdate: vi.fn(),
    taskClaimFindFirst: vi.fn(),
    taskClaimFindUnique: vi.fn(),
    taskClaimFindUniqueOrThrow: vi.fn(),
    taskClaimUpdate: vi.fn(),
    taskFindMany: vi.fn(),
    personFindFirst: vi.fn(),
    transaction: vi.fn(),
    userFindUnique: vi.fn(),
    userFindUniqueOrThrow: vi.fn(),
  },
  tx: {
    queryRaw: vi.fn(),
    taskClaimFindFirst: vi.fn(),
    taskClaimFindUniqueOrThrow: vi.fn(),
    taskClaimUpdate: vi.fn(),
    taskClaimUpdateMany: vi.fn(),
    taskFindUniqueOrThrow: vi.fn(),
    taskFindFirst: vi.fn(),
    taskUpdate: vi.fn(),
    taskUpdateMany: vi.fn(),
    userFindUnique: vi.fn(),
  },
}));

vi.mock("@/lib/person.server", () => ({
  findOrCreatePerson: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: mocks.prisma.transaction,
    taskClaim: {
      findFirst: mocks.prisma.taskClaimFindFirst,
      findUnique: mocks.prisma.taskClaimFindUnique,
      findUniqueOrThrow: mocks.prisma.taskClaimFindUniqueOrThrow,
      update: mocks.prisma.taskClaimUpdate,
    },
    task: {
      create: mocks.prisma.taskCreate,
      findFirst: mocks.prisma.taskFindFirst,
      findMany: mocks.prisma.taskFindMany,
      update: mocks.prisma.taskUpdate,
    },
    person: {
      findFirst: mocks.prisma.personFindFirst,
    },
    user: {
      findUnique: mocks.prisma.userFindUnique,
      findUniqueOrThrow: mocks.prisma.userFindUniqueOrThrow,
    },
  },
}));

vi.mock("@/lib/wishes.server", () => ({
  grantWishes: mocks.grantWishes,
}));

vi.mock("@/lib/tasks/task-assignment-notifications.server", () => ({
  notifyTaskAssigneeOfAssignment: mocks.notifyTaskAssigneeOfAssignment,
}));

vi.mock("@/lib/task-payouts.server", () => ({
  assertUserCanClaimPaidTask: vi.fn(),
  queueTaskPayoutForVerifiedClaim: mocks.queueTaskPayoutForVerifiedClaim,
}));

vi.mock("@/lib/tasks/task-communications.server", () => ({
  countTaskCommunications: mocks.countTaskCommunications,
}));

vi.mock("@/lib/tasks/planning-branch.server", async (importActual) => ({
  ...(await importActual<
    typeof import("@/lib/tasks/planning-branch.server")
  >()),
  ensureExecutionPlanningBranch: mocks.ensureExecutionPlanningBranch,
}));

import {
  abandonTaskClaim,
  canCompleteSelfTask,
  completeSelfTask,
  completeTaskClaim,
  completeTaskForUser,
  createTask,
  deleteTaskCreatedByUser,
  getTaskDetailData,
  getPersonTaskProfileData,
  listTasks,
  searchTasks,
  updateTaskCreatedByUser,
  verifyTask,
} from "../tasks.server";

function createTransactionClient() {
  return {
    $queryRaw: mocks.tx.queryRaw,
    task: {
      findFirst: mocks.tx.taskFindFirst,
      findUniqueOrThrow: mocks.tx.taskFindUniqueOrThrow,
      update: mocks.tx.taskUpdate,
      updateMany: mocks.tx.taskUpdateMany,
    },
    user: { findUnique: mocks.tx.userFindUnique },
    taskClaim: {
      findFirst: mocks.tx.taskClaimFindFirst,
      findUniqueOrThrow: mocks.tx.taskClaimFindUniqueOrThrow,
      update: mocks.tx.taskClaimUpdate,
      updateMany: mocks.tx.taskClaimUpdateMany,
    },
  };
}

function resetAllMocks() {
  mocks.countTaskCommunications.mockReset();
  mocks.ensureExecutionPlanningBranch.mockReset();
  mocks.grantWishes.mockReset();
  mocks.notifyTaskAssigneeOfAssignment.mockReset();
  mocks.queueTaskPayoutForVerifiedClaim.mockReset();

  for (const group of [mocks.prisma, mocks.tx]) {
    for (const mockFn of Object.values(group)) {
      mockFn.mockReset();
    }
  }
}

function lastTaskFindManyArgs() {
  const calls = mocks.prisma.taskFindMany.mock.calls as Array<
    [Record<string, unknown>]
  >;
  return calls.at(-1)?.[0] ?? {};
}

function firstTaskFindManyArgs() {
  const calls = mocks.prisma.taskFindMany.mock.calls as Array<
    [Record<string, unknown>]
  >;
  return calls[0]?.[0] ?? {};
}

function mockTask(overrides: Record<string, unknown> = {}) {
  return {
    _count: { childTasks: 0, executionAttempts: 0 },
    actualCashCostUsd: null,
    actualEffortSeconds: null,
    assigneeAffiliationSnapshot: null,
    assigneeOrganization: null,
    assigneePerson: null,
    category: TaskCategory.OTHER,
    claimPolicy: TaskClaimPolicy.ASSIGNED_ONLY,
    claims: [],
    communicationEndpoints: [],
    completedAt: null,
    completionEvidence: null,
    contextJson: null,
    createdByUserId: "user_creator",
    currentImpactEstimateSet: null,
    description: "Do the task.",
    dueAt: null,
    estimatedEffortHours: null,
    id: "task_1",
    impactStatement: null,
    incomingEdges: [],
    interestTags: [],
    isPublic: true,
    maxClaims: null,
    outgoingEdges: [],
    parentTask: null,
    parentTaskId: null,
    roleTitle: null,
    referralInvitations: [],
    skillTags: [],
    sortOrder: 0,
    sourceArtifacts: [],
    status: TaskStatus.ACTIVE,
    taskKey: null,
    title: "Do the task",
    verifiedAt: null,
    ...overrides,
  };
}

const adaAssignee = {
  countryCode: null,
  currentAffiliation: null,
  displayName: "Ada Lovelace",
  handle: "ada",
  id: "person_ada",
  image: null,
  isPublicFigure: false,
  sourceRef: null,
};

describe("tasks server", () => {
  beforeEach(() => {
    resetAllMocks();
    mocks.ensureExecutionPlanningBranch.mockResolvedValue({
      id: "planner-branch-1",
    });
    mocks.tx.queryRaw.mockResolvedValue([{ id: "task_1" }]);
    mocks.prisma.taskFindMany.mockResolvedValue([]);
    mocks.prisma.userFindUnique.mockResolvedValue({
      isAdmin: true,
      personId: "person_admin",
    });
    mocks.tx.taskFindFirst.mockResolvedValue({
      claimPolicy: TaskClaimPolicy.ASSIGNED_ONLY,
      id: "task_1",
      status: TaskStatus.ACTIVE,
    });
    mocks.prisma.transaction.mockImplementation(
      async (
        callback: (tx: ReturnType<typeof createTransactionClient>) => unknown,
      ) => callback(createTransactionClient()),
    );
  });

  function eligibleSelfTask(overrides: Record<string, unknown> = {}) {
    return {
      agentLeases: [],
      applicationPolicy: TaskApplicationPolicy.CLOSED,
      applications: [],
      assigneeOrganizationId: null,
      assigneePersonId: null,
      childTasks: [],
      claimPolicy: TaskClaimPolicy.OPEN_SINGLE,
      claims: [],
      compensationKind: TaskCompensationKind.UNSPECIFIED,
      compensationCadence: null,
      compensationCurrency: null,
      compensationMaxAmountMinorUnits: null,
      compensationMinAmountMinorUnits: null,
      compensationPaymentRails: [],
      contextJson: { executor_type: "Self" },
      createdByUserId: "user_1",
      executionAttempts: [],
      executionMode: TaskExecutionMode.HUMAN_OR_AGENT,
      id: "task_1",
      incomingEdges: [],
      isPublic: false,
      managers: [],
      ownerOrganizationId: null,
      payouts: [],
      status: TaskStatus.ACTIVE,
      taskKey: null,
      verifiedByUserId: null,
      ...overrides,
    };
  }

  it.each([
    ["unassigned", {}],
    ["unassigned task without executor metadata", { contextJson: null }],
    [
      "legacy unassigned ASSIGNED_ONLY",
      { claimPolicy: TaskClaimPolicy.ASSIGNED_ONLY },
    ],
    [
      "self-assigned",
      {
        assigneePersonId: "person_1",
        claimPolicy: TaskClaimPolicy.ASSIGNED_ONLY,
      },
    ],
    ["volunteer", { compensationKind: TaskCompensationKind.VOLUNTEER }],
  ])(
    "completes an owner-created %s Self task in one call",
    async (_kind, overrides) => {
      mocks.prisma.userFindUnique.mockResolvedValue({ personId: "person_1" });
      mocks.tx.taskFindFirst.mockResolvedValue(eligibleSelfTask(overrides));
      mocks.tx.taskUpdateMany.mockResolvedValue({ count: 1 });
      mocks.tx.taskFindUniqueOrThrow.mockResolvedValue({
        completionEvidence: "Text sent and reply received.",
        id: "task_1",
        status: TaskStatus.VERIFIED,
        verifiedByUserId: "user_1",
      });

      const result = await completeSelfTask(
        "task_1",
        "user_1",
        "Text sent and reply received.",
      );

      expect(mocks.tx.queryRaw).toHaveBeenCalledOnce();
      expect(mocks.tx.taskUpdateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            completionEvidence: "Text sent and reply received.",
            status: TaskStatus.VERIFIED,
            verifiedByUserId: "user_1",
          }),
          where: {
            childTasks: { none: {} },
            id: "task_1",
            status: TaskStatus.ACTIVE,
          },
        }),
      );
      expect(result).toMatchObject({
        alreadyCompleted: false,
        task: { id: "task_1", status: TaskStatus.VERIFIED },
      });
    },
  );

  it.each([
    ["assigned", { assigneePersonId: "person_2" }, "completeTask only works"],
    [
      "OPEN_MANY",
      { claimPolicy: TaskClaimPolicy.OPEN_MANY },
      "completeTask only works",
    ],
    [
      "paid",
      { compensationKind: TaskCompensationKind.BOUNTY },
      "completeTask only works",
    ],
    [
      "compensation metadata",
      { compensationMinAmountMinorUnits: BigInt(1000) },
      "completeTask only works",
    ],
    [
      "agent",
      { contextJson: { executor_type: "AI Agent" } },
      "completeTask only works",
    ],
    [
      "unknown executor",
      { contextJson: { executor_type: "Unknown" } },
      "completeTask only works",
    ],
    [
      "AGENT_ONLY",
      { executionMode: TaskExecutionMode.AGENT_ONLY },
      "completeTask only works",
    ],
    ["actively leased", { agentLeases: [{ id: "lease_1" }] }, "formal work"],
    ["claimed", { claims: [{ id: "claim_1" }] }, "formal work"],
    [
      "previously executed",
      { executionAttempts: [{ id: "attempt_1" }] },
      "formal work",
    ],
    [
      "container with resolved child history",
      { childTasks: [{ id: "child_1" }] },
      "Task is a container",
    ],
    [
      "reserved planning root",
      { taskKey: "planner:person:person_1" },
      "Task is a container",
    ],
  ])(
    "keeps %s work on formal verification",
    async (_kind, overrides, error) => {
      mocks.prisma.userFindUnique.mockResolvedValue({ personId: "person_1" });
      mocks.tx.taskFindFirst.mockResolvedValue(eligibleSelfTask(overrides));

      await expect(
        completeSelfTask("task_1", "user_1", "I say this is done."),
      ).rejects.toThrow(error);
      expect(mocks.tx.taskUpdateMany).not.toHaveBeenCalled();
    },
  );

  it("does not match an assigned task to an actor without a Person", async () => {
    mocks.prisma.userFindUnique.mockResolvedValue({ personId: null });
    mocks.tx.taskFindFirst.mockResolvedValue(
      eligibleSelfTask({
        assigneePersonId: "person_1",
        claimPolicy: TaskClaimPolicy.ASSIGNED_ONLY,
      }),
    );

    await expect(
      completeSelfTask("task_1", "user_1", "I say this is done."),
    ).rejects.toThrow("completeTask only works");
    expect(mocks.tx.taskUpdateMany).not.toHaveBeenCalled();
  });

  it("preserves completion provenance when a completed task is retried", async () => {
    const completedAt = new Date("2026-07-30T18:00:00.000Z");
    mocks.prisma.userFindUnique.mockResolvedValue({ personId: "person_1" });
    mocks.tx.taskFindFirst.mockResolvedValue(
      eligibleSelfTask({
        completedAt,
        completionEvidence: "Original evidence.",
        status: TaskStatus.VERIFIED,
        verifiedAt: completedAt,
        verifiedByUserId: "user_original",
      }),
    );

    await expect(
      completeSelfTask("task_1", "user_1", "Replacement evidence."),
    ).resolves.toEqual({
      alreadyCompleted: true,
      task: {
        completedAt,
        completionEvidence: "Original evidence.",
        id: "task_1",
        status: TaskStatus.VERIFIED,
        verifiedAt: completedAt,
        verifiedByUserId: "user_original",
      },
    });

    expect(mocks.tx.taskUpdateMany).not.toHaveBeenCalled();
    expect(mocks.tx.taskFindUniqueOrThrow).not.toHaveBeenCalled();
  });

  it("completes active claims without overwriting their original start time", async () => {
    const claimedAt = new Date("2026-04-09T18:00:00.000Z");
    mocks.prisma.taskClaimFindUnique.mockResolvedValue({
      claimedAt,
      id: "claim_1",
      startedAt: null,
      status: TaskClaimStatus.CLAIMED,
      task: { status: TaskStatus.ACTIVE },
    });
    mocks.prisma.taskClaimUpdate.mockResolvedValue({
      id: "claim_1",
      status: TaskClaimStatus.COMPLETED,
    });

    await completeTaskClaim("task_1", "user_1", "https://evidence.example");

    expect(mocks.prisma.taskClaimUpdate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        completionEvidence: "https://evidence.example",
        startedAt: claimedAt,
        status: TaskClaimStatus.COMPLETED,
      }),
      where: { id: "claim_1" },
    });
  });

  it("treats completion retries as idempotent", async () => {
    const completedClaim = {
      claimedAt: new Date("2026-04-09T18:00:00.000Z"),
      id: "claim_1",
      startedAt: new Date("2026-04-09T18:05:00.000Z"),
      status: TaskClaimStatus.COMPLETED,
    };
    mocks.prisma.taskClaimFindUnique.mockResolvedValue(completedClaim);

    await expect(
      completeTaskClaim("task_1", "user_1", "same evidence"),
    ).resolves.toEqual(completedClaim);
    expect(mocks.prisma.taskClaimUpdate).not.toHaveBeenCalled();
  });

  it("uses claim completion when the viewer has an active claim", async () => {
    const claimedAt = new Date("2026-04-09T18:00:00.000Z");
    mocks.prisma.taskClaimFindFirst.mockResolvedValue({
      status: TaskClaimStatus.CLAIMED,
    });
    mocks.prisma.taskClaimFindUnique.mockResolvedValue({
      claimedAt,
      id: "claim_1",
      startedAt: null,
      status: TaskClaimStatus.CLAIMED,
      task: { status: TaskStatus.ACTIVE },
    });
    mocks.prisma.taskClaimUpdate.mockResolvedValue({
      id: "claim_1",
      status: TaskClaimStatus.COMPLETED,
    });

    await expect(
      completeTaskForUser("task_1", "user_1", "Finished the requested work."),
    ).resolves.toMatchObject({
      kind: "claim",
      value: { id: "claim_1", status: TaskClaimStatus.COMPLETED },
    });
    expect(mocks.tx.taskFindFirst).not.toHaveBeenCalled();
  });

  it("keeps wrapper retries idempotent after a claim was completed", async () => {
    const completedClaim = {
      claimedAt: new Date("2026-04-09T18:00:00.000Z"),
      id: "claim_1",
      startedAt: new Date("2026-04-09T18:05:00.000Z"),
      status: TaskClaimStatus.COMPLETED,
    };
    mocks.prisma.taskClaimFindFirst.mockResolvedValue({
      status: TaskClaimStatus.COMPLETED,
    });
    mocks.prisma.taskClaimFindUnique.mockResolvedValue(completedClaim);

    await expect(
      completeTaskForUser("task_1", "user_1", "Retry after lost response."),
    ).resolves.toEqual({ kind: "claim", value: completedClaim });
    expect(mocks.tx.taskFindFirst).not.toHaveBeenCalled();
  });

  it("rejects active claim completion after the task is archived", async () => {
    mocks.prisma.taskClaimFindUnique.mockResolvedValue({
      claimedAt: new Date("2026-04-09T18:00:00.000Z"),
      id: "claim_1",
      startedAt: null,
      status: TaskClaimStatus.CLAIMED,
      task: { status: TaskStatus.STALE },
    });

    await expect(
      completeTaskClaim("task_1", "user_1", "Late completion."),
    ).rejects.toThrow("The task is no longer active.");
    expect(mocks.prisma.taskClaimUpdate).not.toHaveBeenCalled();
  });

  it("uses narrow self-completion only when no claim exists", async () => {
    mocks.prisma.taskClaimFindFirst.mockResolvedValue(null);
    mocks.prisma.userFindUnique.mockResolvedValue({ personId: "person_1" });
    mocks.tx.taskFindFirst.mockResolvedValue(eligibleSelfTask());
    mocks.tx.taskUpdateMany.mockResolvedValue({ count: 1 });
    mocks.tx.taskFindUniqueOrThrow.mockResolvedValue({
      id: "task_1",
      status: TaskStatus.VERIFIED,
    });

    await expect(
      completeTaskForUser("task_1", "user_1", "Finished my personal task."),
    ).resolves.toMatchObject({
      kind: "self",
      value: { task: { id: "task_1", status: TaskStatus.VERIFIED } },
    });
    expect(mocks.prisma.taskClaimUpdate).not.toHaveBeenCalled();
  });

  it("does not advertise self-completion for a task with child history", async () => {
    mocks.prisma.userFindUnique.mockResolvedValue({ personId: "person_1" });
    mocks.prisma.taskFindFirst.mockResolvedValue(
      eligibleSelfTask({ childTasks: [{ id: "child_1" }] }),
    );

    await expect(canCompleteSelfTask("task_1", "user_1")).resolves.toBe(false);
  });

  it("rejects non-active claim completion instead of changing workflows", async () => {
    mocks.prisma.taskClaimFindFirst.mockResolvedValue({
      status: TaskClaimStatus.ABANDONED,
    });

    await expect(
      completeTaskForUser("task_1", "user_1", "Trying again."),
    ).rejects.toThrow("Only active claims can be completed.");
    expect(mocks.tx.taskFindFirst).not.toHaveBeenCalled();
  });

  it("releases an active claim without deleting its history", async () => {
    mocks.tx.taskClaimFindFirst.mockResolvedValue({
      abandonedAt: null,
      id: "claim_1",
      status: TaskClaimStatus.IN_PROGRESS,
    });
    mocks.tx.taskClaimUpdateMany.mockResolvedValue({ count: 1 });
    mocks.tx.taskClaimFindUniqueOrThrow.mockResolvedValue({
      abandonedAt: new Date("2026-08-01T12:00:00.000Z"),
      id: "claim_1",
      status: TaskClaimStatus.ABANDONED,
    });

    await expect(abandonTaskClaim("task_1", "user_1")).resolves.toMatchObject({
      id: "claim_1",
      status: TaskClaimStatus.ABANDONED,
    });
    expect(mocks.tx.taskClaimFindFirst).toHaveBeenCalledWith({
      select: { abandonedAt: true, id: true, status: true },
      where: { deletedAt: null, taskId: "task_1", userId: "user_1" },
    });
    expect(mocks.tx.taskClaimUpdateMany).toHaveBeenCalledWith({
      data: expect.objectContaining({ status: TaskClaimStatus.ABANDONED }),
      where: expect.objectContaining({
        deletedAt: null,
        id: "claim_1",
      }),
    });
  });

  it("does not release work already submitted for verification", async () => {
    mocks.tx.taskClaimFindFirst.mockResolvedValue({
      abandonedAt: null,
      id: "claim_1",
      status: TaskClaimStatus.COMPLETED,
    });

    await expect(abandonTaskClaim("task_1", "user_1")).rejects.toThrow(
      "Only active claims can be released.",
    );
    expect(mocks.tx.taskClaimUpdateMany).not.toHaveBeenCalled();
  });

  it.each([
    ["private", false],
    ["public", true],
  ])("allows an admin to soft-delete any %s task", async (label, isPublic) => {
    const taskId = `${label}_task_by_someone_else`;
    mocks.prisma.userFindUnique.mockResolvedValue({
      isAdmin: true,
      personId: "person_admin",
    });
    mocks.prisma.taskFindFirst.mockResolvedValue({ id: taskId, isPublic });
    mocks.prisma.taskUpdate.mockResolvedValue({});

    await expect(
      deleteTaskCreatedByUser(taskId, "admin_user"),
    ).resolves.toEqual({
      deleted: true,
      id: taskId,
    });
    expect(mocks.prisma.taskFindFirst).toHaveBeenCalledWith({
      select: { id: true, isPublic: true },
      where: {
        AND: [],
        deletedAt: null,
        id: taskId,
      },
    });
    expect(mocks.prisma.taskUpdate).toHaveBeenCalledWith({
      data: { deletedAt: expect.any(Date) },
      where: { id: taskId },
    });
  });

  it("keeps ordinary users from deleting public tasks", async () => {
    mocks.prisma.userFindUnique.mockResolvedValue({
      isAdmin: false,
      personId: "person_1",
    });
    mocks.prisma.taskFindFirst.mockResolvedValue({
      id: "public_task",
      isPublic: true,
    });

    await expect(
      deleteTaskCreatedByUser("public_task", "user_1"),
    ).rejects.toThrow("Public tasks can't be self-deleted. Ask an admin.");
    expect(mocks.prisma.taskUpdate).not.toHaveBeenCalled();
  });

  it("rejects claim verification before completion evidence has been submitted", async () => {
    mocks.prisma.userFindUniqueOrThrow.mockResolvedValue({
      id: "admin_1",
      isAdmin: true,
    });
    mocks.tx.taskFindUniqueOrThrow.mockResolvedValue({
      claimPolicy: TaskClaimPolicy.OPEN_SINGLE,
      id: "task_1",
      status: TaskStatus.ACTIVE,
    });
    mocks.tx.taskClaimFindUniqueOrThrow.mockResolvedValue({
      completionEvidence: null,
      id: "claim_1",
      status: TaskClaimStatus.CLAIMED,
      taskId: "task_1",
      userId: "user_1",
    });

    await expect(
      verifyTask("task_1", "admin_1", {
        claimId: "claim_1",
      }),
    ).rejects.toThrow("Claim must be completed before it can be verified.");

    expect(mocks.tx.taskClaimUpdate).not.toHaveBeenCalled();
    expect(mocks.tx.taskUpdate).not.toHaveBeenCalled();
    expect(mocks.grantWishes).not.toHaveBeenCalled();
  });

  it("closes one-off claimable tasks when their completed claim is verified", async () => {
    mocks.tx.taskFindFirst.mockResolvedValue({
      claimPolicy: TaskClaimPolicy.OPEN_SINGLE,
      id: "task_1",
      status: TaskStatus.ACTIVE,
    });
    mocks.tx.taskClaimFindUniqueOrThrow.mockResolvedValue({
      completionEvidence: "Merged pull request 132",
      id: "claim_1",
      status: TaskClaimStatus.COMPLETED,
      taskId: "task_1",
      userId: "user_1",
    });
    mocks.tx.taskClaimUpdate.mockResolvedValue({
      id: "claim_1",
      status: TaskClaimStatus.VERIFIED,
    });
    mocks.tx.taskUpdate.mockResolvedValue({
      id: "task_1",
      status: TaskStatus.VERIFIED,
    });

    await verifyTask("task_1", "admin_1", { claimId: "claim_1" });

    expect(mocks.tx.taskClaimUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: TaskClaimStatus.VERIFIED }),
        where: { id: "claim_1" },
      }),
    );
    expect(mocks.tx.taskUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: TaskStatus.VERIFIED }),
        where: { id: "task_1" },
      }),
    );
  });

  it("keeps multi-contributor tasks open after one claim is verified", async () => {
    mocks.tx.taskFindFirst.mockResolvedValue({
      claimPolicy: TaskClaimPolicy.OPEN_MANY,
      id: "task_1",
      status: TaskStatus.ACTIVE,
    });
    mocks.tx.taskClaimFindUniqueOrThrow.mockResolvedValue({
      completionEvidence: "Translated one page",
      id: "claim_1",
      status: TaskClaimStatus.COMPLETED,
      taskId: "task_1",
      userId: "user_1",
    });
    mocks.tx.taskClaimUpdate.mockResolvedValue({
      id: "claim_1",
      status: TaskClaimStatus.VERIFIED,
    });

    await verifyTask("task_1", "admin_1", { claimId: "claim_1" });

    expect(mocks.tx.taskClaimUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: TaskClaimStatus.VERIFIED }),
      }),
    );
    expect(mocks.tx.taskUpdate).not.toHaveBeenCalled();
  });

  it("listTasks defaults to public-only visibility", async () => {
    await listTasks({ limit: 10, visibility: "public" });

    const args = lastTaskFindManyArgs();
    expect(args).toMatchObject({
      where: expect.objectContaining({
        deletedAt: null,
        isPublic: true,
      }),
      take: 10,
    });
    expect(args.where).not.toHaveProperty("OR");
  });

  it("listTasks accessible visibility only includes public tasks plus the authenticated user's created tasks", async () => {
    await listTasks({ userId: "user-a", visibility: "accessible" });

    const where = lastTaskFindManyArgs().where as {
      OR?: unknown[];
      deletedAt?: unknown;
    };
    expect(where.deletedAt).toBeNull();
    expect(where.OR).toEqual(
      expect.arrayContaining([
        { isPublic: true },
        { createdByUserId: "user-a" },
      ]),
    );
  });

  it("gets only public assigned tasks for a person profile and splits open from verified", async () => {
    mocks.prisma.personFindFirst.mockResolvedValue({
      bio: null,
      countryCode: null,
      currentAffiliation: null,
      displayName: "Ada Lovelace",
      handle: "ada",
      id: "person_ada",
      image: null,
      isPublic: true,
      isPublicFigure: false,
      referendumVotes: [],
      sourceRef: null,
      sourceUrl: null,
      user: null,
    });
    mocks.prisma.taskFindMany.mockResolvedValue([
      mockTask({
        assigneePerson: adaAssignee,
        id: "task_open",
        status: TaskStatus.ACTIVE,
        title: "Open public task",
      }),
      mockTask({
        assigneePerson: adaAssignee,
        id: "task_done",
        status: TaskStatus.VERIFIED,
        title: "Verified public task",
        verifiedAt: new Date("2026-05-01T00:00:00.000Z"),
      }),
    ]);

    const data = await getPersonTaskProfileData("ada", null);

    expect(mocks.prisma.taskFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          assigneePersonId: "person_ada",
          deletedAt: null,
          isPublic: true,
        },
      }),
    );
    expect(data?.openTasks.map((task) => task.id)).toEqual(["task_open"]);
    expect(data?.verifiedTasks.map((task) => task.id)).toEqual(["task_done"]);
  });

  it("does not expose a private person task profile to other viewers", async () => {
    mocks.prisma.personFindFirst.mockResolvedValue({
      bio: null,
      countryCode: null,
      currentAffiliation: null,
      displayName: "Ada Lovelace",
      handle: "ada",
      id: "person_ada",
      image: null,
      isPublic: false,
      isPublicFigure: false,
      referendumVotes: [],
      sourceRef: null,
      sourceUrl: null,
      user: { id: "owner_user", referralCode: "owner" },
    });

    const data = await getPersonTaskProfileData("ada", "other_user");

    expect(data).toBeNull();
    expect(mocks.prisma.taskFindMany).not.toHaveBeenCalled();
  });

  it("lets the owner view their private person task profile", async () => {
    mocks.prisma.personFindFirst.mockResolvedValue({
      bio: null,
      countryCode: null,
      currentAffiliation: null,
      displayName: "Ada Lovelace",
      handle: "ada",
      id: "person_ada",
      image: null,
      isPublic: false,
      isPublicFigure: false,
      referendumVotes: [],
      sourceRef: null,
      sourceUrl: null,
      user: { id: "owner_user", referralCode: "owner" },
    });
    mocks.prisma.taskFindMany.mockResolvedValue([
      mockTask({
        assigneePerson: adaAssignee,
        id: "task_open",
        status: TaskStatus.ACTIVE,
        title: "Open public task",
      }),
    ]);

    const data = await getPersonTaskProfileData("ada", "owner_user");

    expect(data?.person.id).toBe("person_ada");
    expect(data?.openTasks.map((task) => task.id)).toEqual(["task_open"]);
  });

  it("splits person profile tasks into assigned, requested, assigned-by, and receipts", async () => {
    mocks.prisma.personFindFirst.mockResolvedValue({
      bio: null,
      countryCode: null,
      currentAffiliation: null,
      displayName: "Ada Lovelace",
      handle: "ada",
      id: "person_ada",
      image: null,
      isPublic: true,
      isPublicFigure: false,
      referendumVotes: [],
      sourceRef: null,
      sourceUrl: null,
      user: { id: "owner_user", referralCode: "owner" },
    });
    mocks.prisma.taskFindMany.mockResolvedValue([
      mockTask({
        assigneePerson: adaAssignee,
        createdByUserId: "someone_else",
        id: "task_for_ada",
        title: "Call the health minister",
      }),
      mockTask({
        claimPolicy: TaskClaimPolicy.OPEN_SINGLE,
        createdByUserId: "owner_user",
        id: "task_requested",
        title: "Translate the treaty",
      }),
      mockTask({
        assigneePerson: {
          ...adaAssignee,
          displayName: "Grace Hopper",
          handle: "grace",
          id: "person_grace",
        },
        createdByUserId: "owner_user",
        id: "task_assigned_by",
        title: "Brief Grace",
      }),
      mockTask({
        assigneePerson: adaAssignee,
        createdByUserId: "someone_else",
        id: "task_receipt",
        status: TaskStatus.VERIFIED,
        title: "Publish receipt",
      }),
    ]);

    const data = await getPersonTaskProfileData("ada", null);

    expect(mocks.prisma.taskFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          OR: [
            { assigneePersonId: "person_ada" },
            { createdByUserId: "owner_user" },
          ],
          deletedAt: null,
          isPublic: true,
        },
      }),
    );
    expect(data?.openTasks.map((task) => task.id)).toEqual(["task_for_ada"]);
    expect(data?.requestedOpenTasks.map((task) => task.id)).toEqual([
      "task_requested",
    ]);
    expect(data?.assignedByOpenTasks.map((task) => task.id)).toEqual([
      "task_assigned_by",
    ]);
    expect(data?.completedTasks.map((task) => task.id)).toEqual([
      "task_receipt",
    ]);
  });

  it("searchTasks ignores request-framing words and accepts any distinctive term", async () => {
    await searchTasks("find secret grant memo task", { userId: null });

    const args = mocks.prisma.taskFindMany.mock.calls.map(
      (call) => call[0] as { take: number; where: { AND: unknown[] } },
    );
    expect(args).toHaveLength(4);
    for (const [index, term] of ["secret", "grant", "memo"].entries()) {
      expect(args[index]?.where.AND[0]).toEqual(
        expect.objectContaining({ deletedAt: null, isPublic: true }),
      );
      expect(args[index]?.where.AND[1]).toEqual(
        expect.objectContaining({
          OR: expect.arrayContaining([
            { title: { contains: term, mode: "insensitive" } },
          ]),
        }),
      );
      expect(args[index]?.take).toBe(21);
    }
    expect(JSON.stringify(args.slice(0, 3))).not.toContain('"find"');
    expect(JSON.stringify(args.slice(0, 3))).not.toContain('"task"');
  });

  it("finds the reported securities-counsel task from a longer natural query", async () => {
    mocks.prisma.taskFindMany.mockResolvedValue([
      mockTask({
        description: "Have independent counsel review the offering documents.",
        id: "cms0wpz59001b04jwyofp05lw",
        impactStatement: "Verify the EOS equity structure before financing.",
        title: "Get securities counsel to review the EOS equity structure",
      }),
    ]);

    const results = await searchTasks(
      "EOS securities counsel stock purchase agreement lawyer review offering",
      { userId: "user-a" },
    );

    expect(results[0]?.id).toBe("cms0wpz59001b04jwyofp05lw");
  });

  it("uses the bounded fallback to find a misspelled title", async () => {
    mocks.prisma.taskFindMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        mockTask({
          id: "securities-counsel",
          title: "Get securities counsel to review the equity structure",
        }),
      ]);

    const results = await searchTasks("securites counsl", {
      userId: "user-a",
    });

    expect(results[0]?.id).toBe("securities-counsel");
    expect(mocks.prisma.taskFindMany).toHaveBeenCalledTimes(3);
  });

  it.each([
    ["Optimize Optimitron parent", "optimitron:dev"],
    ["estimate calibration guard", "optimitron:dev:estimate-calibration-guard"],
    ["duplicate detection semantic", "optimitron:dev:semantic-dedup"],
  ])(
    "searchTasks ranks the expected task for natural multi-word query %s",
    async (query, expectedTaskKey) => {
      mocks.prisma.taskFindMany.mockResolvedValue([
        mockTask({
          description: "Container for self-improvement development tasks.",
          id: "optimitron-dev",
          taskKey: "optimitron:dev",
          title: "Optimize Optimitron: engineering program",
        }),
        mockTask({
          description: "Reject stale or uncalibrated task estimates.",
          id: "estimate-calibration",
          taskKey: "optimitron:dev:estimate-calibration-guard",
          title: "Add an estimate calibration guard",
        }),
        mockTask({
          description: "Detect semantically similar duplicate tasks.",
          id: "semantic-dedup",
          taskKey: "optimitron:dev:semantic-dedup",
          title: "Build semantic duplicate detection",
        }),
      ]);

      const results = await searchTasks(query, { userId: "user-a" });

      expect(results[0]?.taskKey).toBe(expectedTaskKey);
    },
  );

  it("uses an exact-key fast path and ranks it ahead of stronger prefix matches", async () => {
    mocks.prisma.taskFindFirst.mockResolvedValue(
      mockTask({
        description: "Container for self-improvement development tasks.",
        id: "optimitron-dev",
        taskKey: "optimitron:dev",
        title: "Optimize Optimitron: engineering program",
      }),
    );
    const childTasks = Array.from({ length: 25 }, (_, index) =>
      mockTask({
        description:
          "Build optimitron:dev parent discovery for Optimitron development.",
        id: `dev-child-${index}`,
        taskKey: `optimitron:dev:child-${index}`,
        title: `Optimitron dev development task ${index}`,
      }),
    );
    mocks.prisma.taskFindMany.mockResolvedValue(childTasks);

    const results = await searchTasks("optimitron:dev", {
      limit: 20,
      userId: "user-a",
    });

    expect(results).toHaveLength(20);
    expect(results[0]?.taskKey).toBe("optimitron:dev");
    expect(mocks.prisma.taskFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          AND: expect.arrayContaining([{ taskKey: "optimitron:dev" }]),
        }),
      }),
    );
  });

  it("searchTasks includes every private task the authenticated person can access", async () => {
    await searchTasks("secret grant memo", { userId: "user-a" });

    const args = firstTaskFindManyArgs();
    const [visibility] = (args.where as { AND: unknown[] }).AND as Array<{
      OR?: unknown[];
      deletedAt?: unknown;
    }>;
    expect(visibility?.deletedAt).toBeNull();
    expect(visibility?.OR).toEqual(
      expect.arrayContaining([
        { isPublic: true },
        { createdByUserId: "user-a" },
        { assigneePersonId: "person_admin" },
        {
          claims: {
            some: {
              deletedAt: null,
              status: {
                in: ["CLAIMED", "IN_PROGRESS", "COMPLETED", "VERIFIED"],
              },
              userId: "user-a",
            },
          },
        },
      ]),
    );
    expect(mocks.prisma.userFindUnique).toHaveBeenCalledWith({
      select: { personId: true },
      where: { id: "user-a" },
    });
  });

  it("records the creator on private tasks created by the creator", async () => {
    mocks.prisma.taskCreate.mockResolvedValue({
      createdByUserId: "user_creator",
      id: "task_1",
      title: "Write docs",
    });

    await createTask("user_creator", {
      description: "Write the setup instructions.",
      claimPolicy: TaskClaimPolicy.ASSIGNED_ONLY,
      isPublic: false,
      title: "Write docs",
    });

    expect(mocks.prisma.taskCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          createdByUserId: "user_creator",
          isPublic: false,
        }),
      }),
    );
  });

  it("creates public assigned-only tasks for assignee-targeted work", async () => {
    const ownerAuthorization = {
      kind: "owner",
      userId: "user_creator",
    } as unknown as OwnerSendAuthorization;
    mocks.prisma.taskCreate.mockResolvedValue({
      assigneePersonId: "person_target",
      createdByUserId: "user_creator",
      id: "task_2",
      isPublic: true,
      title: "Fix the site",
    });

    await createTask(
      "user_creator",
      {
        assigneePersonId: "person_target",
        description: "The page should make the next action obvious.",
        title: "Fix the site",
      },
      { ownerAuthorization },
    );

    expect(mocks.prisma.taskCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          assigneePersonId: "person_target",
          claimPolicy: TaskClaimPolicy.ASSIGNED_ONLY,
          createdByUserId: "user_creator",
          isPublic: true,
        }),
      }),
    );
    expect(mocks.notifyTaskAssigneeOfAssignment).toHaveBeenCalledWith({
      ownerAuthorization,
      senderUserId: "user_creator",
      taskId: "task_2",
    });
  });

  it("keeps assigned task creation successful if assignment notification fails", async () => {
    mocks.prisma.taskCreate.mockResolvedValue({
      assigneePersonId: "person_target",
      createdByUserId: "user_creator",
      id: "task_notification_failed",
      isPublic: true,
      title: "Fix the site",
    });
    mocks.notifyTaskAssigneeOfAssignment.mockRejectedValue(
      new Error("notification failed"),
    );

    await expect(
      createTask("user_creator", {
        assigneePersonId: "person_target",
        description: "The page should make the next action obvious.",
        title: "Fix the site",
      }),
    ).resolves.toMatchObject({ id: "task_notification_failed" });

    expect(mocks.notifyTaskAssigneeOfAssignment).toHaveBeenCalledWith({
      senderUserId: "user_creator",
      taskId: "task_notification_failed",
    });
  });

  it("forces assigned tasks to assigned-only even when open claiming is requested", async () => {
    mocks.prisma.taskCreate.mockResolvedValue({
      assigneePersonId: "person_target",
      claimPolicy: TaskClaimPolicy.ASSIGNED_ONLY,
      createdByUserId: "user_creator",
      id: "task_3",
      title: "Review the paper",
    });

    await createTask("user_creator", {
      assigneePersonId: "person_target",
      claimPolicy: TaskClaimPolicy.OPEN_SINGLE,
      title: "Review the paper",
    });

    expect(mocks.prisma.taskCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          assigneePersonId: "person_target",
          claimPolicy: TaskClaimPolicy.ASSIGNED_ONLY,
          // Invited-assignee tasks stay public so the assignee can see and
          // the assignment email links to a reachable page.
          isPublic: true,
          maxClaims: null,
        }),
      }),
    );
    // Public → roots at Optimize Earth, no private planning branch consulted.
    expect(mocks.ensureExecutionPlanningBranch).not.toHaveBeenCalled();
    expect(mocks.notifyTaskAssigneeOfAssignment).toHaveBeenCalledWith({
      senderUserId: "user_creator",
      taskId: "task_3",
    });
  });

  // OPT-TASK-06 regression: a parentless PRIVATE task lands in the creator's
  // private planning branch, never the root.
  it("defaults a parentless private task to OPEN_SINGLE in the creator's planning branch", async () => {
    mocks.ensureExecutionPlanningBranch.mockResolvedValue({
      id: "planner-branch-1",
    });
    mocks.prisma.taskCreate.mockResolvedValue({
      claimPolicy: TaskClaimPolicy.OPEN_SINGLE,
      createdByUserId: "user_creator",
      id: "task_4",
      isPublic: false,
      title: "Private note",
    });

    await createTask("user_creator", {
      isPublic: false,
      title: "Private note",
    });

    expect(mocks.ensureExecutionPlanningBranch).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "user_creator" }),
    );
    expect(mocks.prisma.taskCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          claimPolicy: TaskClaimPolicy.OPEN_SINGLE,
          isPublic: false,
          maxClaims: null,
          parentTaskId: "planner-branch-1",
        }),
      }),
    );
  });

  // A parentless private task assigned to an org lands in the org's branch.
  it("routes a parentless private org-assigned task to the org planning branch", async () => {
    mocks.ensureExecutionPlanningBranch.mockResolvedValue({
      id: "org-branch-1",
    });
    mocks.prisma.taskCreate.mockResolvedValue({
      assigneeOrganizationId: "org_1",
      claimPolicy: TaskClaimPolicy.ASSIGNED_ONLY,
      createdByUserId: "user_creator",
      id: "task_org",
      isPublic: false,
      title: "Org planning note",
    });

    await createTask("user_creator", {
      assigneeOrganizationId: "org_1",
      isPublic: false,
      title: "Org planning note",
    });

    expect(mocks.ensureExecutionPlanningBranch).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: "org_1",
        userId: "user_creator",
      }),
    );
    expect(mocks.prisma.taskCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ parentTaskId: "org-branch-1" }),
      }),
    );
  });

  // A creator who cannot plan for the assigned org falls back to their own
  // branch instead of failing task creation.
  it("falls back to the personal branch when org planning access is denied", async () => {
    const { OrganizationPlanningAccessError } =
      await import("@/lib/tasks/planning-branch.server");
    mocks.ensureExecutionPlanningBranch.mockImplementation(
      async (args: { organizationId?: string }) => {
        if (args.organizationId) throw new OrganizationPlanningAccessError();
        return { id: "personal-branch-1" };
      },
    );
    mocks.prisma.taskCreate.mockResolvedValue({
      claimPolicy: TaskClaimPolicy.ASSIGNED_ONLY,
      createdByUserId: "user_creator",
      id: "task_fb",
      isPublic: false,
      title: "Org note",
    });

    await createTask("user_creator", {
      assigneeOrganizationId: "org_x",
      isPublic: false,
      title: "Org note",
    });

    expect(mocks.prisma.taskCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ parentTaskId: "personal-branch-1" }),
      }),
    );
  });

  // An unexpected branch error must NOT silently mis-parent the task.
  it("propagates an unexpected planning-branch error instead of falling back", async () => {
    mocks.ensureExecutionPlanningBranch.mockImplementation(
      async (args: { organizationId?: string }) => {
        if (args.organizationId) throw new Error("db exploded");
        return { id: "personal-branch-1" };
      },
    );

    await expect(
      createTask("user_creator", {
        assigneeOrganizationId: "org_x",
        isPublic: false,
        title: "Org note",
      }),
    ).rejects.toThrow("db exploded");
    expect(mocks.prisma.taskCreate).not.toHaveBeenCalled();
  });

  // Public parentless tasks (e.g. "ask for help") still root at Optimize Earth
  // until the ranked parent-suggestion matcher ships.
  it("roots a parentless public task at Optimize Earth without a planning branch", async () => {
    mocks.prisma.taskCreate.mockResolvedValue({
      claimPolicy: TaskClaimPolicy.OPEN_SINGLE,
      createdByUserId: "user_creator",
      id: "task_pub",
      isPublic: true,
      title: "Claimable work",
    });

    await createTask("user_creator", {
      title: "Claimable work",
    });

    expect(mocks.ensureExecutionPlanningBranch).not.toHaveBeenCalled();
    expect(mocks.prisma.taskCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          isPublic: true,
          parentTaskId: "optimize-earth",
        }),
      }),
    );
  });

  it("keeps an explicit parent without consulting the planning branch", async () => {
    mocks.prisma.taskCreate.mockResolvedValue({
      claimPolicy: TaskClaimPolicy.ASSIGNED_ONLY,
      createdByUserId: "user_creator",
      id: "task_5",
      isPublic: false,
      title: "Subtask",
    });

    await createTask("user_creator", {
      parentTaskId: "task_parent",
      title: "Subtask",
    });

    expect(mocks.ensureExecutionPlanningBranch).not.toHaveBeenCalled();
    expect(mocks.prisma.taskCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          isPublic: false,
          parentTaskId: "task_parent",
        }),
      }),
    );
  });

  it("blocks creators from unpublishing public tasks", async () => {
    // The eligibility read now happens inside the row-locked transaction
    // (archive-atomicity fix), so it resolves through mocks.tx, and the
    // transaction is entered (then rolled back by the thrown error) instead
    // of never being opened.
    mocks.tx.taskFindFirst.mockResolvedValue({
      claimPolicy: TaskClaimPolicy.OPEN_SINGLE,
      id: "task_public",
      isPublic: true,
    });

    await expect(
      updateTaskCreatedByUser("task_public", "user_creator", {
        isPublic: false,
      }),
    ).rejects.toThrow("Public tasks can't be unpublished. Ask an admin.");

    expect(mocks.tx.taskUpdate).not.toHaveBeenCalled();
  });

  it("does not archive verified work", async () => {
    mocks.tx.taskFindFirst.mockResolvedValue({
      agentLeases: [],
      assigneeOrganizationId: null,
      assigneePersonId: null,
      childTasks: [],
      claimPolicy: TaskClaimPolicy.OPEN_SINGLE,
      claims: [],
      executionAttempts: [],
      id: "task_verified",
      isPublic: false,
      maxClaims: null,
      status: TaskStatus.VERIFIED,
    });

    await expect(
      updateTaskCreatedByUser("task_verified", "user_creator", {
        status: TaskStatus.STALE,
      }),
    ).rejects.toThrow("Only draft or active tasks can be archived.");
    expect(mocks.tx.taskUpdate).not.toHaveBeenCalled();
  });

  it("does not archive a task while work is active", async () => {
    mocks.tx.taskFindFirst.mockResolvedValue({
      agentLeases: [],
      assigneeOrganizationId: null,
      assigneePersonId: null,
      childTasks: [],
      claimPolicy: TaskClaimPolicy.OPEN_SINGLE,
      claims: [{ id: "claim_active" }],
      executionAttempts: [],
      id: "task_active",
      isPublic: false,
      maxClaims: null,
      status: TaskStatus.ACTIVE,
    });

    await expect(
      updateTaskCreatedByUser("task_active", "user_creator", {
        status: TaskStatus.STALE,
      }),
    ).rejects.toThrow("Finish or release active work before archiving");
    expect(mocks.tx.taskUpdate).not.toHaveBeenCalled();
  });

  it("locks the task row before reading archive eligibility, closing the claim-during-archive race", async () => {
    mocks.tx.taskFindFirst.mockResolvedValue({
      agentLeases: [],
      assigneeOrganizationId: null,
      assigneePersonId: null,
      childTasks: [],
      claimPolicy: TaskClaimPolicy.OPEN_SINGLE,
      claims: [],
      executionAttempts: [],
      id: "task_lockable",
      isPublic: false,
      maxClaims: null,
      status: TaskStatus.ACTIVE,
    });
    mocks.tx.taskUpdate.mockResolvedValue({});
    mocks.tx.taskFindUniqueOrThrow.mockResolvedValue(
      mockTask({ id: "task_lockable", status: TaskStatus.STALE }),
    );

    await updateTaskCreatedByUser("task_lockable", "user_creator", {
      status: TaskStatus.STALE,
    });

    expect(mocks.tx.queryRaw).toHaveBeenCalledOnce();
    const lockOrder = mocks.tx.queryRaw.mock.invocationCallOrder[0];
    const readOrder = mocks.tx.taskFindFirst.mock.invocationCallOrder[0];
    expect(lockOrder).toBeLessThan(readOrder);
  });

  describe("getTaskDetailData visibility", () => {
    // Regression for the 404-on-own-task bug: a private task assigned to
    // the viewer's Person but created by a different user (or the system,
    // via a trigger blueprint) showed up in /tasks "Your Tasks" because the
    // assignedToMe query filters only on assigneePersonId, but clicking it
    // returned 404 because the visibility filter on /tasks/[id] only
    // matched isPublic=true OR createdByUserId=viewer.
    it("matches a private task assigned to the viewer's Person via assigneePersonId", async () => {
      mocks.prisma.userFindUniqueOrThrow.mockResolvedValue({
        availableHoursPerWeek: null,
        id: "user_demo",
        interestTags: [],
        isAdmin: false,
        personId: "person_demo",
        skillTags: [],
      });
      mocks.prisma.taskFindFirst.mockResolvedValue(null);
      mocks.countTaskCommunications.mockResolvedValue(0);

      await getTaskDetailData("task_assigned_to_demo", "user_demo");

      expect(mocks.prisma.taskFindFirst).toHaveBeenCalledTimes(1);
      const args = mocks.prisma.taskFindFirst.mock.calls[0]?.[0] as
        | { where?: { OR?: Array<Record<string, unknown>> } }
        | undefined;
      const ors = args?.where?.OR ?? [];
      expect(ors).toContainEqual({ isPublic: true });
      expect(ors).toContainEqual({ createdByUserId: "user_demo" });
      expect(ors).toContainEqual({ assigneePersonId: "person_demo" });
    });

    it("falls back to public-only matching when no signed-in viewer", async () => {
      mocks.prisma.taskFindFirst.mockResolvedValue(null);
      mocks.countTaskCommunications.mockResolvedValue(0);

      await getTaskDetailData("task_anon", null);

      expect(mocks.prisma.userFindUniqueOrThrow).not.toHaveBeenCalled();
      const args = mocks.prisma.taskFindFirst.mock.calls[0]?.[0] as
        | { where?: Record<string, unknown> }
        | undefined;
      // For unauthenticated callers, getTaskVisibilityWhere returns the
      // base where with isPublic: true (no OR clause).
      expect(args?.where).toMatchObject({ isPublic: true });
      expect(args?.where).not.toHaveProperty("OR");
    });

    it("includes private child steps only through the viewer access filter", async () => {
      mocks.prisma.userFindUniqueOrThrow.mockResolvedValue({
        availableHoursPerWeek: null,
        id: "user_manager",
        interestTags: [],
        isAdmin: false,
        personId: "person_manager",
        skillTags: [],
      });
      mocks.prisma.taskFindFirst.mockResolvedValue(null);
      mocks.countTaskCommunications.mockResolvedValue(0);

      await getTaskDetailData("task_parent", "user_manager");

      const args = mocks.prisma.taskFindFirst.mock.calls[0]?.[0] as
        | {
            select?: {
              childTasks?: { where?: { AND?: Array<Record<string, unknown>> } };
            };
          }
        | undefined;
      const childFilters = args?.select?.childTasks?.where?.AND ?? [];
      expect(childFilters).toContainEqual({ deletedAt: null });
      expect(childFilters).not.toContainEqual({
        deletedAt: null,
        isPublic: true,
      });
      expect(childFilters).toContainEqual(
        expect.objectContaining({
          OR: expect.arrayContaining([
            { isPublic: true },
            { createdByUserId: "user_manager" },
            { assigneePersonId: "person_manager" },
          ]),
        }),
      );
    });
  });
});
