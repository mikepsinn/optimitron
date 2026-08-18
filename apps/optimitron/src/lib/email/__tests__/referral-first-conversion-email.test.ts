import React from "react";
import { describe, expect, it } from "vitest";
import { ReferralFirstConversionReactEmail } from "../referral-first-conversion-react-email";
import { renderReactEmailBody } from "../render-react-email";

const SAMPLE = {
  voterDisplayName: "Jamie Voter",
  dashboardUrl: "https://warondisease.org/dashboard",
  referrerReferralUrl: "https://warondisease.org/vote/AB12CD",
};

async function renderReferralFirstConversionEmail(
  input: typeof SAMPLE = SAMPLE,
) {
  return renderReactEmailBody(
    React.createElement(ReferralFirstConversionReactEmail, input),
  );
}

describe("referral-first-conversion email template", () => {
  it("names the voter who triggered the conversion", async () => {
    const { html } = await renderReferralFirstConversionEmail();
    expect(html).toContain("Jamie Voter");
  });

  it("links to the recipient's dashboard for ongoing stats", async () => {
    const { html, text } = await renderReferralFirstConversionEmail();
    expect(html).toContain(SAMPLE.dashboardUrl);
    expect(text).toContain(SAMPLE.dashboardUrl);
  });

  it("is explicit that this is the first-only email — no per-vote spam", async () => {
    const { html, text } = await renderReferralFirstConversionEmail();
    expect(html).toContain("No per-vote pings");
    expect(text).toContain("No per-vote pings");
  });

  it("escapes voter display names so a hostile name cannot inject HTML", async () => {
    const { html } = await renderReferralFirstConversionEmail({
      ...SAMPLE,
      voterDisplayName: "<script>alert(1)</script>",
    });
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("appends the canonical share footer with the referrer's referral URL", async () => {
    const { html, text } = await renderReferralFirstConversionEmail();
    // Share footer leads with the forward prompt and contains the canonical message
    // body keyed by the referrer's own URL — so the recipient can copy/paste
    // it into any channel without going back to the website.
    expect(html).toContain("Forward this");
    expect(html).toContain(SAMPLE.referrerReferralUrl);
    expect(html).toContain("Hi there");
    expect(html).toContain("I love you very much");
    expect(html).toContain("respond to this stupid survey");
    expect(html).not.toContain("{treaty_url}");
    expect(text).toContain("Forward this");
    expect(text).toContain(SAMPLE.referrerReferralUrl);
    expect(text).toContain("Hi there");
    expect(text).not.toContain("{target_name}");
  });
});
