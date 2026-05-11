import { describe, expect, it } from "vitest";
import {
  REFERRAL_FIRST_CONVERSION_SUBJECT,
  REFERRAL_FIRST_CONVERSION_TEMPLATE_ID,
  buildReferralFirstConversionHtml,
  buildReferralFirstConversionText,
} from "../referral-first-conversion-email";

const SAMPLE = {
  voterDisplayName: "Jamie Voter",
  dashboardUrl: "https://warondisease.org/dashboard",
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

  it("exposes a stable template id + subject (used for dedupe and logging)", () => {
    expect(REFERRAL_FIRST_CONVERSION_TEMPLATE_ID).toBe(
      "referral-first-conversion",
    );
    expect(REFERRAL_FIRST_CONVERSION_SUBJECT).toBe("Your link worked.");
  });
});
