import { describe, expect, it } from "vitest";
import {
  buildReferralInvitationRecipientEmail,
  getReferralInvitationRecipientDelayDays,
} from "@/lib/referral-invitation-email-sequence";

describe("referral invitation recipient email sequence", () => {
  it("builds the first task notification email", () => {
    const email = buildReferralInvitationRecipientEmail({
      inviteUrl: "https://example.com/vote/ada?invite=abc",
      messageFormat: "TASK_NOTIFICATION",
      recipientName: "Jake Smith",
      senderName: "Ada",
      step: 1,
    });

    expect(email.subject).toBe("[OVERDUE] Task assigned to you: End War and Disease");
    expect(email.text).toContain("TASK: End War and Disease");
    expect(email.text).toContain("ASSIGNED BY: Ada");
    expect(email.text).toContain("[BUTTON: COMPLETE TASK → https://example.com/vote/ada?invite=abc]");
    expect(email.text).toContain("— The Humanity Project Management System");
    expect(email.html).toContain("https://example.com/vote/ada?invite=abc");
  });

  it("builds the first sincere email", () => {
    const email = buildReferralInvitationRecipientEmail({
      inviteUrl: "https://example.com/vote/ada?invite=abc",
      messageFormat: "SINCERE",
      recipientName: "Jake Smith",
      senderName: "Ada",
      step: 1,
    });

    expect(email.subject).toBe("Ada wants you to not die of a horrible disease");
    expect(email.text).toContain("Hi Jake,");
    expect(email.text).toContain(
      '"I love you very much and I don\'t want you to get a horrible disease and die. Could you please take 30 seconds to respond to this stupid survey in order to end war and disease?"',
    );
    expect(email.text).toContain("That's it. 30 seconds. One question. No account required.");
    expect(email.text).toContain("The math is at manual.warondisease.org if you want to check it.");
    expect(email.html).toContain('href="https://manual.WarOnDisease.org/knowledge/economics/1-pct-treaty-impact.html"');
    expect(email.html).toContain(">manual.warondisease.org</a>");
  });

  it("builds all documented task-notification recipient emails", () => {
    const cases = [
      {
        body: "TASK: End War and Disease",
        step: 1 as const,
        subject: "[OVERDUE] Task assigned to you: End War and Disease",
      },
      {
        body: "TASK OVERDUE — 3 DAYS",
        step: 2 as const,
        subject: 'REMINDER: Task "End War and Disease" is still incomplete',
      },
      {
        body: "TASK ESCALATED",
        step: 3 as const,
        subject: 'ESCALATION: Task "End War and Disease" flagged for review',
      },
      {
        body: "Final notice. Task will be reassigned",
        step: 4 as const,
        subject: 'Task "End War and Disease" will be reassigned',
      },
    ];

    for (const testCase of cases) {
      const email = buildReferralInvitationRecipientEmail({
        inviteUrl: "https://example.com/vote/ada?invite=abc",
        messageFormat: "TASK_NOTIFICATION",
        recipientName: "Jake Smith",
        senderName: "Ada",
        step: testCase.step,
      });

      expect(email.subject).toBe(testCase.subject);
      expect(email.text).toContain(testCase.body);
      expect(email.text).toContain("[BUTTON: COMPLETE TASK → https://example.com/vote/ada?invite=abc]");
      expect(email.text).toContain("— The Humanity Project Management System");
    }
  });

  it("builds all documented sincere recipient emails", () => {
    const cases = [
      {
        body: "Ada asked us to send you this:",
        button: "Take the 30-second survey",
        step: 1 as const,
        subject: "Ada wants you to not die of a horrible disease",
      },
      {
        body: "Three days ago, Ada asked you",
        button: "30 seconds",
        step: 2 as const,
        subject: "Ada is still hoping you don't die",
      },
      {
        body: "The old chain letters threatened 7 years of bad luck",
        button: "30 seconds",
        step: 3 as const,
        subject: "This is technically a chain letter",
      },
      {
        body: "30 seconds. One question. Then we stop.",
        button: "warondisease.org",
        step: 4 as const,
        subject: "Last one",
      },
    ];

    for (const testCase of cases) {
      const email = buildReferralInvitationRecipientEmail({
        inviteUrl: "https://example.com/vote/ada?invite=abc",
        messageFormat: "SINCERE",
        recipientName: "Jake Smith",
        senderName: "Ada",
        step: testCase.step,
      });

      expect(email.subject).toBe(testCase.subject);
      expect(email.text).toContain(testCase.body);
      expect(email.text).toContain(`[BUTTON: ${testCase.button} → https://example.com/vote/ada?invite=abc]`);
      expect(email.text).toContain("— warondisease.org");
    }
  });

  it("uses the documented recipient reminder delay schedule", () => {
    expect(getReferralInvitationRecipientDelayDays(1)).toBe(0);
    expect(getReferralInvitationRecipientDelayDays(2)).toBe(3);
    expect(getReferralInvitationRecipientDelayDays(3)).toBe(7);
    expect(getReferralInvitationRecipientDelayDays(4)).toBe(14);
  });
});
