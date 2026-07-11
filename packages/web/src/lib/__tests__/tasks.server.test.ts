import {
  TaskCategory,
  TaskClaimPolicy,
  TaskClaimStatus,
  TaskDifficulty,
  TaskStatus,
} from "@optimitron/db";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  countTaskCommunications: vi.fn(),
  grantWishes: vi.fn(),
  notifyTaskAssigneeOfAssignment: vi.fn(),
  prisma: {
    taskCreate: vi.fn(),
    taskFindFirst: vi.fn(),
    taskClaimFindUnique: vi.fn(),
    taskClaimFindUniqueOrThrow: vi.fn(),
    taskClaimUpdate: vi.fn(),
    taskFindMany: vi.fn(),
    personFindFirst: vi.fn(),
    transaction: vi.fn(),
    userFindUniqueOrThrow: vi.fn(),
  },
  tx: {
    taskClaimFindUniqueOrThrow: vi.fn(),
    taskClaimUpdate: vi.fn(),
    taskFindUniqueOrThrow: vi.fn(),
    taskUpdate: vi.fn(),
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

vi.mock("@/lib/tasks/task-communications.server", () => ({
  countTaskCommunications: mocks.countTaskCommunications,
}));

import {
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
    task: {
      findUniqueOrThrow: mocks.tx.taskFindUniqueOrThrow,
      update: mocks.tx.taskUpdate,
    },
    taskClaim: {
      findUniqueOrThrow: mocks.tx.taskClaimFindUniqueOrThrow,
      update: mocks.tx.taskClaimUpdate,
    },
  };
}

function resetAllMocks() {
  mocks.countTaskCommunications.mockReset();
  mocks.grantWishes.mockReset();
  mocks.notifyTaskAssigneeOfAssignment.mockReset();

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
    _count: { childTasks: 0 },
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
    difficulty: TaskDifficulty.BEGINNER,
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
    mocks.prisma.taskFindMany.mockResolvedValue([]);
    mocks.prisma.transaction.mockImplementation(
      async (
        callback: (tx: ReturnType<typeof createTransactionClient>) => unknown,
      ) => callback(createTransactionClient()),
    );
  });

  it("completes active claims without overwriting their original start time", async () => {
    const claimedAt = new Date("2026-04-09T18:00:00.000Z");
    mocks.prisma.taskClaimFindUniqueOrThrow.mockResolvedValue({
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

    expect(lastTaskFindManyArgs().where).toMatchObject({
      deletedAt: null,
      OR: [{ isPublic: true }, { createdByUserId: "user-a" }],
    });
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
    expect(args.where).toMatchObject({
      AND: [
        expect.objectContaining({
          deletedAt: null,
          isPublic: true,
        }),
        expect.any(Object),
      ],
    });
  });

  it("searchTasks with a user searches public tasks plus that user's created private tasks", async () => {
    await searchTasks("secret grant memo", { userId: "user-a" });

    const args = lastTaskFindManyArgs();
    expect(args.where).toMatchObject({
      AND: [
        expect.objectContaining({
          deletedAt: null,
          OR: [{ isPublic: true }, { createdByUserId: "user-a" }],
        }),
        expect.any(Object),
      ],
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
    mocks.prisma.taskCreate.mockResolvedValue({
      assigneePersonId: "person_target",
      createdByUserId: "user_creator",
      id: "task_2",
      isPublic: true,
      title: "Fix the site",
    });

    await createTask("user_creator", {
      assigneePersonId: "person_target",
      description: "The page should make the next action obvious.",
      title: "Fix the site",
    });

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
          isPublic: true,
          maxClaims: null,
        }),
      }),
    );
    expect(mocks.notifyTaskAssigneeOfAssignment).toHaveBeenCalledWith({
      senderUserId: "user_creator",
      taskId: "task_3",
    });
  });

  it("defaults unassigned tasks to public open-single tasks", async () => {
    mocks.prisma.taskCreate.mockResolvedValue({
      claimPolicy: TaskClaimPolicy.OPEN_SINGLE,
      createdByUserId: "user_creator",
      id: "task_4",
      isPublic: true,
      title: "Claimable work",
    });

    await createTask("user_creator", {
      title: "Claimable work",
    });

    expect(mocks.prisma.taskCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          claimPolicy: TaskClaimPolicy.OPEN_SINGLE,
          isPublic: true,
          parentTaskId: "optimize-earth",
        }),
      }),
    );
    expect(mocks.notifyTaskAssigneeOfAssignment).not.toHaveBeenCalled();
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
        maxTaskDifficulty: null,
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
