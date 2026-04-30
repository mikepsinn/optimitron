import {
  TaskClaimPolicy,
  TaskClaimStatus,
  TaskStatus,
} from "@optimitron/db";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  grantWishes: vi.fn(),
  prisma: {
    taskClaimFindUniqueOrThrow: vi.fn(),
    taskClaimUpdate: vi.fn(),
    taskFindMany: vi.fn(),
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
      findUniqueOrThrow: mocks.prisma.taskClaimFindUniqueOrThrow,
      update: mocks.prisma.taskClaimUpdate,
    },
    task: {
      findMany: mocks.prisma.taskFindMany,
    },
    user: {
      findUniqueOrThrow: mocks.prisma.userFindUniqueOrThrow,
    },
  },
}));

vi.mock("@/lib/wishes.server", () => ({
  grantWishes: mocks.grantWishes,
}));

import { completeTaskClaim, listTasks, searchTasks, verifyTask } from "../tasks.server";

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
  mocks.grantWishes.mockReset();

  for (const group of [mocks.prisma, mocks.tx]) {
    for (const mockFn of Object.values(group)) {
      mockFn.mockReset();
    }
  }
}

function lastTaskFindManyArgs() {
  const calls = mocks.prisma.taskFindMany.mock.calls as Array<[Record<string, unknown>]>;
  return calls.at(-1)?.[0] ?? {};
}

describe("tasks server", () => {
  beforeEach(() => {
    resetAllMocks();
    mocks.prisma.taskFindMany.mockResolvedValue([]);
    mocks.prisma.transaction.mockImplementation(
      async (callback: (tx: ReturnType<typeof createTransactionClient>) => unknown) =>
        callback(createTransactionClient()),
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

  it("listTasks accessible visibility only includes public tasks plus the authenticated user's owned tasks", async () => {
    await listTasks({ userId: "user-a", visibility: "accessible" });

    expect(lastTaskFindManyArgs().where).toMatchObject({
      deletedAt: null,
      OR: [{ isPublic: true }, { ownerUserId: "user-a" }],
    });
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

  it("searchTasks with a user searches public tasks plus that user's owned private tasks", async () => {
    await searchTasks("secret grant memo", { userId: "user-a" });

    const args = lastTaskFindManyArgs();
    expect(args.where).toMatchObject({
      AND: [
        expect.objectContaining({
          deletedAt: null,
          OR: [{ isPublic: true }, { ownerUserId: "user-a" }],
        }),
        expect.any(Object),
      ],
    });
  });
});
