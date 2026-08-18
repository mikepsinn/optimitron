import { WAR_ON_DISEASE_REPLY_DOMAIN } from "@optimitron/db/system-identities";
import { describe, expect, it, vi } from "vitest";
import type { InboundEmailEvent } from "../inbound-reply";

const mocks = vi.hoisted(() => ({
  getEmailMonitorAddress: vi.fn(),
  sendExternalResendEmail: vi.fn(),
}));

vi.mock("../resend", () => ({
  getEmailMonitorAddress: mocks.getEmailMonitorAddress,
  sendExternalResendEmail: mocks.sendExternalResendEmail,
}));

import { forwardInboundReplyToMonitor } from "../inbound-monitor-forward";

const event: InboundEmailEvent = {
  from: "Citizen <citizen@example.org>",
  to: `reply+task_1@${WAR_ON_DISEASE_REPLY_DOMAIN}`,
  subject: "Re: task",
  text: "Done.",
  providerMessageId: "email_123",
  inReplyTo: "message_abc",
};

describe("forwardInboundReplyToMonitor", () => {
  it("skips when no monitor address is configured", async () => {
    mocks.getEmailMonitorAddress.mockReturnValue(null);

    await expect(
      forwardInboundReplyToMonitor(event, { status: "created" }),
    ).resolves.toEqual({
      status: "skipped",
      reason: "monitor_not_configured",
    });
    expect(mocks.sendExternalResendEmail).not.toHaveBeenCalled();
  });

  it("forwards the inbound reply to the monitor address", async () => {
    mocks.getEmailMonitorAddress.mockReturnValue("m@thinkbynumbers.org");
    mocks.sendExternalResendEmail.mockResolvedValue({
      id: "forward_1",
      status: "sent",
      unsubscribeUrl: null,
    });

    await expect(
      forwardInboundReplyToMonitor(event, {
        status: "skipped",
        reason: "unauthorized sender",
      }),
    ).resolves.toEqual({
      id: "forward_1",
      status: "sent",
    });

    expect(mocks.sendExternalResendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        replyTo: "citizen@example.org",
        skipWishoniaSignature: true,
        subject: "Inbound reply: Re: task",
        text: expect.stringContaining("Processing result: skipped: unauthorized sender"),
        to: "m@thinkbynumbers.org",
      }),
    );
    expect(mocks.sendExternalResendEmail.mock.calls[0]?.[0].text).toContain(
      "Body:\nDone.",
    );
  });
});
