import { GLOBAL_DISEASE_DEATHS_DAILY } from "@optimitron/data/parameters";
import { PRESIDENT_MANAGEMENT_HEADLINE } from "@/content/mission-statement";
import {
  formatCompactCount,
  formatCompactCurrency,
} from "@/lib/tasks/accountability";
import { getTreatyParentTaskHref } from "@/lib/tasks/task-keys";
import type { OverdueSignerHighlight } from "@/lib/tasks/overdue-signers.server";

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const REFERRAL_TARGET = 3;
const FOLLOW_UP_DELAYS_MS = [0, 24 * HOUR_MS, 96 * HOUR_MS] as const;

/** Cron waits this long before retrying a step-0 send, giving the
 *  welcome-email handler (signup / auth event) time to advance the step. */
export const STEP_0_CRON_GRACE_MS = 10 * 60 * 1000;

// $37 trillion/year — canonical total global government spending figure from
// the dashboard mission statement. Not in the parameters module; keep in sync
// with @/content/mission-statement if that number ever changes.
const ANNUAL_GLOBAL_GOVERNMENT_SPEND_USD = 37_000_000_000_000;
const DAILY_GOVERNMENT_SPEND_USD = ANNUAL_GLOBAL_GOVERNMENT_SPEND_USD / 365;
const WEEKLY_GOVERNMENT_SPEND_USD = ANNUAL_GLOBAL_GOVERNMENT_SPEND_USD / 52;
const DAILY_DISEASE_DEATHS = GLOBAL_DISEASE_DEATHS_DAILY.value;

export const REFERRAL_EMAIL_SEQUENCE_LENGTH = FOLLOW_UP_DELAYS_MS.length;

interface ReferralEmailState {
  createdAt: Date;
  newsletterSubscribed: boolean;
  referralCount: number;
  referralEmailSequenceLastSentAt?: Date | null;
  referralEmailSequenceStep: number;
}

export interface ReferralEmailContentInput {
  highlights: readonly OverdueSignerHighlight[];
  name?: string | null;
  overdueSignerCount: number;
  referralCode: string;
  referralCount: number;
  shareUrl: string;
  step: number;
}

type ReferralSequenceCompleteReason = "goal_met" | "opted_out";

export type ReferralSequenceAction =
  | { type: "complete"; reason: ReferralSequenceCompleteReason }
  | { step: number; type: "send" };

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeAttr(value: string) {
  return escapeHtml(value);
}

function getStepDayLabel(step: number) {
  if (step === 0) return "DAY 1";
  if (step === 1) return "DAY 2";
  return "DAY 5";
}

function getStepElapsedDays(step: number) {
  if (step <= 0) return 0;
  const delayMs = FOLLOW_UP_DELAYS_MS[step] ?? 0;
  return Math.round(delayMs / DAY_MS);
}

function getElapsedDeaths(step: number) {
  const days = getStepElapsedDays(step);
  return days > 0 ? DAILY_DISEASE_DEATHS * days : 0;
}

function getElapsedGovernmentSpendUsd(step: number) {
  const days = getStepElapsedDays(step);
  return days > 0 ? DAILY_GOVERNMENT_SPEND_USD * days : 0;
}

function formatCount(value: number) {
  return formatCompactCount(value, { maximumFractionDigits: value >= 1000 ? 1 : 0 });
}

function getSubject(step: number, referralCount: number, overdueSignerCount: number) {
  if (step === 0) {
    return `You now supervise ${overdueSignerCount} overdue world leaders. Pick one to remind.`;
  }

  if (step === 1 && referralCount === 0) {
    return `24h status: ${formatCount(getElapsedDeaths(1))} more dead. ${overdueSignerCount} employees still overdue.`;
  }

  if (step === 1) {
    return `${referralCount} peers are supervising. ${overdueSignerCount} employees still overdue.`;
  }

  if (referralCount === 0) {
    return `Performance review: they spent ${formatCompactCurrency(WEEKLY_GOVERNMENT_SPEND_USD)} this week. You reminded nobody.`;
  }

  return `Final status report. ${referralCount} peers, ${overdueSignerCount} employees still overdue.`;
}

function getHeadline(step: number, referralCount: number, overdueSignerCount: number) {
  if (step === 0) {
    return `${overdueSignerCount} of your employees are overdue on "Sign the 1% Treaty." Pick one to remind.`;
  }

  if (step === 1 && referralCount === 0) {
    return `24 hours later. ${formatCount(getElapsedDeaths(1))} more humans died. Your ${overdueSignerCount} employees haven't moved.`;
  }

  if (step === 1) {
    return `${referralCount} peers joined the PMO. The task queue has not moved.`;
  }

  if (referralCount === 0) {
    return `Four-day performance review. Your employees drew ${formatCompactCurrency(getElapsedGovernmentSpendUsd(2))} for tasks you did not assign.`;
  }

  return `Final automated briefing. ${referralCount} peers supervising. ${overdueSignerCount} still overdue.`;
}

function buildRemindHref(taskHref: string, referralCode: string) {
  const separator = taskHref.includes("?") ? "&" : "?";
  return `${taskHref}${separator}ref=${encodeURIComponent(referralCode)}`;
}

function buildHighlightCardHtml(
  highlight: OverdueSignerHighlight,
  referralCode: string,
) {
  const remindHref = escapeAttr(buildRemindHref(highlight.taskHref, referralCode));
  const leaderName = escapeHtml(highlight.leaderFullName);
  const firstNameUpper = escapeHtml(highlight.leaderFirstName.toUpperCase());
  const overdueLabel = escapeHtml(highlight.overdueLabel.toUpperCase());
  const metaParts: string[] = [];
  if (highlight.roleTitle) metaParts.push(escapeHtml(highlight.roleTitle));
  if (highlight.countryLabel) metaParts.push(escapeHtml(highlight.countryLabel));
  const metaLine =
    metaParts.length > 0
      ? `<p style="margin:0;font-size:13px;font-weight:700;color:#4b5563;line-height:1.4;">${metaParts.join(" · ")}</p>`
      : "";

  const avatarCell = highlight.leaderImageUrl
    ? `<td style="width:64px;vertical-align:middle;padding:0 16px 0 0;">
        <img
          src="${escapeAttr(highlight.leaderImageUrl)}"
          alt="${leaderName}"
          width="64"
          height="64"
          style="display:block;width:64px;height:64px;border:3px solid #111827;border-radius:50%;object-fit:cover;"
        />
      </td>`
    : "";

  const deathsCell =
    highlight.deathsFromDelayLabel != null
      ? `<td style="width:50%;padding:0 4px 0 0;vertical-align:top;">
          <div style="border:3px solid #111827;background:#FF3333;color:#ffffff;padding:10px;text-align:center;">
            <p style="margin:0 0 2px;font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;">💀 Deaths</p>
            <p style="margin:0;font-size:20px;font-weight:900;line-height:1;">${escapeHtml(highlight.deathsFromDelayLabel)}</p>
          </div>
        </td>`
      : `<td style="width:50%;padding:0 4px 0 0;"></td>`;

  const wastedCell =
    highlight.wastedUsdLabel != null
      ? `<td style="width:50%;padding:0 0 0 4px;vertical-align:top;">
          <div style="border:3px solid #111827;background:#FF3333;color:#ffffff;padding:10px;text-align:center;">
            <p style="margin:0 0 2px;font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;">💸 Wasted</p>
            <p style="margin:0;font-size:20px;font-weight:900;line-height:1;">${escapeHtml(highlight.wastedUsdLabel)}</p>
          </div>
        </td>`
      : `<td style="width:50%;padding:0 0 0 4px;"></td>`;

  return `
    <div style="margin:0 0 16px;border:3px solid #111827;background:#ffffff;padding:14px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
        <tr>
          ${avatarCell}
          <td style="vertical-align:middle;">
            <p style="margin:0 0 2px;font-size:17px;font-weight:900;line-height:1.2;color:#111827;">${leaderName}</p>
            ${metaLine}
          </td>
        </tr>
      </table>
      <div style="margin:10px 0 10px;display:inline-block;background:#FF3333;color:#ffffff;padding:5px 10px;border:3px solid #111827;font-size:11px;font-weight:900;letter-spacing:.05em;">
        🔴 ${overdueLabel}
      </div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:12px;">
        <tr>
          ${deathsCell}
          ${wastedCell}
        </tr>
      </table>
      <a
        href="${remindHref}"
        style="display:block;background:#FF6B9D;color:#ffffff;padding:14px 20px;text-decoration:none;font-weight:900;border:3px solid #111827;font-size:17px;text-align:center;letter-spacing:.05em;"
      >
        REMIND ${firstNameUpper} →
      </a>
    </div>
  `;
}

function buildFallbackCardHtml(overdueSignerCount: number) {
  const href = escapeAttr(getTreatyParentTaskHref());
  const label = overdueSignerCount > 0 ? `${overdueSignerCount} WORLD LEADERS OVERDUE` : "WORLD LEADERS OVERDUE";
  return `
    <div style="margin:0 0 16px;border:3px solid #111827;background:#ffffff;padding:20px;text-align:center;">
      <p style="margin:0 0 16px;font-size:22px;font-weight:900;line-height:1.1;color:#111827;">${escapeHtml(label)}</p>
      <a
        href="${href}"
        style="display:inline-block;background:#FF6B9D;color:#ffffff;padding:14px 24px;text-decoration:none;font-weight:900;border:3px solid #111827;font-size:17px;letter-spacing:.05em;"
      >
        OPEN THE TASK QUEUE →
      </a>
    </div>
  `;
}

function buildHighlightsHtml(
  highlights: readonly OverdueSignerHighlight[],
  referralCode: string,
  overdueSignerCount: number,
) {
  if (highlights.length === 0) {
    return buildFallbackCardHtml(overdueSignerCount);
  }
  return highlights.map((h) => buildHighlightCardHtml(h, referralCode)).join("");
}

function buildHighlightsText(
  highlights: readonly OverdueSignerHighlight[],
  overdueSignerCount: number,
) {
  if (highlights.length === 0) {
    const label = overdueSignerCount > 0 ? `${overdueSignerCount} world leaders overdue` : "World leaders overdue";
    return [
      label,
      `Open the task queue: ${getTreatyParentTaskHref()}`,
    ].join("\n");
  }

  return highlights
    .map((h) => {
      const meta = [h.roleTitle, h.countryLabel].filter(Boolean).join(" · ");
      const stats = [
        h.deathsFromDelayLabel ? `${h.deathsFromDelayLabel} deaths` : null,
        h.wastedUsdLabel ? `${h.wastedUsdLabel} wasted` : null,
      ]
        .filter(Boolean)
        .join(", ");
      return [
        `• ${h.leaderFullName}${meta ? ` (${meta})` : ""} — ${h.overdueLabel.toUpperCase()}${stats ? `. ${stats}.` : "."}`,
        `  Remind: ${h.taskHref}`,
      ].join("\n");
    })
    .join("\n");
}

export function getReferralSequenceAction(
  state: ReferralEmailState,
  now: Date = new Date(),
): ReferralSequenceAction | null {
  if (state.referralEmailSequenceStep >= REFERRAL_EMAIL_SEQUENCE_LENGTH) {
    return null;
  }

  if (state.referralCount >= REFERRAL_TARGET) {
    return { type: "complete", reason: "goal_met" };
  }

  if (state.referralEmailSequenceStep > 0 && !state.newsletterSubscribed) {
    return { type: "complete", reason: "opted_out" };
  }

  if (state.referralEmailSequenceStep === 0) {
    // The welcome-email handler sends step 0 synchronously during signup.
    // Wait before the cron retries, so we don't double-send.
    const ageMs = now.getTime() - state.createdAt.getTime();
    if (ageMs < STEP_0_CRON_GRACE_MS) {
      return null;
    }
    return { type: "send", step: 0 };
  }

  const lastSentAt = state.referralEmailSequenceLastSentAt ?? state.createdAt;
  const delayMs = FOLLOW_UP_DELAYS_MS[state.referralEmailSequenceStep];
  const dueAt = new Date(lastSentAt.getTime() + delayMs);

  if (dueAt <= now) {
    return { type: "send", step: state.referralEmailSequenceStep };
  }

  return null;
}

export function buildReferralSequenceEmail({
  highlights,
  overdueSignerCount,
  referralCode,
  referralCount,
  shareUrl,
  step,
}: ReferralEmailContentInput) {
  const subject = getSubject(step, referralCount, overdueSignerCount);
  const headline = getHeadline(step, referralCount, overdueSignerCount);
  const stepLabel = getStepDayLabel(step);
  const treatyHref = getTreatyParentTaskHref();
  const viewAllLabel = `VIEW ALL ${overdueSignerCount} OVERDUE EMPLOYEES →`;

  const highlightsHtml = buildHighlightsHtml(highlights, referralCode, overdueSignerCount);
  const highlightsText = buildHighlightsText(highlights, overdueSignerCount);

  const textLines = [
    `PRESIDENT MANAGEMENT SYSTEM · STATUS REPORT · ${stepLabel}`,
    "",
    headline,
    "",
    highlightsText,
    "",
    `View all ${overdueSignerCount} overdue employees: ${treatyHref}`,
    "",
    "You pay these heads of government $37T/year to promote general welfare. Your job is to remind them.",
    "— Wishonia, PMO",
    "",
    `Forward this? Your link: ${shareUrl}`,
  ];

  const html = `
    <div style="background:#f4f4f5;padding:32px 16px;font-family:Arial,sans-serif;color:#111827;">
      <div style="max-width:620px;margin:0 auto;background:#ffffff;border:3px solid #111827;">
        <div style="background:#FF6B9D;border-bottom:3px solid #111827;padding:14px 20px;">
          <p style="margin:0;font-size:11px;font-weight:900;letter-spacing:.12em;text-transform:uppercase;color:#111827;">
            ${escapeHtml(PRESIDENT_MANAGEMENT_HEADLINE)} · Status Report · ${escapeHtml(stepLabel)}
          </p>
        </div>
        <div style="padding:22px 20px 4px;">
          <p style="margin:0 0 20px;font-size:19px;font-weight:900;line-height:1.25;color:#111827;">
            ${escapeHtml(headline)}
          </p>
          ${highlightsHtml}
          <p style="margin:4px 0 18px;text-align:center;">
            <a
              href="${escapeAttr(treatyHref)}"
              style="display:inline-block;font-size:12px;font-weight:900;letter-spacing:.08em;text-transform:uppercase;color:#111827;text-decoration:underline;"
            >
              ${escapeHtml(viewAllLabel)}
            </a>
          </p>
        </div>
        <div style="padding:14px 20px 16px;border-top:3px solid #111827;background:#FFE66D;">
          <p style="margin:0;font-size:12px;font-weight:700;line-height:1.5;color:#111827;">
            You pay these heads of government $37T/year to promote general welfare. Your job is to remind them. — <em>Wishonia, PMO</em>
          </p>
          <p style="margin:6px 0 0;font-size:10px;line-height:1.5;color:#111827;">
            Forward this? Your link tracks it: <a href="${escapeAttr(shareUrl)}" style="color:#111827;text-decoration:underline;">${escapeHtml(shareUrl)}</a>
          </p>
        </div>
      </div>
    </div>
  `;

  return {
    subject,
    text: textLines.join("\n"),
    html,
  };
}
