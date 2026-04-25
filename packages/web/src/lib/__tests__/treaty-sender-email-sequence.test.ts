import { describe, expect, it } from "vitest";
import {
  buildTreatyMonthlyScorecardEmail,
  buildTreatyNeverSharedReengagementEmail,
  buildTreatyRecipientVotedEmail,
  buildTreatySecondSenderReminderEmail,
  buildTreatySendOneMoreReminderEmail,
  buildTreatyVoteConfirmedEmail,
} from "@/lib/treaty-sender-email-sequence";

describe("treaty sender email sequence", () => {
  it("builds B1 vote confirmed copy", () => {
    const email = buildTreatyVoteConfirmedEmail({
      dashboardUrl: "https://warondisease.org/dashboard",
    });

    expect(email.subject).toBe("Vote counted. Here's what it's worth.");
    expect(email.text).toContain("Your vote for the 1% Treaty was verified.");
    expect(email.text).toContain("**1 human lifetime of suffering prevented. 2.7 lives saved.**");
    expect(email.text).toContain("That's your share of 10.7 billion deaths prevented, divided across a majority of humans on Earth.");
    expect(email.text).toContain("[BUTTON: See your dashboard → https://warondisease.org/dashboard]");
    expect(email.html).toContain('href="https://manual.WarOnDisease.org/knowledge/economics/1-pct-treaty-impact.html"');
  });

  it("builds B2 recipient voted copy", () => {
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

  it("uses the task-completed subject variant for task-format B2 emails", () => {
    const email = buildTreatyRecipientVotedEmail({
      confirmedLives: "5.4",
      messageFormat: "TASK_NOTIFICATION",
      pendingLives: "0",
      recipientName: "Jake",
    });

    expect(email.subject).toBe("Jake completed their task.");
  });

  it("builds B3 and B4 sender task reminders", () => {
    const first = buildTreatySendOneMoreReminderEmail({
      confirmedLives: "5.4",
      pendingLives: "2.7",
      sendUrl: "https://warondisease.org/send",
      sentCount: 3,
      votedCount: 2,
    });
    const second = buildTreatySecondSenderReminderEmail({
      pendingCount: 1,
      sendUrl: "https://warondisease.org/send",
      sentCount: 3,
    });

    expect(first.subject).toBe("One more?");
    expect(first.text).toContain("You messaged 3 people. 2 of them have voted so far.");
    expect(first.text).toContain("The chain continues past round 2 only if someone keeps assigning the next Earth optimization task.");
    expect(first.text).toContain("[BUTTON: Assign one more Earth optimization task → https://warondisease.org/send]");
    expect(first.text).toContain("Your Inverse Kills Score: **5.4 confirmed, 2.7 pending.**");
    expect(second.subject).toBe("Still 1 pending");
    expect(second.text).toContain("1 of your 3 referrals haven't voted yet.");
    expect(second.text).toContain("You can't make them. But you can assign one more Earth optimization task and improve your odds.");
  });

  it("builds B5 monthly scorecard copy", () => {
    const email = buildTreatyMonthlyScorecardEmail({
      chainDepth: 2,
      confirmedLifetimeCount: "2",
      confirmedLives: "5.4",
      dashboardUrl: "https://warondisease.org/dashboard",
      pendingLives: "2.7",
      pendingNames: "Maria",
      sentCount: 3,
      sharedFurtherCount: 1,
      totalLives: "8.1",
      votedCount: 2,
    });

    expect(email.subject).toBe("Your Inverse Kills Score: 8.1 lives");
    expect(email.text).toContain("Monthly update:");
    expect(email.text).toContain("**Confirmed:** 5.4 lives saved, 2 lifetimes of suffering prevented");
    expect(email.text).toContain("**Pending:** 2.7 lives, waiting on Maria");
    expect(email.text).toContain("**Your referral chain:** 3 people you sent to → 2 of them voted → 1 of those shared further");
    expect(email.text).toContain("Total chain depth from you: 2 rounds");
  });

  it("builds C1 never-shared re-engagement copy", () => {
    const email = buildTreatyNeverSharedReengagementEmail({
      sendUrl: "https://warondisease.org/send",
    });

    expect(email.subject).toBe("You voted but didn't tell anyone");
    expect(email.text).toContain("You voted for the 1% Treaty yesterday. That's worth 2.7 lives and 1 lifetime of suffering prevented.");
    expect(email.text).toContain("But only if the chain keeps going. Right now your vote is a fact with no momentum.");
    expect(email.text).toContain("It takes 15 seconds to assign one task. The message is already written for you.");
    expect(email.text).toContain("[BUTTON: Assign one task → https://warondisease.org/send]");
  });
});
