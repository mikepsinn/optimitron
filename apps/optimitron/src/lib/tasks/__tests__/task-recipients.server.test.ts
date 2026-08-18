import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  taskFindUnique: vi.fn(),
  userFindMany: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    task: {
      findUnique: mocks.taskFindUnique,
    },
    user: {
      findMany: mocks.userFindMany,
    },
  },
}));

import {
  resolveTaskRecipient,
  resolveTaskRecipients,
} from "@/lib/tasks/task-recipients.server";

describe("resolveTaskRecipient", () => {
  beforeEach(() => {
    mocks.taskFindUnique.mockReset();
    mocks.userFindMany.mockReset();
    mocks.userFindMany.mockResolvedValue([]);
  });

  it("returns null when the task does not exist", async () => {
    mocks.taskFindUnique.mockResolvedValue(null);
    const result = await resolveTaskRecipient("task_missing");
    expect(result).toBeNull();
  });

  it("returns null when the task is soft-deleted", async () => {
    mocks.taskFindUnique.mockResolvedValue({
      assigneeOrganization: null,
      assigneePerson: null,
      communicationEndpoints: [],
      deletedAt: new Date(),
      id: "task_1",
    });
    const result = await resolveTaskRecipient("task_1");
    expect(result).toBeNull();
  });

  it("prefers the assignee user's email", async () => {
    mocks.taskFindUnique.mockResolvedValue({
      assigneeOrganization: null,
      assigneePerson: {
        deletedAt: null,
        email: "person-fallback@example.com",
        id: "person_1",
        user: {
          deletedAt: null,
          email: "User@Example.COM",
          id: "user_1",
        },
      },
      communicationEndpoints: [],
      deletedAt: null,
      id: "task_1",
      isPublic: true,
      status: "ACTIVE",
    });
    const result = await resolveTaskRecipient("task_1");
    expect(result).toEqual({
      email: "user@example.com",
      personId: "person_1",
      reason: "You're getting this because this task is assigned to you.",
      role: "assignee_user",
      userId: "user_1",
    });
  });

  it("falls through to the person email when the user is deleted", async () => {
    mocks.taskFindUnique.mockResolvedValue({
      assigneeOrganization: null,
      assigneePerson: {
        deletedAt: null,
        email: "person@example.com",
        id: "person_1",
        user: {
          deletedAt: new Date(),
          email: "stale@example.com",
          id: "user_1",
        },
      },
      communicationEndpoints: [],
      deletedAt: null,
      id: "task_1",
      isPublic: true,
      status: "ACTIVE",
    });
    const result = await resolveTaskRecipient("task_1");
    expect(result).toEqual({
      email: "person@example.com",
      personId: "person_1",
      reason: "You're getting this because this task is assigned to you.",
      role: "assignee_person",
    });
  });

  it("falls through to the organization contact email when no person is set", async () => {
    mocks.taskFindUnique.mockResolvedValue({
      assigneeOrganization: {
        contactEmail: "ORG@Example.com",
        deletedAt: null,
        id: "org_1",
      },
      assigneePerson: null,
      communicationEndpoints: [],
      deletedAt: null,
      id: "task_1",
      isPublic: true,
      status: "ACTIVE",
    });
    const result = await resolveTaskRecipient("task_1");
    expect(result).toEqual({
      email: "org@example.com",
      organizationId: "org_1",
      reason:
        "You're getting this because this task is assigned to your organization.",
      role: "assignee_organization",
    });
  });

  it("falls through to the primary email endpoint when no assignee is set", async () => {
    mocks.taskFindUnique.mockResolvedValue({
      assigneeOrganization: null,
      assigneePerson: null,
      communicationEndpoints: [
        { email: "endpoint@example.com", id: "endpoint_1" },
      ],
      deletedAt: null,
      id: "task_1",
      isPublic: true,
      status: "ACTIVE",
    });
    const result = await resolveTaskRecipient("task_1");
    expect(result).toEqual({
      email: "endpoint@example.com",
      endpointId: "endpoint_1",
      reason:
        "You're getting this because this email address is listed as the task contact.",
      role: "endpoint",
    });
  });

  it("accepts primary mailto endpoints that carry an email address", async () => {
    mocks.taskFindUnique.mockResolvedValue({
      assigneeOrganization: null,
      assigneePerson: null,
      communicationEndpoints: [
        { email: "mailto@example.com", id: "endpoint_mailto" },
      ],
      deletedAt: null,
      id: "task_1",
      isPublic: true,
      status: "ACTIVE",
    });
    const result = await resolveTaskRecipient("task_1");
    expect(mocks.taskFindUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        select: expect.objectContaining({
          communicationEndpoints: expect.objectContaining({
            where: expect.objectContaining({
              kind: { in: ["EMAIL", "MAILTO"] },
            }),
          }),
        }),
      }),
    );
    expect(result).toEqual({
      email: "mailto@example.com",
      endpointId: "endpoint_mailto",
      reason:
        "You're getting this because this email address is listed as the task contact.",
      role: "endpoint",
    });
  });

  it("returns null when nothing resolves", async () => {
    mocks.taskFindUnique.mockResolvedValue({
      assigneeOrganization: null,
      assigneePerson: null,
      communicationEndpoints: [],
      deletedAt: null,
      id: "task_1",
      isPublic: true,
      status: "ACTIVE",
    });
    const result = await resolveTaskRecipient("task_1");
    expect(result).toBeNull();
  });

  it("does not fall back to creator or admin recipients", async () => {
    mocks.taskFindUnique.mockResolvedValue({
      assigneeOrganization: null,
      assigneePerson: null,
      assigneePersonId: null,
      assigneeOrganizationId: null,
      createdByUser: {
        deletedAt: null,
        email: "creator@example.com",
        id: "creator_1",
      },
      communicationEndpoints: [],
      deletedAt: null,
      id: "task_1",
      isPublic: true,
      status: "ACTIVE",
    });
    mocks.userFindMany.mockResolvedValue([
      { id: "admin_1", email: "admin@example.com" },
      { id: "creator_1", email: "creator@example.com" },
    ]);

    const result = await resolveTaskRecipients("task_1");
    expect(result).toEqual([]);
    expect(mocks.userFindMany).not.toHaveBeenCalled();
  });

  it("includes creator and admin monitor recipients only when requested", async () => {
    mocks.taskFindUnique.mockResolvedValue({
      assigneeOrganization: null,
      assigneePerson: null,
      assigneePersonId: null,
      assigneeOrganizationId: null,
      createdByUser: {
        deletedAt: null,
        email: "creator@example.com",
        id: "creator_1",
      },
      communicationEndpoints: [],
      deletedAt: null,
      id: "task_1",
      isPublic: true,
      status: "ACTIVE",
    });
    mocks.userFindMany.mockResolvedValue([
      { id: "admin_1", email: "admin@example.com" },
      { id: "creator_1", email: "creator@example.com" },
    ]);

    const result = await resolveTaskRecipients("task_1", {
      includeAdminMonitors: true,
      includeCreator: true,
    });
    expect(result).toEqual([
      {
        email: "creator@example.com",
        reason: "You're getting this because you created this task.",
        role: "creator",
        userId: "creator_1",
      },
      {
        email: "admin@example.com",
        isAdmin: true,
        reason:
          "You're getting this admin copy because task email monitoring is turned on.",
        role: "admin_monitor",
        userId: "admin_1",
      },
    ]);
  });

  it("deduplicates direct assignee and endpoint recipients by email", async () => {
    mocks.taskFindUnique.mockResolvedValue({
      assigneeOrganization: null,
      assigneePerson: {
        deletedAt: null,
        email: "same@example.com",
        id: "person_1",
        user: null,
      },
      communicationEndpoints: [{ id: "endpoint_1", email: "Same@Example.com" }],
      deletedAt: null,
      id: "task_1",
      isPublic: true,
      status: "ACTIVE",
    });

    const result = await resolveTaskRecipients("task_1");
    expect(result).toEqual([
      {
        email: "same@example.com",
        personId: "person_1",
        reason: "You're getting this because this task is assigned to you.",
        role: "assignee_person",
      },
    ]);
  });
});

describe("private/draft task guard", () => {
  beforeEach(() => {
    mocks.taskFindUnique.mockReset();
    mocks.userFindMany.mockReset();
    mocks.userFindMany.mockResolvedValue([]);
  });

  function privateTaskWithExternals(overrides: Record<string, unknown> = {}) {
    return {
      assigneeOrganization: {
        contactEmail: "org@example.com",
        deletedAt: null,
        id: "org_1",
      },
      assigneePerson: {
        deletedAt: null,
        email: "person@example.com",
        id: "person_1",
        user: null,
      },
      communicationEndpoints: [
        { email: "endpoint@example.com", id: "endpoint_1" },
      ],
      createdByUser: null,
      deletedAt: null,
      id: "task_1",
      isPublic: false,
      status: "ACTIVE",
      ...overrides,
    };
  }

  it("drops external recipients for private tasks", async () => {
    mocks.taskFindUnique.mockResolvedValue(privateTaskWithExternals());
    await expect(resolveTaskRecipients("task_1")).resolves.toEqual([]);
  });

  it("drops external recipients for DRAFT tasks even when public", async () => {
    mocks.taskFindUnique.mockResolvedValue(
      privateTaskWithExternals({ isPublic: true, status: "DRAFT" }),
    );
    await expect(resolveTaskRecipients("task_1")).resolves.toEqual([]);
  });

  it("keeps User-account recipients on private tasks", async () => {
    mocks.taskFindUnique.mockResolvedValue(
      privateTaskWithExternals({
        assigneePerson: {
          deletedAt: null,
          email: "person@example.com",
          id: "person_1",
          user: { deletedAt: null, email: "user@example.com", id: "user_1" },
        },
        createdByUser: {
          deletedAt: null,
          email: "creator@example.com",
          id: "creator_1",
        },
      }),
    );

    const result = await resolveTaskRecipients("task_1", {
      includeCreator: true,
    });
    expect(result.map((recipient) => recipient.email)).toEqual([
      "user@example.com",
      "creator@example.com",
    ]);
    expect(result.every((recipient) => Boolean(recipient.userId))).toBe(true);
  });

  it("keeps external recipients when the explicit override is passed", async () => {
    mocks.taskFindUnique.mockResolvedValue(privateTaskWithExternals());

    const result = await resolveTaskRecipients("task_1", {
      allowExternalOnRestrictedTask: true,
    });
    expect(result.map((recipient) => recipient.role)).toEqual([
      "assignee_person",
      "assignee_organization",
      "endpoint",
    ]);
  });
});
