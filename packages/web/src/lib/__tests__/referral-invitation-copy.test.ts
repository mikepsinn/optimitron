import { describe, expect, it } from "vitest";
import {
  buildReferralInvitationMessage,
  getReferralInvitationFirstName,
} from "@/lib/referral-invitation-copy";

describe("referral invitation copy", () => {
  it("uses the first name for personalized invitation copy", () => {
    expect(getReferralInvitationFirstName("Jake Smith")).toBe("Jake");
    expect(getReferralInvitationFirstName("  Maria  ")).toBe("Maria");
  });

  it("builds the task notification message", () => {
    expect(
      buildReferralInvitationMessage({
        inviteUrl: "https://example.com/vote/sender?invite=abc",
        messageFormat: "TASK_NOTIFICATION",
        recipientName: "Jake Smith",
        senderName: "Ada",
      }),
    ).toBe(
      [
        "Overdue task: End War and Disease",
        "",
        "Assigned by: Ada",
        "Time required: 30 seconds",
        "Due: about 443 years ago",
        "",
        "Please vote on the 1% Treaty:",
        "https://example.com/vote/sender?invite=abc",
      ].join("\n"),
    );
  });

  it("keeps the task notification plain enough to paste anywhere", () => {
    const message = buildReferralInvitationMessage({
      inviteUrl: "https://example.com/vote/sender?invite=abc",
      messageFormat: "TASK_NOTIFICATION",
      recipientName: "Jake Smith",
      senderName: "Ada",
    });

    expect(message).not.toMatch(/[┌┐└┘│─]/);
    expect(message).not.toContain("**");
    expect(message).not.toContain("[ COMPLETE TASK");
    expect(message).not.toContain("Management apologizes");
  });

  it("builds the sincere message", () => {
    expect(
      buildReferralInvitationMessage({
        inviteUrl: "https://example.com/vote/sender?invite=abc",
        messageFormat: "SINCERE",
        recipientName: "Jake Smith",
      }),
    ).toBe(
      "Hi Jake. I love you very much and I don't want you to get a horrible disease and die. Could you please take 30 seconds to respond to this stupid survey in order to end war and disease? https://example.com/vote/sender?invite=abc",
    );
  });
});
