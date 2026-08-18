import { describe, expect, it, vi, beforeEach } from "vitest";
import type { InboundEmailEvent } from "../inbound-reply";

const mocks = vi.hoisted(() => ({
  applyUnsubscribe: vi.fn(),
  unsubscribeTaskCommunicationByReply: vi.fn(),
  userFindUnique: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: mocks.userFindUnique,
    },
  },
}));

vi.mock("../suppression.server", () => ({
  applyUnsubscribe: mocks.applyUnsubscribe,
}));

vi.mock("@/lib/tasks/task-notifications.server", () => ({
  unsubscribeTaskCommunicationByReply:
    mocks.unsubscribeTaskCommunicationByReply,
}));

import { processInboundUnsubscribe } from "../inbound-unsubscribe";

function inbound(overrides: Partial<InboundEmailEvent> = {}): InboundEmailEvent {
  return {
    from: "Citizen <citizen@example.org>",
    to: "reply+task_1@updates.warondisease.org",
    subject: "Re: task",
    text: "Done.",
    providerMessageId: "received_1",
    ...overrides,
  };
}

describe("processInboundUnsubscribe", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.unsubscribeTaskCommunicationByReply.mockResolvedValue({
      reason: "no_matching_communication",
      status: "skipped",
    });
  });

  it("ignores normal task replies", async () => {
    await expect(processInboundUnsubscribe(inbound())).resolves.toEqual({
      handled: false,
      status: "not_unsubscribe",
    });
    expect(mocks.applyUnsubscribe).not.toHaveBeenCalled();
    expect(mocks.unsubscribeTaskCommunicationByReply).not.toHaveBeenCalled();
  });

  it("applies a master user unsubscribe for the unsubscribe mailbox", async () => {
    mocks.userFindUnique.mockResolvedValue({ id: "user_1" });

    await expect(
      processInboundUnsubscribe(
        inbound({
          to: "unsubscribe@updates.warondisease.org",
          subject: "anything",
        }),
      ),
    ).resolves.toEqual({
      handled: true,
      scope: "all",
      status: "unsubscribed",
      userId: "user_1",
    });

    expect(mocks.applyUnsubscribe).toHaveBeenCalledWith({
      scope: "all",
      userId: "user_1",
      via: "reply",
    });
  });

  it("applies an external task-notification opt-out for unsubscribe replies to task mail", async () => {
    mocks.userFindUnique.mockResolvedValue(null);
    mocks.unsubscribeTaskCommunicationByReply.mockResolvedValue({
      status: "unsubscribed",
      taskCommunicationId: "communication_1",
    });

    await expect(
      processInboundUnsubscribe(inbound({ subject: "unsubscribe" })),
    ).resolves.toEqual({
      handled: true,
      scope: "task_notifications",
      status: "unsubscribed",
      taskCommunicationId: "communication_1",
    });

    expect(mocks.unsubscribeTaskCommunicationByReply).toHaveBeenCalledWith({
      recipientEmail: "citizen@example.org",
      taskId: "task_1",
    });
  });
});
