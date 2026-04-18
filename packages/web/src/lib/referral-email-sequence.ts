import { GLOBAL_DISEASE_DEATHS_DAILY } from "@optimitron/data/parameters";
import { PRESIDENT_MANAGEMENT_HEADLINE } from "@/content/mission-statement";
import {
  getEmailBaseUrl,
  getEmailUrls,
  prefixEmailHref,
  prefixEmailImage,
} from "@/lib/email-urls";
import { buildChannelHref, type ShareableChannel } from "@/lib/share-channels";
import {
  formatCompactCount,
  formatCompactCurrency,
} from "@/lib/tasks/accountability";
import type { OverdueSignerHighlight } from "@/lib/tasks/overdue-signers.server";
import { getTreatyParentTaskHref } from "@/lib/tasks/task-keys";

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const WEEK_MS = 7 * DAY_MS;
const REFERRAL_TARGET = 3;

/** Step 0 = welcome send (day 1). Step 1 = 24h follow-up. Step 2 = 96h (day 5). Step 3+ = weekly. */
const INITIAL_DELAYS_MS = [0, 24 * HOUR_MS, 96 * HOUR_MS] as const;

/** Hard ceiling so we stop eventually — 3 initial + 12 weekly ≈ 12-week tail. */
export const REFERRAL_EMAIL_SEQUENCE_MAX_STEP = 15;

/** Cron waits this long before retrying a step-0 send, giving the
 *  welcome-email handler (signup / auth event) time to advance the step. */
export const STEP_0_CRON_GRACE_MS = 10 * 60 * 1000;

const ANNUAL_GLOBAL_GOVERNMENT_SPEND_USD = 37_000_000_000_000;
const DAILY_GOVERNMENT_SPEND_USD = ANNUAL_GLOBAL_GOVERNMENT_SPEND_USD / 365;
const WEEKLY_GOVERNMENT_SPEND_USD = ANNUAL_GLOBAL_GOVERNMENT_SPEND_USD / 52;
const DAILY_DISEASE_DEATHS = GLOBAL_DISEASE_DEATHS_DAILY.value;

/** Legacy export — prefer REFERRAL_EMAIL_SEQUENCE_MAX_STEP. */
export const REFERRAL_EMAIL_SEQUENCE_LENGTH = REFERRAL_EMAIL_SEQUENCE_MAX_STEP;

export function getDelayMsForStep(step: number): number {
  if (step < 0) return 0;
  if (step < INITIAL_DELAYS_MS.length) return INITIAL_DELAYS_MS[step];
  return WEEK_MS;
}

export interface EmailShareButton {
  channel: ShareableChannel;
  label: string;
  /** Final HTML-attribute-ready href — already has ?sa= embedded via the message. */
  href: string;
}

interface ReferralEmailState {
  createdAt: Date;
  newsletterSubscribed: boolean;
  referralCount: number;
  referralEmailSequenceLastSentAt?: Date | null;
  referralEmailSequenceStep: number;
  unsubscribedScopes?: readonly string[];
}

export interface ReferralEmailContentInput {
  /** Preferred path: the user's single overdue head-of-state (personalized). */
  presidentHighlight?: OverdueSignerHighlight | null;
  /** Preferred path: the rendered share-template message (one per email). */
  presidentRenderedMessage?: string | null;
  /** Preferred path: share-button hrefs with sa= already embedded. */
  shareButtons?: readonly EmailShareButton[];
  /** Fallback: 3-leader highlights grid when we couldn't resolve a president. */
  highlights: readonly OverdueSignerHighlight[];
  name?: string | null;
  overdueSignerCount: number;
  referralCode: string;
  referralCount: number;
  shareUrl: string;
  step: number;
  /** Pre-selected subject variant (server picks uniform-random + passes here). */
  subject?: string;
  /** Signed unsubscribe URL rendered in the footer. */
  unsubscribeUrl?: string;
  /** Base URL used to absolutize internal links. Defaults to the email base URL. */
  baseUrl?: string;
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
  if (step === 2) return "DAY 5";
  const weeksIntoTail = step - 2;
  return `WEEK ${weeksIntoTail + 1}`;
}

function getStepElapsedDays(step: number) {
  if (step <= 0) return 0;
  let total = 0;
  for (let i = 1; i <= step; i += 1) {
    total += getDelayMsForStep(i);
  }
  return Math.round(total / DAY_MS);
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

// ─────────────────────────────────────────────────────────────────────────────
// Subject-variant pool (uniform-random selection)
// ─────────────────────────────────────────────────────────────────────────────

export interface SubjectVariantContext {
  deathsSinceLastEmail: number;
  overdueSignerCount: number;
  presidentFirstName: string | null;
  presidentFullName: string | null;
  referralCount: number;
  step: number;
  wastedUsdSinceLastEmail: number;
}

export interface SubjectVariant {
  id: string;
  /** Raw template string — stored on EmailLog.subjectTemplate as the grouping key. */
  template: string;
  build: (ctx: SubjectVariantContext) => string;
}

/** Falls back to the generic "employee" framing when we don't have a president. */
const SUBJECT_POOL_GENERIC: readonly SubjectVariant[] = [
  {
    id: "deaths-stat",
    template: "{deaths} people died while your employee ignored a 30-second task",
    build: (ctx) =>
      `${formatCount(Math.max(ctx.deathsSinceLastEmail, 1))} people died while your employee ignored a 30-second task`,
  },
  {
    id: "action-required-remind",
    template: "[ACTION REQUIRED] Remind your employee to end war and disease (30 sec)",
    build: () => "[ACTION REQUIRED] Remind your employee to end war and disease (30 sec)",
  },
  {
    id: "wasted-usd",
    template: "{wasted} wasted since your employee's last status update",
    build: (ctx) =>
      `${formatCompactCurrency(Math.max(ctx.wastedUsdSinceLastEmail, 1))} wasted since your employee's last status update`,
  },
  {
    id: "action-required-overdue",
    template: "[ACTION REQUIRED] Your employee is {days} days overdue",
    build: (ctx) =>
      `[ACTION REQUIRED] Your employee is ${Math.max(getStepElapsedDays(ctx.step), 1)} days overdue`,
  },
  {
    id: "performance-review",
    template: "Performance review: your employees spent {wasted} this week, signed nothing",
    build: () =>
      `Performance review: your employees spent ${formatCompactCurrency(WEEKLY_GOVERNMENT_SPEND_USD)} this week, signed nothing`,
  },
  {
    id: "action-required-30-sec",
    template: "[ACTION REQUIRED] 30 seconds from you. ~{deaths} lives.",
    build: (ctx) =>
      `[ACTION REQUIRED] 30 seconds from you. ~${formatCount(Math.max(ctx.deathsSinceLastEmail, 1))} lives.`,
  },
];

const SUBJECT_POOL_PRESIDENT: readonly SubjectVariant[] = [
  {
    id: "president-deaths",
    template: "{deaths} people died while {pres} ignored a 30-second task",
    build: (ctx) =>
      `${formatCount(Math.max(ctx.deathsSinceLastEmail, 1))} people died while ${ctx.presidentFullName ?? "your employee"} ignored a 30-second task`,
  },
  {
    id: "action-required-president",
    template: "[ACTION REQUIRED] Remind {pres} to end war and disease (30 sec)",
    build: (ctx) =>
      `[ACTION REQUIRED] Remind ${ctx.presidentFirstName ?? "your employee"} to end war and disease (30 sec)`,
  },
  {
    id: "president-wasted",
    template: "{wasted} wasted since {pres}'s last status update",
    build: (ctx) =>
      `${formatCompactCurrency(Math.max(ctx.wastedUsdSinceLastEmail, 1))} wasted since ${ctx.presidentFullName ?? "your employee"}'s last status update`,
  },
  {
    id: "action-required-president-overdue",
    template: "[ACTION REQUIRED] {pres} is {days} days overdue",
    build: (ctx) =>
      `[ACTION REQUIRED] ${ctx.presidentFirstName ?? "Your employee"} is ${Math.max(getStepElapsedDays(ctx.step), 1)} days overdue`,
  },
  {
    id: "president-performance-review",
    template: "Performance review: {pres} spent {wasted} this week, signed nothing",
    build: (ctx) =>
      `Performance review: ${ctx.presidentFullName ?? "your employee"} spent ${formatCompactCurrency(WEEKLY_GOVERNMENT_SPEND_USD)} this week, signed nothing`,
  },
  {
    id: "action-required-30-sec-from-you",
    template: "[ACTION REQUIRED] 30 seconds from you. ~{deaths} lives from {pres}.",
    build: (ctx) =>
      `[ACTION REQUIRED] 30 seconds from you. ~${formatCount(Math.max(ctx.deathsSinceLastEmail, 1))} lives from ${ctx.presidentFirstName ?? "your employee"}.`,
  },
];

/**
 * Pick a subject variant uniform-at-random from the pool appropriate for
 * whether we know the user's president. Returns both the raw template
 * (stored on EmailLog) and the final rendered subject line.
 */
export function pickSubjectVariant(
  ctx: SubjectVariantContext,
  rand: () => number = Math.random,
): { subject: string; subjectTemplate: string; variantId: string } {
  const pool = ctx.presidentFullName ? SUBJECT_POOL_PRESIDENT : SUBJECT_POOL_GENERIC;
  const index = Math.min(Math.floor(rand() * pool.length), pool.length - 1);
  const variant = pool[index];
  return {
    subject: variant.build(ctx),
    subjectTemplate: variant.template,
    variantId: variant.id,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Headlines (non-subject)
// ─────────────────────────────────────────────────────────────────────────────

function getHeadline(step: number, referralCount: number, overdueSignerCount: number, presidentFullName: string | null) {
  const leaderLabel = presidentFullName ?? "your employee";
  if (step === 0) {
    return presidentFullName
      ? `${leaderLabel} is overdue on "Sign the 1% Treaty." Remind them.`
      : `${overdueSignerCount} of your employees are overdue on "Sign the 1% Treaty." Pick one to remind.`;
  }
  if (step === 1 && referralCount === 0) {
    return `24 hours later. ${formatCount(getElapsedDeaths(1))} more humans died. ${leaderLabel} hasn't moved.`;
  }
  if (step === 1) {
    return `${referralCount} peers joined the PMO. ${leaderLabel} hasn't moved.`;
  }
  if (step === 2 && referralCount === 0) {
    return `Four-day performance review. ${leaderLabel} drew ${formatCompactCurrency(getElapsedGovernmentSpendUsd(2))} for tasks you did not assign.`;
  }
  if (referralCount === 0) {
    return `Week ${step - 1} status report. ${leaderLabel} is still overdue.`;
  }
  return `Week ${step - 1} briefing. ${referralCount} peers supervising. ${leaderLabel} still overdue.`;
}

// ─────────────────────────────────────────────────────────────────────────────
// HTML fragments
// ─────────────────────────────────────────────────────────────────────────────

function buildRemindHref(taskHref: string, referralCode: string, baseUrl: string) {
  const absolute = prefixEmailHref(taskHref, baseUrl);
  const separator = absolute.includes("?") ? "&" : "?";
  return `${absolute}${separator}ref=${encodeURIComponent(referralCode)}`;
}

function buildPresidentCardHtml(highlight: OverdueSignerHighlight) {
  const leaderName = escapeHtml(highlight.leaderFullName);
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
          src="${escapeAttr(prefixEmailImage(highlight.leaderImageUrl))}"
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
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
        <tr>
          ${deathsCell}
          ${wastedCell}
        </tr>
      </table>
    </div>
  `;
}

function buildReminderMessageBlockHtml(renderedMessage: string) {
  return `
    <div style="margin:0 0 12px;">
      <p style="margin:0 0 8px;font-size:11px;font-weight:900;letter-spacing:.14em;text-transform:uppercase;color:#6b7280;">
        Copy the message below, then tap any button to share.
      </p>
      <pre style="margin:0;white-space:pre-wrap;word-wrap:break-word;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:14px;line-height:1.5;border:3px solid #111827;background:#FFE66D;color:#111827;padding:14px;font-weight:600;">${escapeHtml(renderedMessage)}</pre>
    </div>
  `;
}

function buildShareButtonsHtml(buttons: readonly EmailShareButton[]) {
  if (buttons.length === 0) return "";
  const cells = buttons
    .map(
      (btn) => `
        <td style="padding:4px;">
          <a
            href="${escapeAttr(btn.href)}"
            style="display:inline-block;min-width:96px;background:#111827;color:#ffffff;padding:10px 12px;text-decoration:none;font-weight:900;border:3px solid #111827;font-size:12px;letter-spacing:.05em;text-align:center;text-transform:uppercase;"
          >
            ${escapeHtml(btn.label.toUpperCase())}
          </a>
        </td>`,
    )
    .join("");
  return `
    <div style="margin:0 0 18px;">
      <table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
        <tr>${cells}</tr>
      </table>
    </div>
  `;
}

function buildHighlightCardHtml(
  highlight: OverdueSignerHighlight,
  referralCode: string,
  baseUrl: string,
) {
  const remindHref = escapeAttr(buildRemindHref(highlight.taskHref, referralCode, baseUrl));
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
          src="${escapeAttr(prefixEmailImage(highlight.leaderImageUrl))}"
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

function buildFallbackCardHtml(overdueSignerCount: number, baseUrl: string) {
  const href = escapeAttr(prefixEmailHref(getTreatyParentTaskHref(), baseUrl));
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
  baseUrl: string,
) {
  if (highlights.length === 0) {
    return buildFallbackCardHtml(overdueSignerCount, baseUrl);
  }
  return highlights.map((h) => buildHighlightCardHtml(h, referralCode, baseUrl)).join("");
}

function buildHighlightsText(
  highlights: readonly OverdueSignerHighlight[],
  overdueSignerCount: number,
  baseUrl: string,
) {
  if (highlights.length === 0) {
    const label = overdueSignerCount > 0 ? `${overdueSignerCount} world leaders overdue` : "World leaders overdue";
    return [label, `Open the task queue: ${prefixEmailHref(getTreatyParentTaskHref(), baseUrl)}`].join("\n");
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
        `  Remind: ${prefixEmailHref(h.taskHref, baseUrl)}`,
      ].join("\n");
    })
    .join("\n");
}

// ─────────────────────────────────────────────────────────────────────────────
// Action / cadence
// ─────────────────────────────────────────────────────────────────────────────

export function getReferralSequenceAction(
  state: ReferralEmailState,
  now: Date = new Date(),
): ReferralSequenceAction | null {
  if (state.referralEmailSequenceStep >= REFERRAL_EMAIL_SEQUENCE_MAX_STEP) {
    return null;
  }

  if (state.referralCount >= REFERRAL_TARGET) {
    return { type: "complete", reason: "goal_met" };
  }

  const unsubscribedScopes = state.unsubscribedScopes ?? [];
  if (
    unsubscribedScopes.includes("all") ||
    unsubscribedScopes.includes("referral_sequence")
  ) {
    return { type: "complete", reason: "opted_out" };
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
  const delayMs = getDelayMsForStep(state.referralEmailSequenceStep);
  const dueAt = new Date(lastSentAt.getTime() + delayMs);

  if (dueAt <= now) {
    return { type: "send", step: state.referralEmailSequenceStep };
  }

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Email builder
// ─────────────────────────────────────────────────────────────────────────────

/** Channel-label pairs for email share buttons. */
export const EMAIL_SHARE_CHANNELS: readonly { channel: ShareableChannel; label: string }[] = [
  { channel: "x", label: "X / Twitter" },
  { channel: "bluesky", label: "Bluesky" },
  { channel: "linkedin", label: "LinkedIn" },
  { channel: "facebook", label: "Facebook" },
  { channel: "reddit", label: "Reddit" },
  { channel: "email", label: "Email" },
];

/** Build an email share button href from an outbound message + task URL. */
export function buildEmailShareButton(
  channel: ShareableChannel,
  label: string,
  message: string,
  shareUrl: string,
  taskTitle: string,
  shareText: string,
): EmailShareButton {
  return {
    channel,
    label,
    href: buildChannelHref(channel, {
      message,
      shareText,
      shareUrl,
      taskUrl: shareUrl,
      taskTitle,
    }),
  };
}

export function buildReferralSequenceEmail({
  baseUrl: explicitBaseUrl,
  highlights,
  overdueSignerCount,
  presidentHighlight,
  presidentRenderedMessage,
  referralCode,
  referralCount,
  shareButtons,
  shareUrl,
  step,
  subject: overrideSubject,
  unsubscribeUrl,
}: ReferralEmailContentInput) {
  const baseUrl = explicitBaseUrl ?? getEmailBaseUrl();
  const { settingsLink } = getEmailUrls();
  const presidentFullName = presidentHighlight?.leaderFullName ?? null;
  const presidentFirstName = presidentHighlight?.leaderFirstName ?? null;

  // If caller didn't provide a subject, fall back to a deterministic generic one so
  // the function remains usable in tests / legacy code paths.
  const subject =
    overrideSubject ??
    `${overdueSignerCount} of your employees are overdue. Remind them.`;

  const headline = getHeadline(step, referralCount, overdueSignerCount, presidentFullName);
  const stepLabel = getStepDayLabel(step);
  const treatyHref = prefixEmailHref(getTreatyParentTaskHref(), baseUrl);
  const viewAllLabel = `VIEW ALL ${overdueSignerCount} OVERDUE EMPLOYEES →`;

  const hasPersonalized =
    presidentHighlight != null &&
    presidentRenderedMessage != null &&
    shareButtons != null &&
    shareButtons.length > 0;

  const bodyHtml = hasPersonalized
    ? `${buildPresidentCardHtml(presidentHighlight)}${buildReminderMessageBlockHtml(presidentRenderedMessage)}${buildShareButtonsHtml(shareButtons)}`
    : buildHighlightsHtml(highlights, referralCode, overdueSignerCount, baseUrl);

  const bodyText = hasPersonalized
    ? [
        `${presidentHighlight.leaderFullName}${presidentHighlight.roleTitle ? ` (${presidentHighlight.roleTitle})` : ""} — ${presidentHighlight.overdueLabel.toUpperCase()}`,
        "",
        presidentRenderedMessage,
        "",
        "Share via: " + shareButtons.map((b) => b.label).join(", "),
      ].join("\n")
    : buildHighlightsText(highlights, overdueSignerCount, baseUrl);

  const textLines = [
    `PRESIDENT MANAGEMENT SYSTEM · STATUS REPORT · ${stepLabel}`,
    "",
    headline,
    "",
    bodyText,
    "",
    `View all ${overdueSignerCount} overdue employees: ${treatyHref}`,
    "",
    "You pay these heads of government $37T/year to promote general welfare. Your job is to remind them.",
    "— Wishonia, PMO",
    "",
    `Forward this? Your link: ${shareUrl}`,
    "",
    `Manage email settings: ${settingsLink}`,
    ...(unsubscribeUrl
      ? [`Unsubscribe: ${unsubscribeUrl}`]
      : []),
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
          ${bodyHtml}
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
          <p style="margin:6px 0 0;font-size:10px;line-height:1.5;color:#111827;"><a href="${escapeAttr(settingsLink)}" style="color:#111827;text-decoration:underline;">Manage email settings</a></p>
          ${unsubscribeUrl ? `<p style="margin:6px 0 0;font-size:10px;line-height:1.5;color:#111827;"><a href="${escapeAttr(unsubscribeUrl)}" style="color:#111827;text-decoration:underline;">Unsubscribe from weekly reminders</a></p>` : ""}
        </div>
      </div>
    </div>
  `;

  return {
    subject,
    text: textLines.join("\n"),
    html,
    presidentFullName,
    presidentFirstName,
  };
}
