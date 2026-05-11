import { describe, expect, it } from "vitest";
import {
  buildReferralFirstConversionHtml,
  buildReferralFirstConversionText,
} from "../referral-first-conversion-email";

const SAMPLE = {
  voterDisplayName: "Jamie Voter",
  dashboardUrl: "https://warondisease.org/dashboard",
  referrerReferralUrl: "https://warondisease.org/vote/AB12CD",
};

describe("referral-first-conversion email builders", () => {
  it("names the voter who triggered the conversion", () => {
    const html = buildReferralFirstConversionHtml(SAMPLE);
    expect(html).toContain("Jamie Voter");
  });

  it("links to the recipient's dashboard for ongoing stats", () => {
    const html = buildReferralFirstConversionHtml(SAMPLE);
    const text = buildReferralFirstConversionText(SAMPLE);
    expect(html).toContain(SAMPLE.dashboardUrl);
    expect(text).toContain(SAMPLE.dashboardUrl);
  });

  it("is explicit that this is the first-only email — no per-vote spam", () => {
    const html = buildReferralFirstConversionHtml(SAMPLE);
    expect(html).toContain("no per-vote pings");
  });

  it("escapes voter display names so a hostile name cannot inject HTML", () => {
    const html = buildReferralFirstConversionHtml({
      ...SAMPLE,
      voterDisplayName: "<script>alert(1)</script>",
    });
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("appends the canonical share footer with the referrer's referral URL", () => {
    const html = buildReferralFirstConversionHtml(SAMPLE);
    const text = buildReferralFirstConversionText(SAMPLE);
    // Share footer leads with the eyebrow and contains the canonical message
    // body keyed by the referrer's own URL — so the recipient can copy/paste
    // it into any channel without going back to the website.
    expect(html).toContain("Recruit two more humans");
    expect(html).toContain(SAMPLE.referrerReferralUrl);
    expect(html).toContain("I love you");
    expect(text).toContain("Recruit two more humans");
    expect(text).toContain(SAMPLE.referrerReferralUrl);
  });

});
