import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  cooldownAllowed: vi.fn(),
  draftTaskNotification: vi.fn(),
  getTaskAncestors: vi.fn(),
  isAuthorizedCronRequest: vi.fn(),
  resolveTaskRecipient: vi.fn(),
  sendDraftTaskNotification: vi.fn(),
  taskCommentFindMany: vi.fn(),
  taskCommunicationAggregate: vi.fn(),
  taskCommunicationCount: vi.fn(),
  taskCommunicationUpdate: vi.fn(),
  taskFindMany: vi.fn(),
}));

vi.mock("@/lib/cron", () => ({
  isAuthorizedCronRequest: mocks.isAuthorizedCronRequest,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    task: {
      findMany: mocks.taskFindMany,
    },
    taskCommunication: {
      aggregate: mocks.taskCommunicationAggregate,
      count: mocks.taskCommunicationCount,
      update: mocks.taskCommunicationUpdate,
    },
    taskComment: {
      findMany: mocks.taskCommentFindMany,
    },
  },
}));

vi.mock("@/lib/tasks/task-communications.server", () => ({
  checkTaskCommunicationCooldown: mocks.cooldownAllowed,
}));

vi.mock("@/lib/tasks/task-notifications.server", () => ({
  draftTaskNotification: mocks.draftTaskNotification,
  sendDraftTaskNotification: mocks.sendDraftTaskNotification,
}));

vi.mock("@/lib/tasks/task-recipients.server", () => ({
  resolveTaskRecipient: mocks.resolveTaskRecipient,
}));

vi.mock("@/lib/tasks.server", () => ({
  getTaskAncestors: mocks.getTaskAncestors,
}));

import { GET } from "./route";

function makeRequest() {
  return new Request("http://localhost/api/cron/task-overdue-reminders", {
    method: "GET",
  });
}

const overdueTask = {
  description: "Vote on the 1% Treaty.",
  dueAt: new Date("2026-04-24T00:00:00.000Z"),
  id: "task_1",
  title: "Get Joe to vote on the 1% Treaty",
};

describe("/api/cron/task-overdue-reminders", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.isAuthorizedCronRequest.mockReturnValue(true);
    mocks.taskFindMany.mockResolvedValue([overdueTask]);
    mocks.taskCommunicationAggregate.mockResolvedValue({
      _count: { _all: 0 },
      _max: { sentAt: null },
    });
    mocks.taskCommunicationCount.mockResolvedValue(0);
    mocks.cooldownAllowed.mockResolvedValue({ allowed: true });
    mocks.resolveTaskRecipient.mockResolvedValue({
      email: "joe@example.com",
      personId: "person_1",
    });
    mocks.getTaskAncestors.mockResolvedValue([{ id: "p", title: "Ratify the 1% Treaty" }]);
    mocks.taskCommentFindMany.mockResolvedValue([]);
    mocks.draftTaskNotification.mockResolvedValue({
      id: "comm_1",
      metadataJson: { unsubscribeUrl: "https://warondisease.org/unsub" },
    });
    mocks.sendDraftTaskNotification.mockResolvedValue({
      communication: { id: "comm_1" },
      status: "sent",
    });
  });

  it("rejects unauthorized requests", async () => {
    mocks.isAuthorizedCronRequest.mockReturnValue(false);
    const response = await GET(makeRequest());
    expect(response.status).toBe(401);
  });

  it("sends a reminder for an overdue task with a resolvable recipient", async () => {
    const response = await GET(makeRequest());
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      failures: 0,
      scanned: 1,
      sent: 1,
      skipped: 0,
    });

    expect(mocks.draftTaskNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientEmail: "joe@example.com",
        recipientPersonId: "person_1",
        taskId: "task_1",
        step: 1,
        subject: expect.stringContaining("[OVERDUE]"),
      }),
    );
    expect(mocks.sendDraftTaskNotification).toHaveBeenCalledWith(
      expect.objectContaining({ communicationId: "comm_1" }),
    );
  });

  it("skips when the recipient already received the daily cap of 1 email", async () => {
    mocks.taskCommunicationCount.mockResolvedValueOnce(1); // daily window
    const response = await GET(makeRequest());
    const json = await response.json();
    expect(json).toEqual(expect.objectContaining({ scanned: 1, sent: 0, skipped: 1 }));
    expect(mocks.draftTaskNotification).not.toHaveBeenCalled();
  });

  it("skips when the recipient already received 5 emails in the last 30 days", async () => {
    mocks.taskCommunicationCount
      .mockResolvedValueOnce(0) // daily count clean
      .mockResolvedValueOnce(5); // monthly count at cap
    const response = await GET(makeRequest());
    const json = await response.json();
    expect(json).toEqual(expect.objectContaining({ sent: 0, skipped: 1 }));
    expect(mocks.draftTaskNotification).not.toHaveBeenCalled();
  });

  it("skips a task that has already received 4 reminders", async () => {
    mocks.taskCommunicationAggregate.mockResolvedValue({
      _count: { _all: 4 },
      _max: { sentAt: new Date("2026-04-19T00:00:00.000Z") },
    });
    const response = await GET(makeRequest());
    const json = await response.json();
    expect(json).toEqual(expect.objectContaining({ sent: 0, skipped: 1 }));
    expect(mocks.draftTaskNotification).not.toHaveBeenCalled();
  });

  it("skips a task whose last reminder was less than 7 days ago", async () => {
    mocks.taskCommunicationAggregate.mockResolvedValue({
      _count: { _all: 1 },
      _max: { sentAt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    });
    const response = await GET(makeRequest());
    const json = await response.json();
    expect(json).toEqual(expect.objectContaining({ sent: 0, skipped: 1 }));
  });

  it("skips a task with no resolvable recipient", async () => {
    mocks.resolveTaskRecipient.mockResolvedValue(null);
    const response = await GET(makeRequest());
    const json = await response.json();
    expect(json).toEqual(expect.objectContaining({ sent: 0, skipped: 1 }));
  });

  it("skips a task whose channel cooldown is active", async () => {
    mocks.cooldownAllowed.mockResolvedValue({ allowed: false, retryAfter: new Date() });
    const response = await GET(makeRequest());
    const json = await response.json();
    expect(json).toEqual(expect.objectContaining({ sent: 0, skipped: 1 }));
  });

  it("substitutes the unsubscribe URL into the draft metadata before sending", async () => {
    await GET(makeRequest());
    expect(mocks.taskCommunicationUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "comm_1" },
        data: expect.objectContaining({
          metadataJson: expect.objectContaining({
            html: expect.not.stringContaining("{{UNSUBSCRIBE_URL}}"),
            text: expect.not.stringContaining("{{UNSUBSCRIBE_URL}}"),
          }),
        }),
      }),
    );
  });

  it("counts a per-task failure without aborting the batch", async () => {
    mocks.taskFindMany.mockResolvedValue([overdueTask, { ...overdueTask, id: "task_2" }]);
    mocks.resolveTaskRecipient
      .mockRejectedValueOnce(new Error("boom"))
      .mockResolvedValueOnce({
        email: "second@example.com",
        personId: "person_2",
      });

    const response = await GET(makeRequest());
    const json = await response.json();
    expect(json).toEqual(expect.objectContaining({
      failures: 1,
      scanned: 2,
      sent: 1,
    }));
  });
});
