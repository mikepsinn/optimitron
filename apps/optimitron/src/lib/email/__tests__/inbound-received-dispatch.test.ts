import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ResendEvent } from "../resend-webhook";

const mocks = vi.hoisted(() => ({
  forwardInboundReplyToMonitor: vi.fn(),
  getReceivedEmailContent: vi.fn(),
  processInboundReply: vi.fn(),
  processInboundUnsubscribe: vi.fn(),
}));

vi.mock("../resend", () => ({
  getReceivedEmailContent: mocks.getReceivedEmailContent,
}));

vi.mock("../inbound-reply", () => ({
  processInboundReply: mocks.processInboundReply,
}));

vi.mock("../inbound-unsubscribe", () => ({
  processInboundUnsubscribe: mocks.processInboundUnsubscribe,
}));

vi.mock("../inbound-monitor-forward", () => ({
  forwardInboundReplyToMonitor: mocks.forwardInboundReplyToMonitor,
}));

import { dispatchInboundReceivedEvent } from "../inbound-received-dispatch";

function receivedEvent(overrides: Partial<ResendEvent["data"]> = {}): ResendEvent {
  return {
    data: {
      email_id: "email_123",
      from: "Citizen <citizen@example.org>",
      subject: "Re: task",
      to: "reply+task_1@updates.warondisease.org",
      ...overrides,
    },
    type: "email.received",
  };
}

describe("dispatchInboundReceivedEvent", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.getReceivedEmailContent.mockResolvedValue({
      from: "Citizen <citizen@example.org>",
      headers: { "In-Reply-To": "<message_1@updates.warondisease.org>" },
      html: null,
      subject: "Re: task",
      text: "Done.",
      to: ["reply+task_1@updates.warondisease.org"],
    });
    mocks.processInboundUnsubscribe.mockResolvedValue({
      handled: false,
      status: "not_unsubscribe",
    });
    mocks.processInboundReply.mockResolvedValue({
      status: "created",
      taskCommentId: "comment_1",
      taskCommunicationId: "communication_1",
    });
    mocks.forwardInboundReplyToMonitor.mockResolvedValue({ status: "sent" });
  });

  it("forwards normalized inbound email to the monitor after processing", async () => {
    await expect(dispatchInboundReceivedEvent(receivedEvent())).resolves.toEqual({
      ok: true,
      result: {
        status: "created",
        taskCommentId: "comment_1",
        taskCommunicationId: "communication_1",
      },
      status: 200,
    });

    expect(mocks.forwardInboundReplyToMonitor).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "Citizen <citizen@example.org>",
        inReplyTo: "<message_1@updates.warondisease.org>",
        providerMessageId: "email_123",
        text: "Done.",
        to: "reply+task_1@updates.warondisease.org",
      }),
      {
        status: "created",
        taskCommentId: "comment_1",
        taskCommunicationId: "communication_1",
      },
    );
  });

  it("still forwards inbound email to the monitor when reply processing fails", async () => {
    mocks.processInboundReply.mockRejectedValue(new Error("database unavailable"));

    await expect(dispatchInboundReceivedEvent(receivedEvent())).rejects.toThrow(
      "database unavailable",
    );

    expect(mocks.forwardInboundReplyToMonitor).toHaveBeenCalledWith(
      expect.objectContaining({
        providerMessageId: "email_123",
        text: "Done.",
      }),
      {
        reason: "processing_error",
        status: "skipped",
      },
    );
  });

  it("still forwards inbound metadata when Resend content fetching fails", async () => {
    mocks.getReceivedEmailContent.mockRejectedValue(new Error("resend unavailable"));

    await expect(
      dispatchInboundReceivedEvent(
        receivedEvent({ text: "Fallback body from webhook." }),
      ),
    ).rejects.toThrow("resend unavailable");

    expect(mocks.processInboundReply).not.toHaveBeenCalled();
    expect(mocks.forwardInboundReplyToMonitor).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "Citizen <citizen@example.org>",
        providerMessageId: "email_123",
        text: "Fallback body from webhook.",
        to: "reply+task_1@updates.warondisease.org",
      }),
      {
        reason: "content_fetch_error",
        status: "skipped",
      },
    );
  });
});
