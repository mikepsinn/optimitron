import { describe, expect, it } from "vitest";
import {
  buildReferralSequenceEmail,
  getReferralSequenceAction,
  REFERRAL_EMAIL_SEQUENCE_LENGTH,
  STEP_0_CRON_GRACE_MS,
} from "../referral-email-sequence";

describe("referral email sequence", () => {
  it("sends step 0 after grace period", () => {
    const created = new Date("2026-03-10T00:00:00.000Z");
    const now = new Date(created.getTime() + STEP_0_CRON_GRACE_MS + 1);
    const action = getReferralSequenceAction(
      {
        createdAt: created,
        newsletterSubscribed: true,
        referralCount: 0,
        referralEmailSequenceLastSentAt: null,
        referralEmailSequenceStep: 0,
      },
      now,
    );

    expect(action).toEqual({ type: "send", step: 0 });
  });

  it("skips step 0 during grace period to avoid duplicating welcome email", () => {
    const created = new Date("2026-03-10T00:00:00.000Z");
    const now = new Date(created.getTime() + STEP_0_CRON_GRACE_MS - 1);
    const action = getReferralSequenceAction(
      {
        createdAt: created,
        newsletterSubscribed: true,
        referralCount: 0,
        referralEmailSequenceLastSentAt: null,
        referralEmailSequenceStep: 0,
      },
      now,
    );

    expect(action).toBeNull();
  });

  it("waits until the first follow-up is due", () => {
    const tooEarly = getReferralSequenceAction(
      {
        createdAt: new Date("2026-03-10T00:00:00.000Z"),
        newsletterSubscribed: true,
        referralCount: 0,
        referralEmailSequenceLastSentAt: new Date("2026-03-10T12:00:00.000Z"),
        referralEmailSequenceStep: 1,
      },
      new Date("2026-03-11T10:59:59.000Z"),
    );

    const due = getReferralSequenceAction(
      {
        createdAt: new Date("2026-03-10T00:00:00.000Z"),
        newsletterSubscribed: true,
        referralCount: 0,
        referralEmailSequenceLastSentAt: new Date("2026-03-10T12:00:00.000Z"),
        referralEmailSequenceStep: 1,
      },
      new Date("2026-03-11T12:00:00.000Z"),
    );

    expect(tooEarly).toBeNull();
    expect(due).toEqual({ type: "send", step: 1 });
  });

  it("completes the sequence when the referral target is reached", () => {
    const action = getReferralSequenceAction({
      createdAt: new Date("2026-03-10T00:00:00.000Z"),
      newsletterSubscribed: true,
      referralCount: 3,
      referralEmailSequenceLastSentAt: new Date("2026-03-10T12:00:00.000Z"),
      referralEmailSequenceStep: 1,
    });

    expect(action).toEqual({ type: "complete", reason: "goal_met" });
  });

  it("builds game progress copy when friends have joined", () => {
    const email = buildReferralSequenceEmail({
      step: 1,
      referralCount: 2,
      name: "Jane Doe",
      shareUrl: "https://example.com/wishocracy/jane",
    });

    expect(email.subject).toContain("2");
    expect(email.subject).toContain("friends joined");
    expect(email.text).toContain("https://example.com/wishocracy/jane");
    expect(email.html).toContain("Copy-and-send message");
    expect(email.html).toContain("TELL TWO FRIENDS");
  });

  it("welcome email leads with game framing, not financial value", () => {
    const email = buildReferralSequenceEmail({
      step: 0,
      referralCount: 0,
      name: "Alex",
      shareUrl: "https://example.com/?ref=alex",
    });

    expect(email.subject).toBe("You did a thing. Now do one more thing");
    expect(email.text).toContain("Earth Optimization Game");
    expect(email.text).toContain("tell two friends");
    expect(email.html).toContain("TELL TWO FRIENDS");
  });

  it("step 2 email uses mission framing for zero referrals", () => {
    const email = buildReferralSequenceEmail({
      step: 2,
      referralCount: 0,
      name: "Bo",
      shareUrl: "https://example.com/?ref=bo",
    });

    expect(email.subject).toContain("604x");
    expect(email.text).toContain("people have died from treatable diseases");
  });

  it("signs off as Wishonia", () => {
    const email = buildReferralSequenceEmail({
      step: 0,
      referralCount: 0,
      name: "Test",
      shareUrl: "https://example.com/?ref=test",
    });

    expect(email.text).toContain("Wishonia");
    expect(email.html).toContain("Wishonia");
  });

  it("no subject line contains dollar amounts", () => {
    const steps = [
      { step: 0, referralCount: 0 },
      { step: 1, referralCount: 0 },
      { step: 1, referralCount: 2 },
      { step: 2, referralCount: 0 },
      { step: 2, referralCount: 2 },
    ];

    for (const { step, referralCount } of steps) {
      const email = buildReferralSequenceEmail({
        step,
        referralCount,
        name: "Test",
        shareUrl: "https://example.com/?ref=test",
      });
      expect(email.subject).not.toMatch(
        /\$\d/,
      );
    }
  });

  it("share message does not mention VOTE points", () => {
    const email = buildReferralSequenceEmail({
      step: 0,
      referralCount: 0,
      name: "Test",
      shareUrl: "https://example.com/?ref=test",
    });

    const shareMessageLine = email.text
      .split("\n")
      .find((line) => line.startsWith("Suggested message:"));
    const shareMessage = email.text
      .split("\n")
      .slice(
        email.text.split("\n").indexOf(shareMessageLine!) + 1,
        email.text.split("\n").indexOf(shareMessageLine!) + 2,
      )
      .join("");

    expect(shareMessage).not.toContain("VOTE point");
  });

  it("completes sequence when all steps are exhausted", () => {
    const action = getReferralSequenceAction({
      createdAt: new Date("2026-03-10T00:00:00.000Z"),
      newsletterSubscribed: true,
      referralCount: 0,
      referralEmailSequenceLastSentAt: new Date("2026-03-14T00:00:00.000Z"),
      referralEmailSequenceStep: REFERRAL_EMAIL_SEQUENCE_LENGTH,
    });

    expect(action).toBeNull();
  });
});
