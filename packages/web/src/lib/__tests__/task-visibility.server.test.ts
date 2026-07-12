import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  prisma: {
    taskFindFirst: vi.fn(),
    userFindUnique: vi.fn(),
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    task: {
      findFirst: mocks.prisma.taskFindFirst,
    },
    user: {
      findUnique: mocks.prisma.userFindUnique,
    },
  },
}));

import {
  assertUserCanViewTask,
  canUserViewTask,
  getTaskVisibilityWhere,
} from "../tasks/task-visibility.server";

beforeEach(() => {
  mocks.prisma.taskFindFirst.mockReset();
  mocks.prisma.userFindUnique.mockReset();
});

describe("getTaskVisibilityWhere", () => {
  it("restricts anonymous 'accessible' viewers to public tasks", () => {
    const where = getTaskVisibilityWhere({
      taskId: "task_1",
      visibility: "accessible",
    });

    expect(where).toMatchObject({
      deletedAt: null,
      id: "task_1",
      isPublic: true,
    });
    expect(where.OR).toBeUndefined();
  });

  it("lets signed-in viewers reach public, own, and assigned tasks", () => {
    const where = getTaskVisibilityWhere({
      taskId: "task_1",
      userId: "user_1",
      personId: "person_1",
      visibility: "accessible",
    });

    expect(where.OR).toEqual([
      { isPublic: true },
      { createdByUserId: "user_1" },
      { assigneePersonId: "person_1" },
    ]);
    expect(where.isPublic).toBeUndefined();
  });

  it("defaults to public-only when no visibility is given", () => {
    const where = getTaskVisibilityWhere({ taskId: "task_1" });

    expect(where).toMatchObject({ id: "task_1", isPublic: true });
  });
});

describe("canUserViewTask", () => {
  it("returns false for anonymous viewers when the public lookup misses", async () => {
    mocks.prisma.taskFindFirst.mockResolvedValue(null);

    await expect(canUserViewTask("private_task", null)).resolves.toBe(false);

    expect(mocks.prisma.userFindUnique).not.toHaveBeenCalled();
    const where = mocks.prisma.taskFindFirst.mock.calls[0]?.[0]?.where;
    expect(where).toMatchObject({ id: "private_task", isPublic: true });
  });

  it("checks creator/assignee access for signed-in non-admins", async () => {
    mocks.prisma.userFindUnique.mockResolvedValue({
      isAdmin: false,
      personId: "person_1",
    });
    mocks.prisma.taskFindFirst.mockResolvedValue({ id: "task_1" });

    await expect(canUserViewTask("task_1", "user_1")).resolves.toBe(true);

    const where = mocks.prisma.taskFindFirst.mock.calls[0]?.[0]?.where;
    expect(where.OR).toEqual([
      { isPublic: true },
      { createdByUserId: "user_1" },
      { assigneePersonId: "person_1" },
    ]);
  });

  it("lets admins view any non-deleted task", async () => {
    mocks.prisma.userFindUnique.mockResolvedValue({
      isAdmin: true,
      personId: null,
    });
    mocks.prisma.taskFindFirst.mockResolvedValue({ id: "task_1" });

    await expect(canUserViewTask("task_1", "admin_1")).resolves.toBe(true);

    expect(mocks.prisma.taskFindFirst).toHaveBeenCalledWith({
      where: { id: "task_1", deletedAt: null },
      select: { id: true },
    });
  });

  it("returns false for a blank task id without querying", async () => {
    await expect(canUserViewTask("  ", "user_1")).resolves.toBe(false);

    expect(mocks.prisma.taskFindFirst).not.toHaveBeenCalled();
  });
});

describe("assertUserCanViewTask", () => {
  it("throws the 404-mapped message when access is denied", async () => {
    mocks.prisma.taskFindFirst.mockResolvedValue(null);

    await expect(assertUserCanViewTask("private_task", null)).rejects.toThrow(
      "Task not found",
    );
  });
});
