/**
 * Monthly Humanity Manager status report.
 *
 * Sent once a month per user; deduped on
 * `monthly-chain-digest:{userId}:{yyyy-mm}`. The email is a management report,
 * not a cheerleading note: employees completed the 30-second task, employees
 * are still late, and presidents are still late.
 */

import React from "react";
import { formatDefaultSystemEmailFromHeader } from "@/lib/email/from-address";
import { MonthlyChainDigestReactEmail } from "@/lib/email/monthly-chain-digest-react-email";
import {
  SAMPLE_DASHBOARD_URL,
  SAMPLE_REFERRAL_URL,
  type EmailPreview,
} from "@/lib/email/preview-envelope";

export const MONTHLY_CHAIN_DIGEST_TEMPLATE_ID = "monthly-chain-digest";

export interface MonthlyChainDigestPerson {
  displayName: string;
  completedAt?: Date | string | null;
  currentDelayDays?: number | null;
  currentHumanLivesLost?: number | null;
}

export interface MonthlyChainDigestLeader {
  countryCode?: string | null;
  countryLabel?: string | null;
  currentDelayDays?: number | null;
  currentHumanLivesLost?: number | null;
  displayName: string;
}

export interface MonthlyChainDigestInput {
  /** New YES treaty conversions through this user's link in the past month. */
  monthlyConversionCount: number;
  /** Total YES treaty conversions through this user's link, all-time. */
  totalConversionCount: number;
  /** People who completed the 30-second task through this user's link this month. */
  completedEmployees: MonthlyChainDigestPerson[];
  /** Employees created by this user that have not converted yet. */
  overdueEmployeeCount: number;
  /** Sample of overdue employees, oldest first. */
  overdueEmployees: MonthlyChainDigestPerson[];
  /** Global count of overdue heads of government. */
  overduePresidentCount: number;
  /** Sample of overdue heads of government. */
  overduePresidents: MonthlyChainDigestLeader[];
  /** The user's personal referral URL. */
  referralUrl: string;
  /** URL to the user's dashboard. */
  dashboardUrl: string;
  /** Human-readable month label, e.g. "May 2026". */
  monthLabel: string;
}

export function buildMonthlyChainDigestSubject(
  input: Pick<MonthlyChainDigestInput, "monthlyConversionCount" | "monthLabel">,
): string {
  if (input.monthlyConversionCount > 0) {
    return `Humanity Management: ${input.monthlyConversionCount} employee${input.monthlyConversionCount === 1 ? "" : "s"} completed the task`;
  }
  return "Humanity Management: no employees completed the task";
}

export const MONTHLY_CHAIN_DIGEST_PREVIEW: EmailPreview = {
  templateId: MONTHLY_CHAIN_DIGEST_TEMPLATE_ID,
  displayName: "Monthly Humanity Manager status report",
  trigger:
    "Fires once per month per user via cron, deduped on user+yyyy-mm. Reports which employees voted through the user's link, which assigned humans are still late, and how many presidents still have not completed their 30-second treaty task.",
  scope: "onboarding",
  from: () => formatDefaultSystemEmailFromHeader(),
  subject: () =>
    buildMonthlyChainDigestSubject({
      monthlyConversionCount: 7,
      monthLabel: "May 2026",
    }),
  skipWishoniaSignature: true,
  renderReact: () =>
    React.createElement(MonthlyChainDigestReactEmail, {
      input: MONTHLY_CHAIN_DIGEST_FIXTURE,
    }),
};

const MONTHLY_CHAIN_DIGEST_FIXTURE: MonthlyChainDigestInput = {
  completedEmployees: [
    { displayName: "Ada Lovelace", completedAt: "2026-05-04" },
    { displayName: "Jonas Salk", completedAt: "2026-05-08" },
    { displayName: "Grace Hopper", completedAt: "2026-05-12" },
  ],
  monthlyConversionCount: 7,
  overdueEmployeeCount: 3,
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
    {
      currentDelayDays: 4,
      currentHumanLivesLost: 600,
      displayName: "Uncle Dave",
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
    {
      countryCode: "GB",
      displayName: "Prime Minister Sample",
      countryLabel: "Sample Kingdom",
      currentDelayDays: 27,
      currentHumanLivesLost: 4050,
    },
    {
      countryCode: "DE",
      countryLabel: "Demo Federation",
      currentDelayDays: 24,
      currentHumanLivesLost: 3600,
      displayName: "Chancellor Demo",
    },
  ],
  totalConversionCount: 19,
  referralUrl: SAMPLE_REFERRAL_URL,
  dashboardUrl: SAMPLE_DASHBOARD_URL,
  monthLabel: "May 2026",
};
