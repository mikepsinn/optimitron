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
    });
    const result = await resolveTaskRecipient("task_1");
    expect(result).toEqual({
      email: "user@example.com",
      personId: "person_1",
      userId: "user_1",
      isAdmin: false,
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
    });
    const result = await resolveTaskRecipient("task_1");
    expect(result).toEqual({
      email: "person@example.com",
      personId: "person_1",
      isAdmin: false,
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
    });
    const result = await resolveTaskRecipient("task_1");
    expect(result).toEqual({
      email: "org@example.com",
      organizationId: "org_1",
      isAdmin: false,
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
    });
    const result = await resolveTaskRecipient("task_1");
    expect(result).toEqual({
      email: "endpoint@example.com",
      endpointId: "endpoint_1",
      isAdmin: false,
    });
  });

  it("returns null when nothing resolves", async () => {
    mocks.taskFindUnique.mockResolvedValue({
      assigneeOrganization: null,
      assigneePerson: null,
      communicationEndpoints: [],
      deletedAt: null,
      id: "task_1",
    });
    const result = await resolveTaskRecipient("task_1");
    expect(result).toBeNull();
  });

  it("includes owner and admin recipients", async () => {
    mocks.taskFindUnique.mockResolvedValue({
      assigneeOrganization: null,
      assigneePerson: null,
      assigneePersonId: null,
      assigneeOrganizationId: null,
      owner: {
        deletedAt: null,
        email: "owner@example.com",
        id: "owner_1",
      },
      communicationEndpoints: [],
      deletedAt: null,
      id: "task_1",
    });
    mocks.userFindMany.mockResolvedValue([
      { id: "admin_1", email: "admin@example.com" },
      { id: "owner_1", email: "owner@example.com" },
    ]);

    const result = await resolveTaskRecipients("task_1");
    expect(result).toEqual([
      { email: "owner@example.com", isAdmin: false, userId: "owner_1" },
      { email: "admin@example.com", isAdmin: true, userId: "admin_1" },
    ]);
  });

  it("deduplicates admin recipients by email", async () => {
    mocks.taskFindUnique.mockResolvedValue({
      assigneeOrganization: null,
      assigneePerson: null,
      communicationEndpoints: [],
      owner: null,
      deletedAt: null,
      id: "task_1",
    });
    mocks.userFindMany.mockResolvedValue([
      { id: "admin_1", email: "Admin@Example.com" },
      { id: "admin_2", email: "admin@example.com" },
    ]);

    const result = await resolveTaskRecipients("task_1");
    expect(result).toEqual([{ email: "admin@example.com", isAdmin: true, userId: "admin_1" }]);
  });
});
