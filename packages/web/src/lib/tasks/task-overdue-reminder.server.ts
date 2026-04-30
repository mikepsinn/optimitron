import { ROUTES } from "@/lib/routes";
import { getBaseUrl } from "@/lib/url";
import type { ResolvedTaskRecipient } from "@/lib/tasks/task-recipients.server";

export const OVERDUE_REMINDER_PLACEHOLDER = "{{UNSUBSCRIBE_URL}}";
export const MAX_OVERDUE_SEND_COUNT = 4;
export const MAX_COMMENTS_IN_REMINDER = 5;

export interface OverdueReminderTaskInput {
  description: string | null;
  dueAt: Date | null;
  id: string;
  title: string;
}

export interface OverdueReminderComment {
  authorName: string | null;
  createdAt: Date;
  message: string;
}

export interface OverdueReminderInput {
  ancestors: Array<{ title: string }>;
  baseUrl?: string;
  comments?: OverdueReminderComment[];
  now?: Date;
  recipient: ResolvedTaskRecipient;
  sendCount: number;
  task: OverdueReminderTaskInput;
}

export interface OverdueReminderEmail {
  html: string;
  subject: string;
  text: string;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/// Disease-mortality baseline used in the body line. ~55M deaths/year from
/// all diseases and aging globally → ~150,000/day. See
/// GLOBAL_ANNUAL_DEATHS_CURABLE_DISEASES in @optimitron/data/parameters.
/// Hardcoded here (not pulled from parameters) because rounding once is
/// fine for email copy and we don't want a parameter import in the
/// transactional path.
const GLOBAL_DAILY_DEATHS_FROM_DISEASE = 150_000;

function formatDeathCount(n: number): string {
  if (n >= 1_000_000) {
    return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1).replace(/\.0$/, "")} million`;
  }
  if (n >= 1_000) {
    return `${Math.round(n / 1_000) * 1_000}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }
  return `${n}`;
}

function buildSubject(sendCount: number, title: string) {
  /// Lumbergh-style escalation. No "[OVERDUE]" / "[FINAL NOTICE]" — corporate
  /// thriller framing fights the deadpan voice. Subject lines read like
  /// passive-aggressive corporate follow-up. Same task title at the end so
  /// inbox threading stays sane.
  if (sendCount >= MAX_OVERDUE_SEND_COUNT) {
    return `I'm gonna need you to go ahead and finish ${title}. Mmkay?`;
  }
  if (sendCount >= 3) {
    return `Did you get the memo on ${title}?`;
  }
  if (sendCount >= 2) {
    return `So... about ${title}`;
  }
  return `Yeahhh, about ${title}`;
}

function buildOpener(sendCount: number, title: string) {
  if (sendCount >= MAX_OVERDUE_SEND_COUNT) {
    return `I'm gonna need you to go ahead and finish ${title}, mmkay? That'd be great.`;
  }
  if (sendCount >= 3) {
    return `So I'm not sure if you got the memo, but ${title} is still sitting there. Did you get the memo?`;
  }
  if (sendCount >= 2) {
    return `Yeahhh, so we're gonna need to circle back on ${title}.`;
  }
  return `Yeahhh... if you could just go ahead and finish ${title}, that'd be great.`;
}

function daysOverdue(dueAt: Date | null, now: Date) {
  if (!dueAt) return 0;
  const ms = now.getTime() - dueAt.getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
}

function absoluteTaskUrl(taskId: string, baseUrl: string) {
  const url = new URL(`${ROUTES.tasks}/${taskId}`, baseUrl);
  return url.toString();
}

function renderCommentsHtml(comments: OverdueReminderComment[]) {
  if (comments.length === 0) return "";
  return comments
    .map((comment) => {
      const message = escapeHtml(comment.message);
      return `<div style="margin:0 0 16px;font-size:15px;line-height:1.6;white-space:pre-wrap;">${message}</div>`;
    })
    .join("");
}

function buildMortalityLine(daysLate: number): string {
  /// Lumbergh-style understatement applied to civilizational catastrophe:
  /// quote the death count as an FYI, mmkay. The N=daysLate × 150,000
  /// approximation rounds aggressively because the joke is the absurd
  /// ratio, not three-decimal precision. For ≤0 days we still render
  /// something — overdue triggers run on tasks past their dueAt.
  const days = Math.max(daysLate, 1);
  const deaths = days * GLOBAL_DAILY_DEATHS_FROM_DISEASE;
  return `About ${formatDeathCount(deaths)} people died waiting in the meantime, just an FYI.`;
}

function buildHtml(input: {
  comments: OverdueReminderComment[];
  daysLate: number;
  opener: string;
  taskUrl: string;
  title: string;
  unsubscribePlaceholder: string;
}) {
  const titleEsc = escapeHtml(input.title);
  const taskUrlEsc = escapeHtml(input.taskUrl);
  const openerEsc = escapeHtml(input.opener);
  const days = Math.max(input.daysLate, 1);
  const overdueLineEsc = escapeHtml(
    `${days} day${days === 1 ? "" : "s"} overdue. ${buildMortalityLine(input.daysLate)}`,
  );

  return `<!doctype html>
<html lang="en">
<body style="margin:0;padding:0;background:#ffffff;font-family:Arial,sans-serif;color:#111827;">
  <div style="padding:32px 16px;">
    <div style="max-width:560px;margin:0 auto;">
      <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;font-weight:900;">${titleEsc}</h1>
      <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">${openerEsc}</p>
      <p style="margin:0 0 24px;font-size:15px;line-height:1.5;color:#52525b;">${overdueLineEsc}</p>
      ${renderCommentsHtml(input.comments)}
      <a
        href="${taskUrlEsc}"
        style="display:inline-block;background:#111827;color:#ffffff;padding:14px 24px;text-decoration:none;font-weight:900;border:2px solid #111827;text-transform:uppercase;letter-spacing:.06em;font-size:14px;"
      >
        Open the task
      </a>
      <p style="margin:32px 0 0;font-size:12px;line-height:1.6;color:#71717a;">
        <a href="${input.unsubscribePlaceholder}" style="color:#71717a;">Unsubscribe</a>
      </p>
    </div>
  </div>
</body>
</html>`;
}

function renderCommentsText(comments: OverdueReminderComment[]) {
  if (comments.length === 0) return null;
  return comments.map((comment) => comment.message).join("\n\n");
}

function buildText(input: {
  comments: OverdueReminderComment[];
  daysLate: number;
  opener: string;
  taskUrl: string;
  title: string;
  unsubscribePlaceholder: string;
}) {
  const days = Math.max(input.daysLate, 1);
  const overdueLine = `${days} day${days === 1 ? "" : "s"} overdue. ${buildMortalityLine(
    input.daysLate,
  )}`;
  const commentsBlock = renderCommentsText(input.comments);

  return [
    input.title,
    "",
    input.opener,
    "",
    overdueLine,
    "",
    commentsBlock,
    commentsBlock ? "" : null,
    `Open the task: ${input.taskUrl}`,
    "",
    `Unsubscribe: ${input.unsubscribePlaceholder}`,
  ]
    .filter((line): line is string => line !== null)
    .join("\n");
}

export function buildOverdueReminderEmail(
  input: OverdueReminderInput,
): OverdueReminderEmail {
  const baseUrl = input.baseUrl ?? getBaseUrl();
  const now = input.now ?? new Date();
  const daysLate = daysOverdue(input.task.dueAt, now);
  const taskUrl = absoluteTaskUrl(input.task.id, baseUrl);
  const subject = buildSubject(input.sendCount, input.task.title);
  const comments = (input.comments ?? []).slice(0, MAX_COMMENTS_IN_REMINDER);
  const params = {
    comments,
    daysLate,
    opener: buildOpener(input.sendCount, input.task.title),
    taskUrl,
    title: input.task.title,
    unsubscribePlaceholder: OVERDUE_REMINDER_PLACEHOLDER,
  };

  return {
    html: buildHtml(params),
    subject,
    text: buildText(params),
  };
}
