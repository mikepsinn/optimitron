import React from "react";
import { describe, expect, it } from "vitest";
import { MonthlyChainDigestReactEmail } from "../monthly-chain-digest-react-email";
import {
  buildMonthlyChainDigestSubject,
  type MonthlyChainDigestInput,
} from "../monthly-chain-digest-email";
import { renderReactEmailBody } from "../render-react-email";

const BASE: Omit<
  MonthlyChainDigestInput,
  "monthlyConversionCount" | "totalConversionCount"
> = {
  completedEmployees: [
    { displayName: "Ada Lovelace", completedAt: "2026-05-04" },
    { displayName: "Jonas Salk", completedAt: "2026-05-08" },
  ],
  referralUrl: "https://warondisease.org/vote/SAMPLE",
  dashboardUrl: "https://warondisease.org/dashboard",
  monthLabel: "May 2026",
  overdueEmployeeCount: 2,
  overdueEmployees: [
    {
      currentDelayDays: 12,
      currentHumanLivesLost: 1800,
      displayName: "Jake Smith",
    },
    {
      currentDelayDays: 8,
      currentHumanLivesLost: 1200,
      displayName: "Maria Chen",
    },
  ],
  overduePresidentCount: 189,
  overduePresidents: [
    {
      countryCode: "US",
      countryLabel: "Example Republic",
      currentDelayDays: 30,
      currentHumanLivesLost: 4500,
      displayName: "President Example",
    },
  ],
};

async function renderMonthlyDigest(input: MonthlyChainDigestInput) {
  return renderReactEmailBody(
    React.createElement(MonthlyChainDigestReactEmail, { input }),
  );
}

describe("monthly chain digest — positive variant (N > 0)", () => {
  const input = {
    ...BASE,
    monthlyConversionCount: 7,
    totalConversionCount: 19,
  };

  it("subject names the count + month for opens", () => {
    expect(buildMonthlyChainDigestSubject(input)).toBe(
      "Humanity Management: 7 employees completed the task",
    );
  });

  it("subject singularizes when N == 1", () => {
    expect(
      buildMonthlyChainDigestSubject({ ...input, monthlyConversionCount: 1 }),
    ).toBe("Humanity Management: 1 employee completed the task");
  });

  it("html surfaces completed employees, overdue employees, late presidents, and the doubling-rounds math", async () => {
    const { html } = await renderMonthlyDigest(input);
    const normalized = html.replaceAll("<!-- -->", "");
    expect(html).toContain("7 employees completed");
    expect(html).toContain("Ada Lovelace");
    expect(html).toContain("Jake Smith");
    expect(html).toContain("189");
    expect(html).toContain("President Example");
    expect(html).toContain("19");
    expect(normalized).toContain(">32</a> doubling rounds");
    expect(normalized).toContain(">4 billion</a> humans reached");
  });

  it("html includes copy-paste reminders with the referral URL", async () => {
    const { html } = await renderMonthlyDigest(input);
    expect(html).toContain("Yeahhh, hi Jake Smith");
    expect(html).toContain("Department of Civilization Made a Spreadsheet");
    expect(html).toContain("1.8K people have died");
    expect(html).toContain("Yeahhh, hi President Example");
    expect(html).toContain("4.5K people have died");
    expect(html).toContain(BASE.referralUrl);
    expect(html).not.toContain("{target_name}");
  });

  it("plaintext mirrors html content", async () => {
    const { text } = await renderMonthlyDigest(input);
    expect(text).toContain("Humanity Management Status Report - May 2026");
    expect(text.toLowerCase()).toContain("7 employees completed");
    expect(text).toContain("Ada Lovelace");
    expect(text).toContain("Jake Smith");
    expect(text).toContain("Yeahhh, hi Jake Smith");
    expect(text).toContain("Yeahhh, hi President Example");
    expect(text).toContain("4 billion");
    expect(text).toContain(BASE.referralUrl);
    expect(text).not.toContain("{target_name}");
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
      "Humanity Management: no employees completed the task",
    );
  });

  it("html is a management report with reminder copy, not a nudge email", async () => {
    const { html } = await renderMonthlyDigest(input);
    expect(html).toContain("No employees completed the 30-second task");
    expect(html).toContain("Late employee reminder");
    expect(html).toContain("Yeahhh, hi Jake Smith");
    expect(html).toContain("Yeahhh, hi President Example");
    expect(html).toContain(BASE.referralUrl);
    expect(html).not.toContain("send them a nudge");
  });

  it("plaintext fallback contains the management reminders", async () => {
    const { text } = await renderMonthlyDigest(input);
    expect(text.toLowerCase()).toContain("no employees completed the 30-second");
    expect(text.toLowerCase()).toContain("task through your link");
    expect(text).toContain("Yeahhh, hi Jake Smith");
    expect(text).toContain("Yeahhh, hi President Example");
    expect(text).toContain(BASE.referralUrl);
    expect(text).not.toContain("{target_name}");
  });
});
