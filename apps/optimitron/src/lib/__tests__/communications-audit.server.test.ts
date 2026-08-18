import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  taskCommunicationCount: vi.fn(),
  taskCommunicationFindFirst: vi.fn(),
  taskCommunicationFindMany: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    taskCommunication: {
      count: mocks.taskCommunicationCount,
      findFirst: mocks.taskCommunicationFindFirst,
      findMany: mocks.taskCommunicationFindMany,
    },
  },
}));

import {
  clampCommunicationsLimit,
  getCommunicationLogForViewer,
  listCommunicationsForViewer,
  maskEmail,
} from "@/lib/communications-audit.server";

const ADMIN = { isAdmin: true, personId: null, userId: "admin-1" };
const MEMBER = { isAdmin: false, personId: "person-1", userId: "user-1" };

function makeRow(overrides: Record<string, unknown> = {}) {
  return {
    channel: "EMAIL",
    createdAt: new Date("2026-07-01T00:00:00.000Z"),
    direction: "OUTBOUND",
    errorMessage: null,
    id: "comm-1",
    metadataJson: { subject: "Hello", text: "Please vote on the treaty." },
    recipientEmail: "joe@example.org",
    recipientNameSnapshot: "Joe Recipient",
    recipientOrganization: null,
    recipientPerson: null,
    recipientUser: null,
    sentAt: new Date("2026-07-01T00:05:00.000Z"),
    status: "SENT",
    task: { id: "task-1", title: "Get Joe to vote" },
    taskComment: { id: "comment-1", message: "Please vote on the treaty." },
    taskCommentId: "comment-1",
    taskId: "task-1",
    ...overrides,
  };
}

function makeDetailRow(overrides: Record<string, unknown> = {}) {
  return makeRow({
    audience: "ASSIGNEE",
    cancelledAt: null,
    emailLog: {
      bouncedAt: null,
      deliveredAt: new Date("2026-07-01T00:06:00.000Z"),
      errorMessage: null,
      id: "email-log-1",
      openedAt: null,
      providerMessageId: "resend-123",
      sentAt: new Date("2026-07-01T00:05:00.000Z"),
      status: "DELIVERED",
      subject: "Hello",
      templateId: "task_notification:reminder:step_0",
      toAddress: "joe@example.org",
    },
    endpointId: null,
    externalUrl: "mailto:joe@example.org",
    failedAt: null,
    format: "DEFAULT",
    metadataJson: {
      bccEmails: ["admin@example.org"],
      dedupeKey: "task-comment-notification:comment-1:joe@example.org",
      html: "<p>Please vote on the treaty.</p>",
      messageId: "<task-task-1-comm-comm-1@updates.warondisease.org>",
      subject: "Hello",
      text: "Please vote on the treaty.",
      unsubscribeUrl: "https://warondisease.org/unsub?t=secret",
    },
    providerMessageId: "resend-123",
    purpose: "REMINDER",
    receivedAt: null,
    step: 0,
    taskComment: {
      createdAt: new Date("2026-07-01T00:00:00.000Z"),
      id: "comment-1",
      kind: "OUTBOUND_MESSAGE",
      message: "Please vote on the treaty.",
    },
    ...overrides,
  });
}

beforeEach(() => {
  mocks.taskCommunicationCount.mockReset();
  mocks.taskCommunicationFindFirst.mockReset();
  mocks.taskCommunicationFindMany.mockReset();
  mocks.taskCommunicationFindMany.mockResolvedValue([]);
  mocks.taskCommunicationCount.mockResolvedValue(0);
});

describe("maskEmail", () => {
  it("keeps the first character and the domain", () => {
    expect(maskEmail("m@thinkbynumbers.org")).toBe("m***@thinkbynumbers.org");
    expect(maskEmail("joe.smith@example.org")).toBe("j***@example.org");
  });

  it("masks malformed addresses entirely and passes through null", () => {
    expect(maskEmail("not-an-email")).toBe("***");
    expect(maskEmail("@lead.example.org")).toBe("***");
    expect(maskEmail(null)).toBeNull();
    expect(maskEmail("  ")).toBeNull();
  });
});

describe("clampCommunicationsLimit", () => {
  it("defaults to 50 and caps at 200", () => {
    expect(clampCommunicationsLimit(null)).toBe(50);
    expect(clampCommunicationsLimit(Number.NaN)).toBe(50);
    expect(clampCommunicationsLimit(0)).toBe(1);
    expect(clampCommunicationsLimit(999)).toBe(200);
    expect(clampCommunicationsLimit(25.9)).toBe(25);
  });
});

describe("listCommunicationsForViewer", () => {
  it("scopes non-admin viewers to tasks they created or are assigned to", async () => {
    await listCommunicationsForViewer(MEMBER, {});

    const where = mocks.taskCommunicationFindMany.mock.calls[0]?.[0]?.where;
    expect(where).toMatchObject({
      deletedAt: null,
      task: {
        deletedAt: null,
        OR: [
          { createdByUserId: "user-1" },
          { assigneePersonId: "person-1" },
        ],
      },
    });
    // count runs against the identical where clause
    expect(mocks.taskCommunicationCount.mock.calls[0]?.[0]?.where).toEqual(
      where,
    );
  });

  it("does not scope admin viewers by task ownership", async () => {
    await listCommunicationsForViewer(ADMIN, {});

    const where = mocks.taskCommunicationFindMany.mock.calls[0]?.[0]?.where;
    expect(where).toEqual({ deletedAt: null });
  });

  it("matches nothing for an anonymous non-admin viewer", async () => {
    await listCommunicationsForViewer(
      { isAdmin: false, personId: null, userId: null },
      {},
    );

    const where = mocks.taskCommunicationFindMany.mock.calls[0]?.[0]?.where;
    expect(where).toMatchObject({ id: "__no_viewer__" });
  });

  it("applies task, channel, status, and date-range filters", async () => {
    await listCommunicationsForViewer(ADMIN, {
      channel: "EMAIL",
      since: new Date("2026-07-01T00:00:00.000Z"),
      status: "FAILED",
      taskId: "task-9",
      until: new Date("2026-07-02T00:00:00.000Z"),
    });

    expect(mocks.taskCommunicationFindMany.mock.calls[0]?.[0]?.where).toEqual({
      channel: "EMAIL",
      createdAt: {
        gte: new Date("2026-07-01T00:00:00.000Z"),
        lte: new Date("2026-07-02T00:00:00.000Z"),
      },
      deletedAt: null,
      status: "FAILED",
      taskId: "task-9",
    });
  });

  it("masks recipient emails for non-admin viewers and keeps them for admins", async () => {
    mocks.taskCommunicationFindMany.mockResolvedValue([makeRow()]);
    mocks.taskCommunicationCount.mockResolvedValue(1);

    const memberResult = await listCommunicationsForViewer(MEMBER, {});
    const adminResult = await listCommunicationsForViewer(ADMIN, {});

    expect(memberResult.communications[0]?.recipient).toEqual({
      email: "j***@example.org",
      name: "Joe Recipient",
    });
    expect(adminResult.communications[0]?.recipient).toEqual({
      email: "joe@example.org",
      name: "Joe Recipient",
    });
    expect(memberResult.total).toBe(1);
  });

  it("previews the message to ~140 characters", async () => {
    mocks.taskCommunicationFindMany.mockResolvedValue([
      makeRow({
        metadataJson: { text: "word ".repeat(60) },
        taskComment: null,
        taskCommentId: null,
      }),
    ]);
    mocks.taskCommunicationCount.mockResolvedValue(1);

    const result = await listCommunicationsForViewer(ADMIN, {});
    const preview = result.communications[0]?.messagePreview ?? "";
    expect(preview.length).toBeLessThanOrEqual(140);
    expect(preview.endsWith("…")).toBe(true);
  });

  it("surfaces kill-switch suppressions as a first-class reason", async () => {
    mocks.taskCommunicationFindMany.mockResolvedValue([
      makeRow({
        errorMessage: "send_aborted:suppressed:outbound_mode_off",
        status: "FAILED",
      }),
    ]);
    mocks.taskCommunicationCount.mockResolvedValue(1);

    const result = await listCommunicationsForViewer(ADMIN, {});
    expect(result.communications[0]?.suppressionReason).toBe(
      "outbound_mode_off",
    );
    expect(result.communications[0]?.status).toBe("FAILED");
  });
});

describe("getCommunicationLogForViewer", () => {
  it("returns null when the row is missing or out of scope", async () => {
    mocks.taskCommunicationFindFirst.mockResolvedValue(null);

    await expect(
      getCommunicationLogForViewer(MEMBER, "comm-404"),
    ).resolves.toBeNull();

    expect(
      mocks.taskCommunicationFindFirst.mock.calls[0]?.[0]?.where,
    ).toMatchObject({
      deletedAt: null,
      id: "comm-404",
      task: { OR: expect.any(Array) },
    });
  });

  it("redacts delivery address, external URL, html, and raw metadata for non-admins", async () => {
    mocks.taskCommunicationFindFirst.mockResolvedValue(makeDetailRow());

    const result = await getCommunicationLogForViewer(MEMBER, "comm-1");

    expect(result?.delivery?.toAddress).toBe("j***@example.org");
    expect(result?.delivery?.providerMessageId).toBe("resend-123");
    expect(result?.envelope.externalUrl).toBeNull();
    expect(result?.body.html).toBeNull();
    expect(result?.body.comment?.message).toBe("Please vote on the treaty.");
    expect(result && "metadataJson" in result).toBe(false);
    expect(result?.trigger.dedupeKey).toBe(
      "task-comment-notification:comment-1:joe@example.org",
    );
  });

  it("gives admins the unredacted envelope", async () => {
    mocks.taskCommunicationFindFirst.mockResolvedValue(makeDetailRow());

    const result = await getCommunicationLogForViewer(ADMIN, "comm-1");

    expect(result?.delivery?.toAddress).toBe("joe@example.org");
    expect(result?.envelope.externalUrl).toBe("mailto:joe@example.org");
    expect(result?.body.html).toBe("<p>Please vote on the treaty.</p>");
    expect(result?.metadataJson).toMatchObject({
      bccEmails: ["admin@example.org"],
    });
    expect(
      mocks.taskCommunicationFindFirst.mock.calls[0]?.[0]?.where,
    ).toEqual({ deletedAt: null, id: "comm-1" });
  });
});
