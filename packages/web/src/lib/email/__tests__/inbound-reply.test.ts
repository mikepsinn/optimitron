import { Prisma } from "@optimitron/db";
import { describe, expect, it, vi } from "vitest";
import { processInboundReply, stripQuotedReply } from "../inbound-reply";

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
    const body = ["Real reply.", "", "-- ", "John Doe", "Foundation Director"].join("\n");
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

function inboundEvent(overrides: Partial<Parameters<typeof processInboundReply>[0]> = {}) {
  return {
    from: "Assignee <assignee@example.org>",
    to: "reply+task_1@reply.warondisease.org",
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
        ownerUserId: null,
        owner: null,
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
      ownerUserId: null,
      owner: null,
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
