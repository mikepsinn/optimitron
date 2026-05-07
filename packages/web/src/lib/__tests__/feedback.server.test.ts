import { TaskCategory, TaskDifficulty } from "@optimitron/db";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createTask: vi.fn(),
  getWishoniaUserId: vi.fn(),
  taskUpdate: vi.fn(),
  userFindFirst: vi.fn(),
}));

vi.mock("../prisma", () => ({
  prisma: {
    task: {
      update: mocks.taskUpdate,
    },
    user: {
      findFirst: mocks.userFindFirst,
    },
  },
}));

vi.mock("../tasks.server", () => ({
  createTask: mocks.createTask,
}));

vi.mock("../wishonia.server", () => ({
  getWishoniaUserId: mocks.getWishoniaUserId,
}));

import { createFeedbackTask } from "../feedback.server";

beforeEach(() => {
  for (const fn of Object.values(mocks)) fn.mockReset();
  mocks.createTask.mockResolvedValue({ id: "task-feedback-1" });
  mocks.taskUpdate.mockResolvedValue({});
});

describe("createFeedbackTask", () => {
  it("creates a private triage task for the first admin", async () => {
    mocks.userFindFirst.mockResolvedValue({
      id: "admin-1",
      personId: "person-admin-1",
    });

    const result = await createFeedbackTask({
      contactEmail: "human@example.org",
      message: "The organization email is confusing.",
      pageUrl: "https://warondisease.org/endorse",
      submitterEmail: "signed-in@example.org",
      submitterUserId: "user-1",
    });

    expect(result).toEqual({ taskId: "task-feedback-1" });
    expect(mocks.createTask).toHaveBeenCalledWith(
      "admin-1",
      expect.objectContaining({
        assigneePersonId: "person-admin-1",
        category: TaskCategory.OTHER,
        difficulty: TaskDifficulty.BEGINNER,
        isPublic: false,
        title: "Review site feedback: The organization email is confusing.",
      }),
    );
    expect(mocks.createTask.mock.calls[0]?.[1].description).toContain(
      "A human sent feedback about how to better coordinate humanity",
    );
    expect(mocks.createTask.mock.calls[0]?.[1].description).toContain(
      "Contact email: human@example.org",
    );
    expect(mocks.taskUpdate).toHaveBeenCalledWith({
      where: { id: "task-feedback-1" },
      data: {
        contextJson: expect.objectContaining({
          contactEmail: "human@example.org",
          pageUrl: "https://warondisease.org/endorse",
          source: "feedback_page",
        }),
      },
    });
  });

  it("falls back to Wishonia when no admin user exists", async () => {
    mocks.userFindFirst.mockResolvedValue(null);
    mocks.getWishoniaUserId.mockResolvedValue("wishonia-user");

    await createFeedbackTask({
      message: "The button label is wrong.",
    });

    expect(mocks.createTask).toHaveBeenCalledWith(
      "wishonia-user",
      expect.objectContaining({
        assigneePersonId: null,
        isPublic: false,
      }),
    );
  });

  it("drops unsafe direct-post page URLs before creating metadata", async () => {
    mocks.userFindFirst.mockResolvedValue({
      id: "admin-1",
      personId: "person-admin-1",
    });

    await createFeedbackTask({
      message: "The URL field should not persist script URLs.",
      pageUrl: "javascript:alert(1)",
    });

    expect(mocks.createTask.mock.calls[0]?.[1].description).not.toContain(
      "javascript:",
    );
    expect(mocks.taskUpdate).toHaveBeenCalledWith({
      where: { id: "task-feedback-1" },
      data: {
        contextJson: expect.objectContaining({
          pageUrl: null,
        }),
      },
    });
  });

  it("rejects empty feedback", async () => {
    await expect(createFeedbackTask({ message: "  " })).rejects.toThrow(
      "Feedback is required.",
    );
    expect(mocks.createTask).not.toHaveBeenCalled();
  });

  it("rejects honeypot submissions before creating a task", async () => {
    await expect(
      createFeedbackTask({
        antiSpam: {
          honeypot: "https://spam.example",
        },
        message: "This bot filled the hidden field.",
      }),
    ).rejects.toMatchObject({ code: "honeypot" });

    expect(mocks.createTask).not.toHaveBeenCalled();
  });
});
