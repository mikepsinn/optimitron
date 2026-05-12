import { describe, expect, it } from "vitest";
import {
  buildMonthlyChainDigestHtml,
  buildMonthlyChainDigestSubject,
  buildMonthlyChainDigestText,
} from "../monthly-chain-digest-email";

const BASE = {
  referralUrl: "https://warondisease.org/vote/SAMPLE",
  dashboardUrl: "https://warondisease.org/dashboard",
  monthLabel: "May 2026",
};

describe("monthly chain digest — positive variant (N > 0)", () => {
  const input = {
    ...BASE,
    monthlyConversionCount: 7,
    totalConversionCount: 19,
  };

  it("subject names the count + month for opens", () => {
    expect(buildMonthlyChainDigestSubject(input)).toBe(
      "7 more voters joined through your link in May 2026",
    );
  });

  it("subject singularizes when N == 1", () => {
    expect(
      buildMonthlyChainDigestSubject({ ...input, monthlyConversionCount: 1 }),
    ).toBe("1 more voter joined through your link in May 2026");
  });

  it("html surfaces monthly + total counts and the doubling-rounds math", () => {
    const html = buildMonthlyChainDigestHtml(input);
    expect(html).toContain("7 more voters joined");
    expect(html).toContain("19");
    expect(html).toContain("32 doubling rounds");
    expect(html).toContain("4,300,000,000");
  });

  it("html appends the canonical share footer with referral URL", () => {
    const html = buildMonthlyChainDigestHtml(input);
    expect(html).toContain("Recruit two more humans");
    expect(html).toContain("I love you");
    expect(html).toContain(BASE.referralUrl);
  });

  it("plaintext mirrors html content", () => {
    const text = buildMonthlyChainDigestText(input);
    expect(text).toContain("May 2026 chain digest");
    expect(text).toContain("7 more voters joined");
    expect(text).toContain("4,300,000,000");
    expect(text).toContain(BASE.referralUrl);
  });
});

describe("monthly chain digest — resend variant (N == 0)", () => {
  const input = {
    ...BASE,
    monthlyConversionCount: 0,
    totalConversionCount: 0,
  };

  it("subject pivots to forward-kit framing", () => {
    expect(buildMonthlyChainDigestSubject(input)).toBe(
      "Still 30 seconds. Still two humans you love.",
    );
  });

  it("html is the canonical share message body, not a stats digest", () => {
    const html = buildMonthlyChainDigestHtml(input);
    expect(html).toContain("I love you");
    expect(html).toContain("suffer and die of horrible diseases");
    expect(html).toContain(BASE.referralUrl);
    expect(html).toContain("End war and disease");
    // The zero-month variant does NOT lead with a count
    expect(html).not.toContain("chain digest");
  });

  it("plaintext fallback contains the canonical message", () => {
    const text = buildMonthlyChainDigestText(input);
    expect(text).toContain("I love you");
    expect(text).toContain(BASE.referralUrl);
  });
});
