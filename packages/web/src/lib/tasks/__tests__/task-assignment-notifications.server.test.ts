import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  draftTaskNotification: vi.fn(),
  sendDraftTaskNotification: vi.fn(),
  taskFindUnique: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    task: {
      findUnique: mocks.taskFindUnique,
    },
  },
}));

vi.mock("@/lib/tasks/task-notifications.server", () => ({
  draftTaskNotification: mocks.draftTaskNotification,
  sendDraftTaskNotification: mocks.sendDraftTaskNotification,
}));

vi.mock("@/lib/email/task-notification", () => ({
  getAppBaseUrl: () => "https://warondisease.org",
  getTaskCompletionUrl: (taskId: string) =>
    `https://warondisease.org/tasks/${taskId}#complete`,
  getTaskEmailReplyInstruction: () =>
    "Reply to this email to add a comment to the task.",
  getTaskUrl: (taskId: string) => `https://warondisease.org/tasks/${taskId}`,
}));

import { notifyTaskAssigneeOfAssignment } from "@/lib/tasks/task-assignment-notifications.server";

function mockAssignedOrganizationTask(overrides?: {
  contactEmail?: string | null;
  members?: Array<{
    role: string;
    user: { email: string | null; id: string };
  }>;
}) {
  mocks.taskFindUnique.mockResolvedValue({
    assigneeOrganization: {
      contactEmail:
        overrides && "contactEmail" in overrides
          ? (overrides.contactEmail ?? null)
          : "demo@thinkbynumbers.org",
      id: "org_iam",
      members: overrides?.members ?? [],
      name: "Institute for Accelerated Medicine",
    },
    assigneePerson: null,
    deletedAt: null,
    description:
      "Put the survey link on your site and share it once with your members.",
    id: "task_iam",
    title: "Share the Clinical Trial Abundance Survey with your members",
  });
}

describe("notifyTaskAssigneeOfAssignment", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.draftTaskNotification.mockResolvedValue({ id: "comm_1" });
    mocks.sendDraftTaskNotification.mockResolvedValue({ status: "sent" });
  });

  it("sends organization-assigned tasks to the organization contact email", async () => {
    mockAssignedOrganizationTask();

    const result = await notifyTaskAssigneeOfAssignment({
      senderUserId: "demo-user-id",
      taskId: "task_iam",
    });

    expect(result).toEqual({ status: "sent" });
    expect(mocks.draftTaskNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        dedupeKey: "task-assignment:task_iam:demo@thinkbynumbers.org",
        purpose: "ASSIGNMENT",
        recipientEmail: "demo@thinkbynumbers.org",
        recipientName: "Institute for Accelerated Medicine",
        recipientOrganizationId: "org_iam",
        recipientUserId: null,
        senderUserId: "demo-user-id",
        subject:
          "New task: Share the Clinical Trial Abundance Survey with your members",
        taskId: "task_iam",
      }),
    );
    expect(mocks.draftTaskNotification.mock.calls[0]?.[0].text).toContain(
      "Put the survey link on your site",
    );
    expect(mocks.sendDraftTaskNotification).toHaveBeenCalledWith({
      communicationId: "comm_1",
      senderUserId: "demo-user-id",
    });
  });

  it("falls back to an owner email when the organization has no contact email", async () => {
    mockAssignedOrganizationTask({
      contactEmail: null,
      members: [
        {
          role: "owner",
          user: { email: "OWNER@Example.org", id: "user_owner" },
        },
      ],
    });

    await notifyTaskAssigneeOfAssignment({
      senderUserId: "demo-user-id",
      taskId: "task_iam",
    });

    expect(mocks.draftTaskNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        dedupeKey: "task-assignment:task_iam:owner@example.org",
        recipientEmail: "owner@example.org",
        recipientOrganizationId: "org_iam",
        recipientUserId: "user_owner",
      }),
    );
  });

  it("skips assigned tasks when no assignee email exists", async () => {
    mockAssignedOrganizationTask({ contactEmail: null, members: [] });

    await expect(
      notifyTaskAssigneeOfAssignment({ taskId: "task_iam" }),
    ).resolves.toEqual({
      reason: "no_assignee_email",
      status: "skipped",
    });

    expect(mocks.draftTaskNotification).not.toHaveBeenCalled();
    expect(mocks.sendDraftTaskNotification).not.toHaveBeenCalled();
  });

  it("returns a failed result instead of throwing when lookup fails", async () => {
    mocks.taskFindUnique.mockRejectedValue(new Error("database paused"));

    await expect(
      notifyTaskAssigneeOfAssignment({ taskId: "task_iam" }),
    ).resolves.toEqual({
      reason: "database paused",
      status: "failed",
    });

    expect(mocks.draftTaskNotification).not.toHaveBeenCalled();
    expect(mocks.sendDraftTaskNotification).not.toHaveBeenCalled();
  });
});
