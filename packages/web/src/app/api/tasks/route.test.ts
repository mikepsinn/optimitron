import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createTask: vi.fn(),
  getServerSession: vi.fn(),
  listTasks: vi.fn(),
  personFindFirst: vi.fn(),
  requireAuth: vi.fn(),
  taskFindFirst: vi.fn(),
}));

vi.mock("next-auth", () => ({
  getServerSession: mocks.getServerSession,
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

vi.mock("@/lib/auth-utils", () => ({
  requireAuth: mocks.requireAuth,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    person: { findFirst: mocks.personFindFirst },
    task: { findFirst: mocks.taskFindFirst },
  },
}));

vi.mock("@/lib/tasks.server", () => ({
  createTask: mocks.createTask,
  listTasks: mocks.listTasks,
}));

import { GET, POST } from "./route";

describe("tasks route", () => {
  beforeEach(() => {
    mocks.createTask.mockReset();
    mocks.getServerSession.mockReset();
    mocks.listTasks.mockReset();
    mocks.personFindFirst.mockReset();
    mocks.requireAuth.mockReset();
    mocks.taskFindFirst.mockReset();
  });

  it("lists tasks created by the current user when requested", async () => {
    mocks.getServerSession.mockResolvedValue({ user: { id: "user_1" } });
    mocks.listTasks.mockResolvedValue([{ id: "task_1" }]);

    const response = await GET(
      new Request(
        "http://localhost/api/tasks?visibility=created&status=ACTIVE&frameKey=TWENTY_YEAR",
      ),
    );

    expect(response.status).toBe(200);
    expect(mocks.listTasks).toHaveBeenCalledWith(
      expect.objectContaining({
        frameKey: "TWENTY_YEAR",
        status: "ACTIVE",
        userId: "user_1",
        visibility: "created",
      }),
    );
    await expect(response.json()).resolves.toMatchObject({ success: true });
  });

  it("returns 401 when creating a task without auth", async () => {
    mocks.requireAuth.mockRejectedValue(new Error("Unauthorized"));

    const response = await POST(
      new Request("http://localhost/api/tasks", {
        body: JSON.stringify({ title: "Write docs" }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      }),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("creates a task for the authenticated user", async () => {
    mocks.requireAuth.mockResolvedValue({ userId: "user_1" });
    mocks.createTask.mockResolvedValue({
      createdByUserId: "user_1",
      id: "task_1",
      title: "Write docs",
    });

    const response = await POST(
      new Request("http://localhost/api/tasks", {
        body: JSON.stringify({
          dueAt: "2026-04-15T00:00:00.000Z",
          isPublic: false,
          title: "Write docs",
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      }),
    );

    expect(response.status).toBe(201);
    expect(mocks.createTask).toHaveBeenCalledWith(
      "user_1",
      expect.objectContaining({
        dueAt: expect.any(Date),
        isPublic: false,
        title: "Write docs",
      }),
    );
    await expect(response.json()).resolves.toMatchObject({ success: true });
  });

  it("creates a public assigned task without letting the caller pick a creator", async () => {
    mocks.requireAuth.mockResolvedValue({ userId: "user_creator" });
    mocks.createTask.mockResolvedValue({
      assigneePersonId: "person_target",
      createdByUserId: "user_creator",
      id: "task_2",
      isPublic: true,
      title: "Fix the site",
    });

    const response = await POST(
      new Request("http://localhost/api/tasks", {
        body: JSON.stringify({
          assigneePersonId: "person_target",
          createdByUserId: "user_not_allowed",
          description: "The donate calculator needs clearer labels.",
          ownerUserId: "user_not_allowed",
          title: "Fix the site",
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      }),
    );

    expect(response.status).toBe(201);
    expect(mocks.createTask).toHaveBeenCalledWith(
      "user_creator",
      expect.objectContaining({
        assigneePersonId: "person_target",
        description: "The donate calculator needs clearer labels.",
        title: "Fix the site",
      }),
    );
    expect(mocks.createTask.mock.calls[0]?.[1]).not.toHaveProperty(
      "createdByUserId",
    );
    expect(mocks.createTask.mock.calls[0]?.[1]).not.toHaveProperty(
      "ownerUserId",
    );
  });

  it("resolves an assigned task target from a person profile URL", async () => {
    mocks.requireAuth.mockResolvedValue({ userId: "user_creator" });
    mocks.personFindFirst.mockResolvedValue({ id: "person_target" });
    mocks.createTask.mockResolvedValue({
      assigneePersonId: "person_target",
      createdByUserId: "user_creator",
      id: "task_3",
      isPublic: true,
      title: "Call your senator",
    });

    const response = await POST(
      new Request("http://localhost/api/tasks", {
        body: JSON.stringify({
          assigneePersonIdentifier: "https://warondisease.org/people/Wishonia",
          description: "Ask for a public yes on the treaty.",
          isPublic: true,
          title: "Call your senator",
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      }),
    );

    expect(response.status).toBe(201);
    expect(mocks.personFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            { handle: "Wishonia" },
            { handle: "wishonia" },
          ]),
        }),
      }),
    );
    expect(mocks.createTask).toHaveBeenCalledWith(
      "user_creator",
      expect.objectContaining({
        assigneePersonId: "person_target",
        description: "Ask for a public yes on the treaty.",
        isPublic: true,
        title: "Call your senator",
      }),
    );
    expect(mocks.createTask.mock.calls[0]?.[1]).not.toHaveProperty(
      "assigneePersonIdentifier",
    );
  });
});
