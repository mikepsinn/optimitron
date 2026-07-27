import { Prisma, TaskCommentKind, TaskCommentSource } from "@optimitron/db";
import { WAR_ON_DISEASE_REPLY_DOMAIN } from "@optimitron/db/system-identities";
import { describe, expect, it, vi } from "vitest";
import { processInboundReply, stripQuotedReply } from "../inbound-reply";

const notificationMocks = vi.hoisted(() => ({
  notifyTaskCommentRecipients: vi.fn().mockResolvedValue({
    commentId: "comment_1",
    status: "sent",
  }),
}));

vi.mock("@/lib/email/task-notification", async () => {
  const actual = await vi.importActual<
    typeof import("@/lib/email/task-notification")
  >("@/lib/email/task-notification");
  return {
    ...actual,
    getTaskUrl: (taskId: string) => `https://warondisease.org/tasks/${taskId}`,
  };
});

vi.mock("@/lib/tasks/task-comment-notifications.server", () => ({
  notifyTaskCommentRecipients: notificationMocks.notifyTaskCommentRecipients,
}));

/**
 * Unit tests for the inbound-reply quote stripper. Pure function — covers
 * the email-client conventions that show up in Gmail, Apple Mail, Outlook
 * desktop, and most mobile clients. End-to-end behavior of
 * `processInboundReply` (DB writes, sender auth) is exercised by the
 * production smoke test (assign task → reply → see comment).
 */
describe("stripQuotedReply", () => {
  it("returns the body unchanged when there's nothing to strip", () => {
    expect(stripQuotedReply("Hello, this is a fresh reply.")).toBe(
      "Hello, this is a fresh reply.",
    );
  });

  it("strips Gmail/Apple Mail 'On X, Y wrote:' attribution and below", () => {
    const body = [
      "Sounds good — let's proceed.",
      "",
      "On Mon, May 3, 2026 at 10:23 AM, Wishonia <wishonia@warondisease.org> wrote:",
      "> Original message body",
      "> with multiple lines",
    ].join("\n");
    expect(stripQuotedReply(body)).toBe("Sounds good — let's proceed.");
  });

  it("strips Outlook '-----Original Message-----' divider and below", () => {
    const body = [
      "Confirmed.",
      "",
      "-----Original Message-----",
      "From: someone",
      "Subject: re: thing",
      "",
      "Original body.",
    ].join("\n");
    expect(stripQuotedReply(body)).toBe("Confirmed.");
  });

  it("strips Outlook 'From: ... Sent: ... To:' header block and below", () => {
    const body = [
      "Yes, we'll fund it.",
      "",
      "From: Wishonia <wishonia@warondisease.org>",
      "Sent: Monday, May 3, 2026 10:23 AM",
      "To: foundation@example.org",
      "Subject: Grant ask",
      "",
      "Original body lives here.",
    ].join("\n");
    expect(stripQuotedReply(body)).toBe("Yes, we'll fund it.");
  });

  it("strips '> ' line-prefix quotes regardless of attribution", () => {
    const body = [
      "Reply body.",
      "> previous line 1",
      "> previous line 2",
      "Trailing reply text.",
    ].join("\n");
    expect(stripQuotedReply(body)).toBe(
      ["Reply body.", "Trailing reply text."].join("\n"),
    );
  });

  it("strips signature delimiter '-- '", () => {
    const body = [
      "Real reply.",
      "",
      "-- ",
      "John Doe",
      "Foundation Director",
    ].join("\n");
    expect(stripQuotedReply(body)).toBe("Real reply.");
  });

  it("normalizes CRLF line endings before processing", () => {
    const body = "Line one.\r\nLine two.\r\n> quoted\r\n";
    expect(stripQuotedReply(body)).toBe("Line one.\nLine two.");
  });

  it("returns empty string for empty input", () => {
    expect(stripQuotedReply("")).toBe("");
  });

  it("trims trailing whitespace", () => {
    expect(stripQuotedReply("Reply.\n\n\n")).toBe("Reply.");
  });
});

function inboundEvent(
  overrides: Partial<Parameters<typeof processInboundReply>[0]> = {},
) {
  return {
    from: "Assignee <assignee@example.org>",
    to: `reply+task_1@${WAR_ON_DISEASE_REPLY_DOMAIN}`,
    subject: "Re: task",
    text: "Done.",
    providerMessageId: "provider_msg_1",
    ...overrides,
  };
}

function makeInboundDb() {
  const db = {
    taskCommunication: {
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({
        id: "comm_1",
        ...data,
      })),
    },
    taskComment: {
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({
        id: "comment_1",
        ...data,
      })),
    },
    task: {
      findUnique: vi.fn().mockResolvedValue({
        id: "task_1",
        title: "Task",
        createdByUserId: null,
        createdByUser: null,
        assigneePerson: { id: "person_1", email: "assignee@example.org" },
        assigneeOrganization: null,
        communicationEndpoints: [],
      }),
    },
    user: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn(),
  };
  db.$transaction.mockImplementation(
    async (fn: (tx: typeof db) => Promise<unknown>) => fn(db),
  );
  return db;
}

describe("processInboundReply", () => {
  it("records inbound reviewer mail as a REPLY from the assigned Person", async () => {
    const db = makeInboundDb();

    await processInboundReply(inboundEvent(), db as never);

    expect(db.taskCommunication.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        purpose: "REPLY",
        senderPersonId: "person_1",
        senderUserId: null,
      }),
    });
  });

  it("rejects an inbound reply when the sender is not known on the task", async () => {
    const db = makeInboundDb();

    const result = await processInboundReply(
      inboundEvent({ from: "Stranger <stranger@example.org>" }),
      db as never,
    );

    expect(result).toEqual({
      status: "skipped",
      reason: "unauthorized sender",
    });
    expect(db.$transaction).not.toHaveBeenCalled();
    expect(db.taskComment.create).not.toHaveBeenCalled();
    expect(db.taskCommunication.create).not.toHaveBeenCalled();
  });

  it("accepts replies from a configured task communication endpoint", async () => {
    const db = makeInboundDb();
    db.task.findUnique.mockResolvedValue({
      id: "task_1",
      title: "Task",
      createdByUserId: null,
      createdByUser: null,
      assigneePerson: null,
      assigneeOrganization: null,
      communicationEndpoints: [{ email: "contact@example.org" }],
    });

    const result = await processInboundReply(
      inboundEvent({ from: "Contact <contact@example.org>" }),
      db as never,
    );

    expect(result).toMatchObject({
      status: "created",
      taskCommentId: "comment_1",
      taskCommunicationId: "comm_1",
    });
    expect(db.taskComment.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        authorNameSnapshot: "Contact",
        message: "Done.",
      }),
    });
  });

  it("nests inbound replies under the outbound comment referenced by Message-ID", async () => {
    const db = makeInboundDb();
    db.taskCommunication.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ taskCommentId: "comment_parent" });

    const result = await processInboundReply(
      inboundEvent({
        inReplyTo: "<task-task_1-comm-comm_1@updates.warondisease.org>",
      }),
      db as never,
    );

    expect(result).toMatchObject({
      status: "created",
      taskCommentId: "comment_1",
      taskCommunicationId: "comm_1",
    });
    expect(db.taskCommunication.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          metadataJson: {
            path: ["messageId"],
            equals: "<task-task_1-comm-comm_1@updates.warondisease.org>",
          },
          taskId: "task_1",
        }),
      }),
    );
    expect(db.taskComment.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        parentCommentId: "comment_parent",
      }),
    });
  });

  it("accepts replies from the task creator and sends the creator notification", async () => {
    const db = makeInboundDb();
    db.task.findUnique.mockResolvedValue({
      id: "task_1",
      title: "Task",
      createdByUserId: "user_creator",
      createdByUser: { id: "user_creator", email: "creator@example.org" },
      assigneePerson: null,
      assigneeOrganization: null,
      communicationEndpoints: [],
    });
    db.user.findUnique.mockResolvedValue({ email: "creator@example.org" });
    notificationMocks.notifyTaskCommentRecipients.mockClear();

    const result = await processInboundReply(
      inboundEvent({
        from: "Creator <creator@example.org>",
        providerMessageId: "provider_msg_creator",
      }),
      db as never,
    );

    expect(result).toMatchObject({
      status: "created",
      taskCommentId: "comment_1",
      taskCommunicationId: "comm_1",
    });
    expect(db.taskComment.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        authorUserId: "user_creator",
        message: "Done.",
      }),
    });
    expect(notificationMocks.notifyTaskCommentRecipients).toHaveBeenCalledWith(
      expect.objectContaining({
        authorUserId: "user_creator",
        commentId: "comment_1",
        message: "Done.",
        taskId: "task_1",
      }),
    );
  });

  it("credits the assignee organization when the contactEmail replies", async () => {
    const db = makeInboundDb();
    db.task.findUnique.mockResolvedValue({
      id: "task_meridian",
      title: "Join the International Campaign to End War and Disease",
      createdByUserId: "user_creator",
      createdByUser: { id: "user_creator", email: "creator@example.org" },
      assigneePerson: null,
      assigneeOrganization: {
        id: "org_meridian",
        contactEmail: "test@thinkbynumbers.org",
      },
      communicationEndpoints: [],
    });
    db.user.findUnique.mockResolvedValue({ email: "creator@example.org" });
    notificationMocks.notifyTaskCommentRecipients.mockClear();

    const result = await processInboundReply(
      inboundEvent({
        from: "Meridian Research Foundation <test@thinkbynumbers.org>",
        to: `reply+task_meridian@${WAR_ON_DISEASE_REPLY_DOMAIN}`,
        text: "We posted the survey link to our member newsletter.",
        providerMessageId: "provider_msg_meridian_reply",
      }),
      db as never,
    );

    expect(result).toMatchObject({
      status: "created",
      taskCommentId: "comment_1",
      taskCommunicationId: "comm_1",
    });
    expect(db.taskComment.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        authorOrganizationId: "org_meridian",
        authorUserId: null,
        authorPersonId: null,
        kind: TaskCommentKind.INBOUND_MESSAGE,
        source: TaskCommentSource.EMAIL_REPLY,
        message: "We posted the survey link to our member newsletter.",
        taskId: "task_meridian",
      }),
    });
    // Author org is filtered out of fan-out so it doesn't email itself back.
    expect(notificationMocks.notifyTaskCommentRecipients).toHaveBeenCalledWith(
      expect.objectContaining({
        authorOrganizationId: "org_meridian",
        authorUserId: null,
        authorPersonId: null,
        commentId: "comment_1",
        message: "We posted the survey link to our member newsletter.",
        taskId: "task_meridian",
      }),
    );
  });

  it("collapses a concurrent duplicate when the provider message insert loses the race", async () => {
    const db = makeInboundDb();
    db.$transaction.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
        code: "P2002",
        clientVersion: "test",
      }),
    );
    db.taskCommunication.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: "comm_winner",
        taskCommentId: "comment_winner",
      });

    const result = await processInboundReply(inboundEvent(), db as never);

    expect(result).toEqual({
      status: "skipped",
      reason: "duplicate providerMessageId (concurrent race)",
      taskCommentId: "comment_winner",
      taskCommunicationId: "comm_winner",
    });
  });
});
