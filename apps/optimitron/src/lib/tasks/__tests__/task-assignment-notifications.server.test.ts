import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  draftTaskNotification: vi.fn(),
  proposeOutboundMessage: vi.fn(),
  sendDraftTaskNotification: vi.fn(),
  taskFindUnique: vi.fn(),
  userFindUnique: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    task: {
      findUnique: mocks.taskFindUnique,
    },
    user: {
      findUnique: mocks.userFindUnique,
    },
  },
}));

vi.mock("@/lib/tasks/task-notifications.server", () => ({
  draftTaskNotification: mocks.draftTaskNotification,
  sendDraftTaskNotification: mocks.sendDraftTaskNotification,
}));

vi.mock("@/lib/email/outbound-message-approval.server", () => ({
  proposeOutboundMessage: mocks.proposeOutboundMessage,
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
import type { OwnerSendAuthorization } from "@/lib/email/outbound-authorization.server";
import { ORGANIZATION_ACTIVATION_TASK_TITLE } from "@/lib/messaging";

const OWNER_AUTHORIZATION = {
  kind: "owner",
  userId: "demo-user-id",
} as unknown as OwnerSendAuthorization;

function mockAssignedOrganizationTask(overrides?: {
  contactEmail?: string | null;
  isPublic?: boolean;
  members?: Array<{
    role: string;
    user: { email: string | null; id: string };
  }>;
  status?: string;
}) {
  mocks.taskFindUnique.mockResolvedValue({
    assigneeOrganization: {
      contactEmail:
        overrides && "contactEmail" in overrides
          ? (overrides.contactEmail ?? null)
          : "demo@thinkbynumbers.org",
      id: "org_meridian",
      members: overrides?.members ?? [],
      name: "Meridian Research Foundation",
    },
    assigneePerson: null,
    deletedAt: null,
    description:
      "Put the survey link on your site and share it once with your members.",
    id: "task_meridian",
    isPublic: overrides?.isPublic ?? true,
    status: overrides?.status ?? "ACTIVE",
    title: ORGANIZATION_ACTIVATION_TASK_TITLE,
  });
}

describe("notifyTaskAssigneeOfAssignment", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.draftTaskNotification.mockResolvedValue({ id: "comm_1" });
    mocks.proposeOutboundMessage.mockResolvedValue({ id: "ear_1" });
    mocks.sendDraftTaskNotification.mockResolvedValue({
      providerMessageId: "email_1",
      status: "sent",
    });
    mocks.userFindUnique.mockResolvedValue({
      id: "demo-user-id",
      email: "demo@warondisease.org",
      person: {
        id: "person_demo",
        handle: "mike",
        displayName: "Mike",
        image: null,
      },
    });
  });

  it("sends organization-assigned tasks to the organization contact email", async () => {
    mockAssignedOrganizationTask();

    const result = await notifyTaskAssigneeOfAssignment({
      senderUserId: "demo-user-id",
      taskId: "task_meridian",
    });

    // Assigning a task queues the email for approval; it does not send.
    expect(result).toEqual({
      externalActionRequestId: "ear_1",
      status: "pending_approval",
    });
    expect(mocks.draftTaskNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        dedupeKey: "task-assignment:task_meridian:demo@thinkbynumbers.org",
        purpose: "ASSIGNMENT",
        recipientEmail: "demo@thinkbynumbers.org",
        recipientName: "Meridian Research Foundation",
        recipientOrganizationId: "org_meridian",
        recipientUserId: null,
        senderUserId: "demo-user-id",
        subject: `New task: ${ORGANIZATION_ACTIVATION_TASK_TITLE}`,
        taskId: "task_meridian",
      }),
    );
    expect(mocks.draftTaskNotification.mock.calls[0]?.[0].text).toContain(
      "Put the survey link on your site",
    );
    expect(mocks.draftTaskNotification.mock.calls[0]?.[0].senderName).toBe(
      "Mike",
    );
    expect(mocks.proposeOutboundMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: "demo-user-id",
        communicationId: "comm_1",
        from: expect.stringMatching(
          /^Mike via International Campaign to End War and Disease </,
        ),
        taskId: "task_meridian",
      }),
    );
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
      taskId: "task_meridian",
    });

    expect(mocks.draftTaskNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        dedupeKey: "task-assignment:task_meridian:owner@example.org",
        recipientEmail: "owner@example.org",
        recipientOrganizationId: "org_meridian",
        recipientUserId: "user_owner",
      }),
    );
  });

  it("direct-sends only when the caller supplies session-minted owner authority", async () => {
    mockAssignedOrganizationTask();

    const result = await notifyTaskAssigneeOfAssignment({
      ownerAuthorization: OWNER_AUTHORIZATION,
      senderUserId: "demo-user-id",
      taskId: "task_meridian",
    });

    expect(result).toMatchObject({ status: "sent" });
    expect(mocks.sendDraftTaskNotification).toHaveBeenCalledWith({
      authorization: OWNER_AUTHORIZATION,
      communicationId: "comm_1",
      from: expect.stringMatching(
        /^Mike via International Campaign to End War and Disease </,
      ),
      senderUserId: "demo-user-id",
    });
    expect(mocks.proposeOutboundMessage).not.toHaveBeenCalled();
  });

  it("skips assigned tasks when no assignee email exists", async () => {
    mockAssignedOrganizationTask({ contactEmail: null, members: [] });

    await expect(
      notifyTaskAssigneeOfAssignment({ taskId: "task_meridian" }),
    ).resolves.toEqual({
      reason: "no_assignee_email",
      status: "skipped",
    });

    expect(mocks.draftTaskNotification).not.toHaveBeenCalled();
    expect(mocks.proposeOutboundMessage).not.toHaveBeenCalled();
  });

  it("skips private tasks whose assignee email has no User account", async () => {
    mockAssignedOrganizationTask({ isPublic: false });

    await expect(
      notifyTaskAssigneeOfAssignment({ taskId: "task_meridian" }),
    ).resolves.toEqual({
      reason: "private_task_external_recipient",
      status: "skipped",
    });
    expect(mocks.draftTaskNotification).not.toHaveBeenCalled();
    expect(mocks.proposeOutboundMessage).not.toHaveBeenCalled();
  });

  it("skips DRAFT tasks whose assignee email has no User account", async () => {
    mockAssignedOrganizationTask({ status: "DRAFT" });

    await expect(
      notifyTaskAssigneeOfAssignment({ taskId: "task_meridian" }),
    ).resolves.toEqual({
      reason: "private_task_external_recipient",
      status: "skipped",
    });
    expect(mocks.draftTaskNotification).not.toHaveBeenCalled();
  });

  it("still notifies User-account assignees on private tasks", async () => {
    mockAssignedOrganizationTask({
      contactEmail: null,
      isPublic: false,
      members: [
        {
          role: "owner",
          user: { email: "owner@example.org", id: "user_owner" },
        },
      ],
    });

    const result = await notifyTaskAssigneeOfAssignment({
      senderUserId: "demo-user-id",
      taskId: "task_meridian",
    });

    expect(result).toEqual({
      externalActionRequestId: "ear_1",
      status: "pending_approval",
    });
    expect(mocks.draftTaskNotification).toHaveBeenCalledWith(
      expect.objectContaining({ recipientUserId: "user_owner" }),
    );
  });

  it("returns a failed result instead of throwing when lookup fails", async () => {
    mocks.taskFindUnique.mockRejectedValue(new Error("database paused"));

    await expect(
      notifyTaskAssigneeOfAssignment({ taskId: "task_meridian" }),
    ).resolves.toEqual({
      reason: "database paused",
      status: "failed",
    });

    expect(mocks.draftTaskNotification).not.toHaveBeenCalled();
    expect(mocks.proposeOutboundMessage).not.toHaveBeenCalled();
  });
});
