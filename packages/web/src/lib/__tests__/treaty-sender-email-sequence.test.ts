import { describe, expect, it } from "vitest";
import { buildTreatyRecipientVotedEmail } from "@/lib/email/treaty-sender-email-sequence";

describe("treaty sender email sequence", () => {
  it("builds recipient voted copy", () => {
    const email = buildTreatyRecipientVotedEmail({
      confirmedLives: "5.4",
      dashboardUrl: "https://warondisease.org/dashboard",
      pendingLives: "2.7",
      recipientName: "Jake",
    });

    expect(email.subject).toBe("Jake just voted");
    expect(email.text).toContain("Jake voted for the 1% Treaty.");
    expect(email.text).toContain("**+2.7 lives confirmed. +1 lifetime of suffering prevented.**");
    expect(email.text).toContain("Confirmed: **5.4 lives**");
    expect(email.text).toContain("Pending: **2.7 lives**");
  });

  it("uses the task-completed subject variant for task-format recipient-voted emails", () => {
    const email = buildTreatyRecipientVotedEmail({
      confirmedLives: "5.4",
      messageFormat: "TASK_NOTIFICATION",
      pendingLives: "0",
      recipientName: "Jake",
    });

    expect(email.subject).toBe("Jake completed their task.");
  });
});
