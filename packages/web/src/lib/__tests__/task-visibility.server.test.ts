import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  prisma: {
    activityCreate: vi.fn(),
    taskFindFirst: vi.fn(),
    transaction: vi.fn(),
    userFindFirst: vi.fn(),
    userFindUnique: vi.fn(),
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: mocks.prisma.transaction,
    activity: {
      create: mocks.prisma.activityCreate,
    },
    task: {
      findFirst: mocks.prisma.taskFindFirst,
    },
    user: {
      findFirst: mocks.prisma.userFindFirst,
      findUnique: mocks.prisma.userFindUnique,
    },
  },
}));

import {
  assertUserCanViewTask,
  authorizeTaskBreakGlassAccess,
  canUserViewInternalTaskContent,
  canUserViewTask,
  getTaskAccessWhere,
  getTaskVisibilityWhere,
} from "../tasks/task-visibility.server";

beforeEach(() => {
  mocks.prisma.activityCreate.mockReset();
  mocks.prisma.taskFindFirst.mockReset();
  mocks.prisma.transaction.mockReset();
  mocks.prisma.userFindFirst.mockReset();
  mocks.prisma.userFindUnique.mockReset();
  mocks.prisma.transaction.mockImplementation((callback) =>
    callback({
      activity: { create: mocks.prisma.activityCreate },
      task: { findFirst: mocks.prisma.taskFindFirst },
      user: { findFirst: mocks.prisma.userFindFirst },
    }),
  );
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

    expect(where.OR).toEqual(
      expect.arrayContaining([
        { isPublic: true },
        { createdByUserId: "user_1" },
        { assigneePersonId: "person_1" },
        {
          managers: {
            some: { deletedAt: null, userId: "user_1" },
          },
        },
      ]),
    );
    expect(where.isPublic).toBeUndefined();
  });

  it("keeps the target-organization filter when composing accessible access", () => {
    const where = getTaskVisibilityWhere({
      personId: "person_1",
      targetOrganizationId: "org_target",
      userId: "user_1",
      visibility: "accessible",
    });

    expect(where).toEqual({
      AND: [
        expect.objectContaining({ deletedAt: null }),
        {
          OR: [
            { assigneeOrganizationId: "org_target" },
            { ownerOrganizationId: "org_target" },
          ],
        },
        expect.objectContaining({
          OR: expect.arrayContaining([
            { isPublic: true },
            { createdByUserId: "user_1" },
            { assigneePersonId: "person_1" },
          ]),
        }),
      ],
    });
  });

  it("keeps the target-organization filter when composing personal access", () => {
    const where = getTaskVisibilityWhere({
      personId: "person_1",
      targetOrganizationId: "org_target",
      userId: "user_1",
      visibility: "personal",
    });

    expect(where).toEqual({
      AND: [
        expect.objectContaining({ deletedAt: null }),
        {
          OR: [
            { assigneeOrganizationId: "org_target" },
            { ownerOrganizationId: "org_target" },
          ],
        },
        {
          OR: [
            { createdByUserId: "user_1" },
            { assigneePersonId: "person_1" },
          ],
        },
      ],
    });
  });

  it("keeps organization viewers read-only", () => {
    const readable = getTaskAccessWhere({
      action: "READ",
      userId: "viewer_1",
    });
    const executable = getTaskAccessWhere({
      action: "EXECUTE",
      userId: "viewer_1",
    });
    const manageable = getTaskAccessWhere({
      action: "MANAGE",
      userId: "viewer_1",
    });

    expect(JSON.stringify(readable)).not.toContain("role");
    expect(JSON.stringify(executable)).toContain('"MEMBER"');
    expect(JSON.stringify(executable)).not.toContain('"VIEWER"');
    expect(JSON.stringify(manageable)).toContain('"ADMIN"');
    expect(JSON.stringify(manageable)).not.toContain('"MEMBER"');
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
    expect(where.OR).toEqual(
      expect.arrayContaining([
        { isPublic: true },
        { createdByUserId: "user_1" },
        { assigneePersonId: "person_1" },
      ]),
    );
  });

  it("does not give platform admins implicit private-task access", async () => {
    mocks.prisma.userFindUnique.mockResolvedValue({
      isAdmin: true,
      personId: null,
    });
    mocks.prisma.taskFindFirst.mockResolvedValue(null);

    await expect(canUserViewTask("task_1", "admin_1")).resolves.toBe(false);

    const where = mocks.prisma.taskFindFirst.mock.calls[0]?.[0]?.where;
    expect(where.OR).toEqual(
      expect.arrayContaining([{ createdByUserId: "admin_1" }]),
    );
  });

  it("returns false for a blank task id without querying", async () => {
    await expect(canUserViewTask("  ", "user_1")).resolves.toBe(false);

    expect(mocks.prisma.taskFindFirst).not.toHaveBeenCalled();
  });
});

describe("authorizeTaskBreakGlassAccess", () => {
  it("requires an explicit reason and records the private access", async () => {
    mocks.prisma.userFindFirst.mockResolvedValue({ id: "admin_1" });
    mocks.prisma.taskFindFirst.mockResolvedValue({
      id: "private_task",
      isPublic: false,
    });
    mocks.prisma.activityCreate.mockResolvedValue({ id: "audit_1" });

    await authorizeTaskBreakGlassAccess({
      adminUserId: "admin_1",
      reason: "Investigating tenant-reported data corruption",
      taskId: "private_task",
    });

    expect(mocks.prisma.activityCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        entityId: "private_task",
        entityType: "Task",
        userId: "admin_1",
      }),
    });
  });

  it("rejects vague break-glass requests before reading private data", async () => {
    await expect(
      authorizeTaskBreakGlassAccess({
        adminUserId: "admin_1",
        reason: "debug",
        taskId: "private_task",
      }),
    ).rejects.toThrow("specific reason");

    expect(mocks.prisma.transaction).not.toHaveBeenCalled();
  });
});

describe("canUserViewInternalTaskContent", () => {
  it("rejects anonymous viewers without querying the task", async () => {
    await expect(canUserViewInternalTaskContent("task_1", null)).resolves.toBe(
      false,
    );

    expect(mocks.prisma.taskFindFirst).not.toHaveBeenCalled();
  });

  it("checks creator, assignee, manager, and organization-admin access", async () => {
    mocks.prisma.userFindUnique.mockResolvedValue({
      isAdmin: false,
      personId: "person_1",
    });
    mocks.prisma.taskFindFirst.mockResolvedValue({ id: "task_1" });

    await expect(
      canUserViewInternalTaskContent("task_1", "user_1"),
    ).resolves.toBe(true);

    const where = mocks.prisma.taskFindFirst.mock.calls[0]?.[0]?.where;
    expect(where.OR).toEqual(
      expect.arrayContaining([
        { createdByUserId: "user_1" },
        { assigneePersonId: "person_1" },
        {
          managers: {
            some: { deletedAt: null, userId: "user_1" },
          },
        },
      ]),
    );
  });

  it("does not grant internal access merely because the task is public", async () => {
    mocks.prisma.userFindUnique.mockResolvedValue({
      isAdmin: false,
      personId: null,
    });
    mocks.prisma.taskFindFirst.mockResolvedValue(null);

    await expect(
      canUserViewInternalTaskContent("public_task", "stranger_1"),
    ).resolves.toBe(false);
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
