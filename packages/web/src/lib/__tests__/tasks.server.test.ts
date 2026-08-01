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
    taskClaimFindUniqueOrThrow: vi.fn(),
    taskClaimUpdate: vi.fn(),
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
      findUnique: mocks.prisma.taskClaimFindUnique,
      findUniqueOrThrow: mocks.prisma.taskClaimFindUniqueOrThrow,
      update: mocks.prisma.taskClaimUpdate,
    },
    task: {
      create: mocks.prisma.taskCreate,
      findFirst: mocks.prisma.taskFindFirst,
      findMany: mocks.prisma.taskFindMany,
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
  completeSelfTask,
  completeTaskClaim,
  createTask,
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
      findUniqueOrThrow: mocks.tx.taskClaimFindUniqueOrThrow,
      update: mocks.tx.taskClaimUpdate,
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
    ["unassigned OPEN_MANY", { claimPolicy: TaskClaimPolicy.OPEN_MANY }],
    [
      "self-assigned",
      {
        assigneePersonId: "person_1",
        claimPolicy: TaskClaimPolicy.ASSIGNED_ONLY,
      },
    ],
    [
      "self-assigned OPEN_MANY",
      {
        assigneePersonId: "person_1",
        claimPolicy: TaskClaimPolicy.OPEN_MANY,
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
      "unassigned ASSIGNED_ONLY",
      { claimPolicy: TaskClaimPolicy.ASSIGNED_ONLY },
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

  it("does not verify a task when a child appears before the guarded update", async () => {
    mocks.prisma.userFindUnique.mockResolvedValue({ personId: "person_1" });
    mocks.tx.taskFindFirst.mockResolvedValue(eligibleSelfTask());
    mocks.tx.taskUpdateMany.mockResolvedValue({ count: 0 });

    await expect(
      completeSelfTask("task_1", "user_1", "I say this is done."),
    ).rejects.toThrow("Task is no longer active");

    expect(mocks.tx.taskUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ childTasks: { none: {} } }),
      }),
    );
    expect(mocks.tx.taskFindUniqueOrThrow).not.toHaveBeenCalled();
  });

  it("completes active claims without overwriting their original start time", async () => {
    const claimedAt = new Date("2026-04-09T18:00:00.000Z");
    mocks.prisma.taskClaimFindUnique.mockResolvedValue({
      claimedAt,
      id: "claim_1",
      startedAt: null,
      status: TaskClaimStatus.CLAIMED,
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

  it("searchTasks without a user searches public tasks only", async () => {
    await searchTasks("secret grant memo", { userId: null });

    const args = lastTaskFindManyArgs();
    const filters = (args.where as { AND: unknown[] }).AND;
    expect(filters[0]).toEqual(
      expect.objectContaining({ deletedAt: null, isPublic: true }),
    );
    expect(filters.slice(1)).toHaveLength(3);
    for (const term of ["secret", "grant", "memo"]) {
      expect(filters.slice(1)).toContainEqual(
        expect.objectContaining({
          OR: expect.arrayContaining([
            { title: { contains: term, mode: "insensitive" } },
          ]),
        }),
      );
    }
  });

  it("searchTasks with a user searches public tasks plus that user's created private tasks", async () => {
    await searchTasks("secret grant memo", { userId: "user-a" });

    const args = lastTaskFindManyArgs();
    const [visibility] = (args.where as { AND: unknown[] }).AND as Array<{
      OR?: unknown[];
      deletedAt?: unknown;
    }>;
    expect(visibility?.deletedAt).toBeNull();
    expect(visibility?.OR).toEqual(
      expect.arrayContaining([
        { isPublic: true },
        { createdByUserId: "user-a" },
      ]),
    );
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
  it("defaults a parentless private task into the creator's planning branch", async () => {
    mocks.ensureExecutionPlanningBranch.mockResolvedValue({
      id: "planner-branch-1",
    });
    mocks.prisma.taskCreate.mockResolvedValue({
      claimPolicy: TaskClaimPolicy.ASSIGNED_ONLY,
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
          isPublic: false,
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
    mocks.prisma.taskFindFirst.mockResolvedValue({
      claimPolicy: TaskClaimPolicy.OPEN_SINGLE,
      id: "task_public",
      isPublic: true,
    });

    await expect(
      updateTaskCreatedByUser("task_public", "user_creator", {
        isPublic: false,
      }),
    ).rejects.toThrow("Public tasks can't be unpublished. Ask an admin.");

    expect(mocks.prisma.transaction).not.toHaveBeenCalled();
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
  });
});
