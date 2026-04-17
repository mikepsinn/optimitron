import { describe, expect, it } from "vitest";
import { PRESIDENT_MANAGEMENT_HEADLINE } from "@/content/mission-statement";
import type { OverdueSignerHighlight } from "@/lib/tasks/overdue-signers.server";
import {
  buildReferralSequenceEmail,
  getReferralSequenceAction,
  REFERRAL_EMAIL_SEQUENCE_LENGTH,
  STEP_0_CRON_GRACE_MS,
} from "../referral-email-sequence";

const FIXTURE_HIGHLIGHTS: OverdueSignerHighlight[] = [
  {
    taskId: "1-pct-treaty-signer-us",
    taskHref: "/tasks/1-pct-treaty-signer-us",
    leaderFirstName: "Joe",
    leaderFullName: "Joe Testington",
    leaderImageUrl: "https://example.invalid/us.jpg",
    roleTitle: "President",
    countryLabel: "United States",
    overdueLabel: "3 years overdue",
    deathsFromDelayLabel: "12.4K",
    wastedUsdLabel: "$3.4B",
  },
  {
    taskId: "1-pct-treaty-signer-gb",
    taskHref: "/tasks/1-pct-treaty-signer-gb",
    leaderFirstName: "Rishi",
    leaderFullName: "Rishi Example",
    leaderImageUrl: null,
    roleTitle: "Prime Minister",
    countryLabel: "United Kingdom",
    overdueLabel: "2 years overdue",
    deathsFromDelayLabel: "8.1K",
    wastedUsdLabel: "$2.1B",
  },
  {
    taskId: "1-pct-treaty-signer-cn",
    taskHref: "/tasks/1-pct-treaty-signer-cn",
    leaderFirstName: "Xi",
    leaderFullName: "Xi Placeholder",
    leaderImageUrl: "https://example.invalid/cn.jpg",
    roleTitle: "General Secretary",
    countryLabel: "People's Republic of China",
    overdueLabel: "4 years overdue",
    deathsFromDelayLabel: "15.2K",
    wastedUsdLabel: "$4.0B",
  },
];

function buildEmail(overrides: {
  step: number;
  referralCount: number;
  highlights?: readonly OverdueSignerHighlight[];
  overdueSignerCount?: number;
  name?: string;
}) {
  return buildReferralSequenceEmail({
    step: overrides.step,
    referralCount: overrides.referralCount,
    highlights: overrides.highlights ?? FIXTURE_HIGHLIGHTS,
    name: overrides.name ?? "Alex",
    overdueSignerCount: overrides.overdueSignerCount ?? 193,
    referralCode: "REFCODE1",
    shareUrl: "https://example.com/?ref=REFCODE1",
  });
}

describe("referral email sequence scheduling", () => {
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

describe("buildReferralSequenceEmail content — President Management System framing", () => {
  it("uses a caller-provided subject override verbatim", () => {
    const email = buildReferralSequenceEmail({
      step: 0,
      referralCount: 0,
      highlights: FIXTURE_HIGHLIGHTS,
      overdueSignerCount: 193,
      referralCode: "REFCODE1",
      shareUrl: "https://example.com/?ref=REFCODE1",
      subject: "[ACTION REQUIRED] Remind Emmanuel Macron (30 sec)",
    });
    expect(email.subject).toBe("[ACTION REQUIRED] Remind Emmanuel Macron (30 sec)");
  });

  it("falls back to a generic subject when no override is passed", () => {
    const email = buildEmail({ step: 0, referralCount: 0, overdueSignerCount: 193 });
    expect(email.subject.length).toBeGreaterThan(0);
    expect(email.subject).toContain("193");
  });

  it("renders the brand strip with President Management System and the day label", () => {
    const email0 = buildEmail({ step: 0, referralCount: 0 });
    const email1 = buildEmail({ step: 1, referralCount: 0 });
    const email2 = buildEmail({ step: 2, referralCount: 0 });
    expect(email0.html).toContain(PRESIDENT_MANAGEMENT_HEADLINE);
    expect(email0.html).toContain("DAY 1");
    expect(email1.html).toContain("DAY 2");
    expect(email2.html).toContain("DAY 5");
  });

  it("renders one REMIND card per highlight with ref-attributed hrefs", () => {
    const email = buildEmail({ step: 0, referralCount: 0 });
    expect(email.html).toContain("REMIND JOE →");
    expect(email.html).toContain("REMIND RISHI →");
    expect(email.html).toContain("REMIND XI →");
    expect(email.html).toContain('href="/tasks/1-pct-treaty-signer-us?ref=REFCODE1"');
    expect(email.html).toContain('href="/tasks/1-pct-treaty-signer-gb?ref=REFCODE1"');
    expect(email.html).toContain('href="/tasks/1-pct-treaty-signer-cn?ref=REFCODE1"');
  });

  it("displays the overdue clock and cost-of-delay per card", () => {
    const email = buildEmail({ step: 0, referralCount: 0 });
    expect(email.html).toContain("3 YEARS OVERDUE");
    expect(email.html).toContain("12.4K");
    expect(email.html).toContain("$3.4B");
  });

  it("computes the step-2 spend headline dynamically, not hardcoded", () => {
    const email = buildEmail({ step: 2, referralCount: 0, overdueSignerCount: 100 });
    // Four days at $37T/year ≈ $405B. Assert it's a billion-scale value.
    expect(email.html).toMatch(/drew \$\d+(\.\d+)?B/);
  });

  it("computes the step-1 deaths headline dynamically", () => {
    const email = buildEmail({ step: 1, referralCount: 0, overdueSignerCount: 193 });
    // One day at ~150K deaths/day → ~150K on the headline.
    expect(email.html).toMatch(/\d+(\.\d+)?K more humans died/);
  });

  it("renders a fallback card when no highlights are provided", () => {
    const email = buildEmail({ step: 0, referralCount: 0, highlights: [], overdueSignerCount: 193 });
    expect(email.html).toContain("193 WORLD LEADERS OVERDUE");
    expect(email.html).toContain('href="/tasks/1-pct-treaty"');
    expect(email.text).toContain("193 world leaders overdue");
    expect(email.text).not.toContain("undefined");
  });

  it("labels the secondary CTA with the dynamic overdue count", () => {
    const email = buildEmail({ step: 0, referralCount: 0, overdueSignerCount: 187 });
    expect(email.html).toContain("VIEW ALL 187 OVERDUE EMPLOYEES →");
    expect(email.html).toContain('href="/tasks/1-pct-treaty"');
  });

  it("is signed by Wishonia, PMO and cites the $37T mission in the footer", () => {
    const email = buildEmail({ step: 1, referralCount: 0 });
    expect(email.html).toContain("Wishonia, PMO");
    expect(email.html).toContain("$37T/year");
    expect(email.text).toContain("Wishonia, PMO");
  });

  it("does not mention referral-game artifacts", () => {
    const email = buildEmail({ step: 0, referralCount: 0 });
    expect(email.html).not.toContain("TELL TWO FRIENDS");
    expect(email.html).not.toContain("Earth Optimization Game");
    expect(email.html).not.toContain("Copy-and-send message");
    expect(email.text).not.toContain("Earth Optimization Game");
    expect(email.text).not.toContain("tell two friends");
  });

  it("does not include a Hello greeting or multi-paragraph intro", () => {
    const email = buildEmail({ step: 0, referralCount: 0 });
    expect(email.html).not.toMatch(/Hello\s+Alex/);
    expect(email.text).not.toMatch(/^Hello\s/m);
  });

  it("preserves the referral link as a forward-tracking footer", () => {
    const email = buildEmail({ step: 0, referralCount: 0 });
    expect(email.html).toContain("https://example.com/?ref=REFCODE1");
    expect(email.text).toContain("https://example.com/?ref=REFCODE1");
  });
});
