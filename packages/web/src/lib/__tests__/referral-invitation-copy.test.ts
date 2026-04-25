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
        "Here's Jake's task assignment:",
        "",
        "⚠️ **[OVERDUE] End War and Disease**",
        "",
        "TASK: End War and Disease",
        "ASSIGNED BY: Ada",
        "STATUS: Overdue (by approximately 443 years)",
        "PRIORITY: Critical",
        "ESTIMATED TIME: 30 seconds",
        "ACTION REQUIRED: Vote on the 1% Treaty",
        "",
        "NOTE: This task was originally due several centuries ago but kept getting deprioritized in favor of building 122 apocalypses worth of nuclear weapons. Management apologizes for the delay.",
        "",
        "[ COMPLETE TASK → https://example.com/vote/sender?invite=abc ]",
      ].join("\n"),
    );
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
