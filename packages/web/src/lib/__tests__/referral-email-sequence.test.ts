import { describe, expect, it } from "vitest";
import {
  buildReferralSequenceEmail,
  getReferralSequenceAction,
} from "../referral-email-sequence";

describe("referral email sequence", () => {
  it("sends the welcome email immediately", () => {
    const action = getReferralSequenceAction({
      createdAt: new Date("2026-03-10T00:00:00.000Z"),
      newsletterSubscribed: true,
      referralCount: 0,
      referralEmailSequenceLastSentAt: null,
      referralEmailSequenceStep: 0,
    });

    expect(action).toEqual({ type: "send", step: 0 });
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

  it("builds urgency copy once referrals exist", () => {
    const email = buildReferralSequenceEmail({
      step: 1,
      referralCount: 2,
      name: "Jane Doe",
      shareUrl: "https://example.com/wishocracy/jane",
    });

    expect(email.subject).toContain("2");
    expect(email.text).toContain("https://example.com/wishocracy/jane");
    expect(email.html).toContain("Copy-and-send message");
    expect(email.html).toContain("VOTE point");
  });

  it("welcome email emphasizes VOTE point value", () => {
    const email = buildReferralSequenceEmail({
      step: 0,
      referralCount: 0,
      name: "Alex",
      shareUrl: "https://example.com/?ref=alex",
    });

    expect(email.subject).toContain("VOTE point");
    expect(email.text).toContain("VOTE point");
    expect(email.html).toContain("EARN POINTS");
  });

  it("step 2 email includes deadline urgency for zero referrals", () => {
    const email = buildReferralSequenceEmail({
      step: 2,
      referralCount: 0,
      name: "Bo",
      shareUrl: "https://example.com/?ref=bo",
    });

    expect(email.subject).toContain("parasitic economy");
    expect(email.text).toContain("people die daily");
  });
});
