import { beforeEach, describe, expect, it, vi } from "vitest";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

const mocks = vi.hoisted(() => ({
  cooldownAllowed: vi.fn(),
  draftTaskNotification: vi.fn(),
  getAppBaseUrl: vi.fn(),
  getTaskCompletionUrl: vi.fn(),
  getTaskEmailReplyInstruction: vi.fn(),
  getTaskUrl: vi.fn(),
  getWishoniaUserId: vi.fn(),
  isAuthorizedCronRequest: vi.fn(),
  resolveTaskRecipient: vi.fn(),
  sendDraftTaskNotification: vi.fn(),
  taskCommentCreate: vi.fn(),
  taskCommentAggregate: vi.fn(),
  taskCommentFindMany: vi.fn(),
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
      count: mocks.taskCommunicationCount,
      update: mocks.taskCommunicationUpdate,
    },
    taskComment: {
      aggregate: mocks.taskCommentAggregate,
      create: mocks.taskCommentCreate,
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

vi.mock("@/lib/email/task-notification", () => ({
  getAppBaseUrl: mocks.getAppBaseUrl,
  getTaskCompletionUrl: mocks.getTaskCompletionUrl,
  getTaskEmailReplyInstruction: mocks.getTaskEmailReplyInstruction,
  getTaskUrl: mocks.getTaskUrl,
}));

vi.mock("@/lib/tasks/task-recipients.server", () => ({
  resolveTaskRecipient: mocks.resolveTaskRecipient,
}));

vi.mock("@/lib/wishonia.server", () => ({
  getWishoniaUserId: mocks.getWishoniaUserId,
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
    mocks.taskCommentAggregate.mockResolvedValue({
      _count: { _all: 0 },
      _max: { createdAt: null },
    });
    mocks.taskCommunicationCount.mockResolvedValue(0);
    mocks.cooldownAllowed.mockResolvedValue({ allowed: true });
    mocks.getTaskEmailReplyInstruction.mockReturnValue(
      "Reply to this email to add a comment to the task.",
    );
    mocks.getAppBaseUrl.mockReturnValue("https://warondisease.org");
    mocks.getTaskCompletionUrl.mockReturnValue(
      "https://warondisease.org/tasks/task_1#complete",
    );
    mocks.getTaskUrl.mockReturnValue("https://warondisease.org/tasks/task_1");
    mocks.getWishoniaUserId.mockResolvedValue("wishonia_user");
    mocks.resolveTaskRecipient.mockResolvedValue({
      email: "joe@example.com",
      personId: "person_1",
    });
    mocks.taskCommentCreate.mockResolvedValue({ id: "comment_1" });
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
        bccEmails: [],
        recipientEmail: "joe@example.com",
        recipientPersonId: "person_1",
        taskId: "task_1",
        step: 1,
        subject: "Task overdue: Get Joe to vote on the 1% Treaty",
        text: expect.stringContaining("Mark task complete"),
      }),
    );
    expect(mocks.draftTaskNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        text: expect.stringContaining("Open task"),
      }),
    );
    expect(mocks.draftTaskNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        text: expect.stringContaining(
          "Reply to this email to add a comment to the task.",
        ),
      }),
    );
    expect(mocks.taskCommentCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          authorUserId: "wishonia_user",
          kind: "COMMENT",
          message: expect.stringContaining(
            "overdue: Get Joe to vote on the 1% Treaty.",
          ),
          source: "SYSTEM",
          taskId: "task_1",
        }),
      }),
    );
    expect(
      mocks.taskCommentCreate.mock.calls[0]?.[0].data.message,
    ).not.toContain("joe@example.com");
    expect(mocks.sendDraftTaskNotification).toHaveBeenCalledWith(
      expect.objectContaining({ communicationId: "comm_1" }),
    );
    expect(mocks.taskCommunicationUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "comm_1" },
        data: expect.objectContaining({
          taskCommentId: "comment_1",
        }),
      }),
    );
  });

  it("only scans tasks that are at least 30 days overdue", async () => {
    const before = Date.now();
    await GET(makeRequest());
    const after = Date.now();

    const dueAtFilter = mocks.taskFindMany.mock.calls[0]?.[0].where.dueAt;
    expect(dueAtFilter).toEqual(
      expect.objectContaining({
        lte: expect.any(Date),
        not: null,
      }),
    );

    const cutoff = dueAtFilter.lte as Date;
    expect(cutoff.getTime()).toBeGreaterThanOrEqual(
      before - THIRTY_DAYS_MS - 1000,
    );
    expect(cutoff.getTime()).toBeLessThanOrEqual(after - THIRTY_DAYS_MS + 1000);
  });

  it("skips when the recipient already received the daily cap of 1 email", async () => {
    mocks.taskCommunicationCount.mockResolvedValueOnce(1); // daily window
    const response = await GET(makeRequest());
    const json = await response.json();
    expect(json).toEqual(
      expect.objectContaining({ scanned: 1, sent: 0, skipped: 1 }),
    );
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

  it("skips a task that already has one overdue reminder comment", async () => {
    mocks.taskCommentAggregate.mockResolvedValue({
      _count: { _all: 1 },
      _max: { createdAt: new Date("2026-04-19T00:00:00.000Z") },
    });
    const response = await GET(makeRequest());
    const json = await response.json();
    expect(json).toEqual(expect.objectContaining({ sent: 0, skipped: 1 }));
    expect(mocks.draftTaskNotification).not.toHaveBeenCalled();
  });

  it("skips a task whose last overdue reminder comment was less than 30 days ago", async () => {
    mocks.taskCommentAggregate.mockResolvedValue({
      _count: { _all: 1 },
      _max: { createdAt: new Date(Date.now() - 29 * 24 * 60 * 60 * 1000) },
    });
    const response = await GET(makeRequest());
    const json = await response.json();
    expect(json).toEqual(expect.objectContaining({ sent: 0, skipped: 1 }));
  });

  it("only counts sent reminder comments toward the one-reminder cap", async () => {
    mocks.taskCommentAggregate.mockResolvedValue({
      _count: { _all: 1 },
      _max: { createdAt: new Date("2026-04-01T00:00:00.000Z") },
    });

    const response = await GET(makeRequest());
    const json = await response.json();

    expect(json).toEqual(expect.objectContaining({ sent: 0, skipped: 1 }));
    expect(mocks.taskCommentAggregate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          communications: {
            some: expect.objectContaining({
              purpose: "REMINDER",
              status: "SENT",
            }),
          },
          taskId: "task_1",
        }),
      }),
    );
    expect(mocks.draftTaskNotification).not.toHaveBeenCalled();
  });

  it("skips a task with no resolvable recipient", async () => {
    mocks.resolveTaskRecipient.mockResolvedValue(null);
    const response = await GET(makeRequest());
    const json = await response.json();
    expect(json).toEqual(expect.objectContaining({ sent: 0, skipped: 1 }));
  });

  it("skips a task whose channel cooldown is active", async () => {
    mocks.cooldownAllowed.mockResolvedValue({
      allowed: false,
      retryAfter: new Date(),
    });
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
    mocks.taskFindMany.mockResolvedValue([
      overdueTask,
      { ...overdueTask, id: "task_2" },
    ]);
    mocks.resolveTaskRecipient
      .mockRejectedValueOnce(new Error("boom"))
      .mockResolvedValueOnce({
        email: "second@example.com",
        personId: "person_2",
      });

    const response = await GET(makeRequest());
    const json = await response.json();
    expect(json).toEqual(
      expect.objectContaining({
        failures: 1,
        scanned: 2,
        sent: 1,
      }),
    );
  });
});
