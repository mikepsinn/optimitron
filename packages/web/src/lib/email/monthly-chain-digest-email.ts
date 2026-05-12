/**
 * Monthly chain digest email. Two variants picked by the user's monthly
 * conversion count `N`:
 *
 *   - `N > 0`:  positive reinforcement. Lead with the count + chain math +
 *               which doubling round of 32 they're on. Open dashboard CTA.
 *   - `N == 0`: re-send the forward kit. Same canonical share message a
 *               post-vote voter receives, framed as "still 30 seconds,
 *               still two humans." The unconverted user is the volume we
 *               need; silence treats it as user-failure when it's
 *               we-failed-to-activate.
 *
 * Sent once a month per user; deduped on `monthly-chain-digest:{userId}:{yyyy-mm}`.
 * Caller (`publishMonthlyChainDigest`) iterates eligible users and dispatches
 * the right variant.
 */

import { escapeHtml } from "@/lib/email/magic-link-render";
import { buildShareMessage } from "@/lib/share-message";
import { buildShareFooterHtml, buildShareFooterText } from "@/lib/email/share-footer";

export const MONTHLY_CHAIN_DIGEST_TEMPLATE_ID = "monthly-chain-digest";

export interface MonthlyChainDigestInput {
  /** New YES treaty conversions through this user's link in the past month. */
  monthlyConversionCount: number;
  /** Total YES treaty conversions through this user's link, all-time. */
  totalConversionCount: number;
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
    return `${input.monthlyConversionCount} more voter${input.monthlyConversionCount === 1 ? "" : "s"} joined through your link in ${input.monthLabel}`;
  }
  return "Still 30 seconds. Still two humans you love.";
}

export function buildMonthlyChainDigestHtml(
  input: MonthlyChainDigestInput,
): string {
  if (input.monthlyConversionCount > 0) {
    return buildPositiveVariantHtml(input);
  }
  return buildResendVariantHtml(input);
}

export function buildMonthlyChainDigestText(
  input: MonthlyChainDigestInput,
): string {
  if (input.monthlyConversionCount > 0) {
    return buildPositiveVariantText(input);
  }
  return buildResendVariantText(input);
}

function buildPositiveVariantHtml(input: MonthlyChainDigestInput): string {
  const monthly = input.monthlyConversionCount.toLocaleString("en-US");
  const total = input.totalConversionCount.toLocaleString("en-US");
  const escapedDashboard = escapeHtml(input.dashboardUrl);
  return `
    <div style="padding:32px 16px;font-family:Arial,sans-serif;color:#111827;max-width:640px;margin:0 auto;">
      <p style="margin:0 0 24px;font-size:13px;line-height:1.6;color:#71717a;text-transform:uppercase;letter-spacing:0.14em;font-weight:700;">
        ${escapeHtml(input.monthLabel)} chain digest
      </p>
      <p style="margin:0 0 16px;font-size:32px;line-height:1.1;font-weight:900;">
        ${monthly} more voter${input.monthlyConversionCount === 1 ? "" : "s"} joined through your link.
      </p>
      <p style="margin:0 0 24px;font-size:16px;line-height:1.7;font-weight:700;">
        Total direct conversions, all time: <strong>${total}</strong>.
      </p>
      <p style="margin:0 0 16px;font-size:16px;line-height:1.7;font-weight:700;">
        The math: 32 doubling rounds × 2 referrals each = 4,300,000,000
        humans — every adult on Earth. The chain only reaches that ceiling
        if every voter you bring in also brings 2 more, who each bring 2
        more, and so on.
      </p>
      <p style="margin:0 0 28px;font-size:16px;line-height:1.7;font-weight:700;">
        Your job this month: keep going, and check in with the ${monthly}
        ${input.monthlyConversionCount === 1 ? "person" : "people"} you
        converted — did they each get 2 more humans signed? If not, send
        them a nudge.
      </p>
      <a
        href="${escapedDashboard}"
        style="display:inline-block;background:#111827;color:#ffffff;padding:16px 32px;text-decoration:none;font-weight:900;border:2px solid #111827;font-size:14px;letter-spacing:0.08em;text-transform:uppercase;"
      >
        Open dashboard
      </a>
      ${buildShareFooterHtml(input.referralUrl)}
    </div>
  `;
}

function buildResendVariantHtml(input: MonthlyChainDigestInput): string {
  const escapedUrl = escapeHtml(input.referralUrl);
  const message = escapeHtml(buildShareMessage(input.referralUrl));
  return `
    <div style="padding:32px 16px;font-family:Arial,sans-serif;color:#111827;max-width:640px;margin:0 auto;">
      <p style="margin:0 0 24px;font-size:13px;line-height:1.6;color:#71717a;text-transform:uppercase;letter-spacing:0.14em;font-weight:700;">
        Still 30 seconds. Still two humans you love.
      </p>
      <p style="margin:0 0 24px;font-size:18px;line-height:1.7;font-weight:700;">
        ${message}
      </p>
      <a
        href="${escapedUrl}"
        style="display:inline-block;background:#111827;color:#ffffff;padding:16px 32px;text-decoration:none;font-weight:900;border:2px solid #111827;font-size:14px;letter-spacing:0.08em;text-transform:uppercase;"
      >
        End war and disease
      </a>
      <p style="margin:32px 0 0;font-size:13px;line-height:1.6;color:#71717a;">
        Forward this email to two people you love. Hit forward, paste two
        addresses, send. 32 doubling rounds × 2 referrals each =
        4,300,000,000 humans reached. The chain breaks the moment voters
        stop reaching 2 each.
      </p>
    </div>
  `;
}

function buildPositiveVariantText(input: MonthlyChainDigestInput): string {
  const monthly = input.monthlyConversionCount.toLocaleString("en-US");
  const total = input.totalConversionCount.toLocaleString("en-US");
  return [
    `${input.monthLabel} chain digest`,
    "",
    `${monthly} more voter${input.monthlyConversionCount === 1 ? "" : "s"} joined through your link.`,
    `Total direct conversions, all time: ${total}.`,
    "",
    "The math: 32 doubling rounds × 2 referrals each = 4,300,000,000 humans — every adult on Earth. The chain only reaches that ceiling if every voter you bring in also brings 2 more, who each bring 2 more, and so on.",
    "",
    `Your job this month: keep going, and check in with the ${monthly} ${input.monthlyConversionCount === 1 ? "person" : "people"} you converted — did they each get 2 more humans signed? If not, send them a nudge.`,
    "",
    `Open dashboard: ${input.dashboardUrl}`,
    buildShareFooterText(input.referralUrl),
  ].join("\n");
}

function buildResendVariantText(input: MonthlyChainDigestInput): string {
  return [
    "Still 30 seconds. Still two humans you love.",
    "",
    buildShareMessage(input.referralUrl),
    "",
    `End war and disease: ${input.referralUrl}`,
    "",
    "Forward this email to two people you love. Hit forward, paste two addresses, send. 32 doubling rounds × 2 referrals each = 4,300,000,000 humans reached. The chain breaks the moment voters stop reaching 2 each.",
  ].join("\n");
}
