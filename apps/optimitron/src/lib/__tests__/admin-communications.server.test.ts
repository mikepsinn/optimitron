import { TaskCommunicationChannel } from "@optimitron/db";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  emailLogCount: vi.fn(),
  emailLogFindMany: vi.fn(),
  organizationFindMany: vi.fn(),
  personFindMany: vi.fn(),
  taskCommunicationCount: vi.fn(),
  taskCommunicationFindMany: vi.fn(),
  userFindMany: vi.fn(),
}));

vi.mock("../prisma", () => ({
  prisma: {
    emailLog: {
      count: mocks.emailLogCount,
      findMany: mocks.emailLogFindMany,
    },
    organization: {
      findMany: mocks.organizationFindMany,
    },
    person: {
      findMany: mocks.personFindMany,
    },
    taskCommunication: {
      count: mocks.taskCommunicationCount,
      findMany: mocks.taskCommunicationFindMany,
    },
    user: {
      findMany: mocks.userFindMany,
    },
  },
}));

import {
  listAdminCommunicationDirectory,
  listAdminEmailLogs,
  listAdminTaskEmailCommunications,
} from "../admin-communications.server";
import { ORGANIZATION_ACTIVATION_TASK_TITLE } from "../messaging";

const sentAt = new Date("2026-05-06T12:00:00.000Z");
const organizationTaskSubject = `New task: ${ORGANIZATION_ACTIVATION_TASK_TITLE}`;

beforeEach(() => {
  for (const fn of Object.values(mocks)) fn.mockReset();
});

describe("admin communications", () => {
  it("lists task email communications with task, email, and search filters", async () => {
    mocks.taskCommunicationFindMany.mockResolvedValue([
      {
        audience: "ASSIGNEE",
        channel: "EMAIL",
        createdAt: sentAt,
        direction: "OUTBOUND",
        emailLog: {
          bouncedAt: null,
          deliveredAt: null,
          errorMessage: null,
          id: "email-log-1",
          openedAt: null,
          providerMessageId: "provider-1",
          sentAt,
          status: "SENT",
          subject: organizationTaskSubject,
          templateId: "task_assignment",
          toAddress: "team@example.org",
        },
        emailLogId: "email-log-1",
        errorMessage: null,
        failedAt: null,
        id: "communication-1",
        metadataJson: {
          subject: organizationTaskSubject,
          text: "Please embed the survey and share it with your members.",
        },
        purpose: "ASSIGNMENT",
        receivedAt: null,
        recipientEmail: "team@example.org",
        recipientNameSnapshot: "Meridian Research Foundation",
        recipientOrganization: {
          contactEmail: "team@example.org",
          id: "org-1",
          name: "Meridian Research Foundation",
          slug: "meridian-research-foundation",
        },
        recipientPerson: null,
        recipientUser: null,
        senderUser: null,
        sentAt,
        status: "SENT",
        task: {
          id: "task-1",
          taskKey: "organization:org-1:activate",
          title: ORGANIZATION_ACTIVATION_TASK_TITLE,
        },
        taskId: "task-1",
      },
    ]);
    mocks.taskCommunicationCount.mockResolvedValue(1);

    const result = await listAdminTaskEmailCommunications({
      email: "team@example.org",
      limit: 10,
      q: "survey",
      taskId: "task-1",
    });

    expect(mocks.taskCommunicationFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 10,
        where: expect.objectContaining({
          AND: expect.any(Array),
          channel: TaskCommunicationChannel.EMAIL,
          taskId: "task-1",
        }),
      }),
    );
    expect(
      JSON.stringify(mocks.taskCommunicationFindMany.mock.calls[0]![0].where),
    ).toContain("team@example.org");
    expect(result.total).toBe(1);
    expect(result.communications[0]?.subject).toBe(organizationTaskSubject);
    expect(result.communications[0]?.messagePreview).toContain(
      "Please embed the survey",
    );
  });

  it("filters email logs through linked task communications", async () => {
    mocks.emailLogFindMany.mockResolvedValue([]);
    mocks.emailLogCount.mockResolvedValue(0);

    await listAdminEmailLogs({
      organizationId: "org-1",
      personId: "person-1",
      taskId: "task-1",
    });

    const where = mocks.emailLogFindMany.mock.calls[0]![0].where;
    expect(JSON.stringify(where)).toContain("task-1");
    expect(JSON.stringify(where)).toContain("person-1");
    expect(JSON.stringify(where)).toContain("org-1");
  });

  it("lists users, people, and organizations for admin directory searches", async () => {
    mocks.userFindMany.mockResolvedValue([
      {
        _count: {
          emailLogs: 2,
          receivedTaskCommunications: 1,
          sentTaskCommunications: 0,
        },
        createdAt: sentAt,
        email: "demo@thinkbynumbers.org",
        id: "user-1",
        isAdmin: true,
        person: {
          displayName: "Demo Human",
          handle: "demo",
          id: "person-1",
        },
      },
    ]);
    mocks.personFindMany.mockResolvedValue([
      {
        _count: {
          receivedTaskCommunications: 3,
          sentTaskCommunications: 1,
        },
        createdAt: sentAt,
        currentAffiliation: "Meridian Research Foundation",
        displayName: "Demo Human",
        email: "demo@thinkbynumbers.org",
        handle: "demo",
        id: "person-1",
        user: { email: "demo@thinkbynumbers.org", id: "user-1" },
      },
    ]);
    mocks.organizationFindMany.mockResolvedValue([
      {
        _count: {
          assignedTasks: 1,
          receivedTaskCommunications: 1,
        },
        contactEmail: "team@example.org",
        createdAt: sentAt,
        id: "org-1",
        name: "Meridian Research Foundation",
        slug: "meridian-research-foundation",
        status: "APPROVED",
        type: "NONPROFIT",
        website: "https://example.org",
      },
    ]);

    const result = await listAdminCommunicationDirectory({
      limit: 5,
      q: "Meridian",
    });

    expect(mocks.userFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 5 }),
    );
    expect(mocks.personFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 5 }),
    );
    expect(mocks.organizationFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 5 }),
    );
    expect(result.users[0]?.createdAt).toBe(sentAt.toISOString());
    expect(result.people[0]?.displayName).toBe("Demo Human");
    expect(result.organizations[0]?.name).toBe("Meridian Research Foundation");
  });
});
