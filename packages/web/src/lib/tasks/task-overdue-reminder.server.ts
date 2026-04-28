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

function buildSubject(sendCount: number, title: string) {
  const prefix = sendCount >= MAX_OVERDUE_SEND_COUNT ? "[FINAL NOTICE]" : "[OVERDUE]";
  return `${prefix} ${title}`;
}

function daysOverdue(dueAt: Date | null, now: Date) {
  if (!dueAt) return 0;
  const ms = now.getTime() - dueAt.getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
}

function formatBreadcrumb(ancestors: Array<{ title: string }>) {
  if (ancestors.length === 0) return null;
  return ancestors.map((a) => a.title).join(" › ");
}

function absoluteTaskUrl(taskId: string, baseUrl: string) {
  const url = new URL(`${ROUTES.tasks}/${taskId}`, baseUrl);
  return url.toString();
}

function renderCommentsHtml(comments: OverdueReminderComment[]) {
  if (comments.length === 0) return "";
  const items = comments
    .map((comment) => {
      const author = comment.authorName ? escapeHtml(comment.authorName) : "Anonymous";
      const message = escapeHtml(comment.message);
      return `<div style="margin:0 0 16px;padding:12px 14px;border-left:3px solid #111827;background:#f4f4f5;font-size:14px;line-height:1.5;white-space:pre-wrap;"><div style="font-weight:700;margin-bottom:4px;">${author}:</div>${message}</div>`;
    })
    .join("");
  return `<div style="margin:0 0 24px;"><p style="margin:0 0 8px;font-size:12px;font-weight:900;letter-spacing:.08em;text-transform:uppercase;color:#71717a;">Recent activity</p>${items}</div>`;
}

function buildHtml(input: {
  breadcrumb: string | null;
  comments: OverdueReminderComment[];
  daysLate: number;
  description: string | null;
  isFinal: boolean;
  taskUrl: string;
  title: string;
  unsubscribePlaceholder: string;
}) {
  const titleEsc = escapeHtml(input.title);
  const descriptionEsc = input.description ? escapeHtml(input.description) : null;
  const breadcrumbEsc = input.breadcrumb ? escapeHtml(input.breadcrumb) : null;
  const taskUrlEsc = escapeHtml(input.taskUrl);
  const banner = input.isFinal ? "FINAL NOTICE" : "OVERDUE TASK";
  const overdueLine =
    input.daysLate > 0
      ? `${input.daysLate} day${input.daysLate === 1 ? "" : "s"} overdue.`
      : "Overdue.";

  return `<!doctype html>
<html lang="en">
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;color:#111827;">
  <div style="background:#f4f4f5;padding:32px 16px;">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border:3px solid #111827;padding:32px;">
      <p style="margin:0 0 12px;font-size:12px;font-weight:900;letter-spacing:.08em;text-transform:uppercase;color:#71717a;">
        ${banner}
      </p>
      <h1 style="margin:0 0 16px;font-size:26px;line-height:1.2;font-weight:900;">
        ${titleEsc}
      </h1>
      ${breadcrumbEsc
        ? `<p style="margin:0 0 16px;font-size:13px;line-height:1.5;color:#52525b;font-weight:700;">${breadcrumbEsc}</p>`
        : ""}
      <p style="margin:0 0 20px;font-size:15px;line-height:1.5;font-weight:700;">
        ${overdueLine}
      </p>
      ${descriptionEsc
        ? `<div style="margin:0 0 24px;font-size:15px;line-height:1.6;white-space:pre-wrap;">${descriptionEsc}</div>`
        : ""}
      ${renderCommentsHtml(input.comments)}
      <a
        href="${taskUrlEsc}"
        style="display:inline-block;background:#111827;color:#ffffff;padding:14px 24px;text-decoration:none;font-weight:900;border:2px solid #111827;text-transform:uppercase;letter-spacing:.06em;font-size:14px;"
      >
        Open the task
      </a>
      <p style="margin:32px 0 0;font-size:12px;line-height:1.6;color:#71717a;">
        Don't want overdue reminders for this task? <a href="${input.unsubscribePlaceholder}" style="color:#71717a;">Unsubscribe</a>.
      </p>
    </div>
  </div>
</body>
</html>`;
}

function renderCommentsText(comments: OverdueReminderComment[]) {
  if (comments.length === 0) return null;
  const lines = ["RECENT ACTIVITY", ""];
  for (const comment of comments) {
    const author = comment.authorName ?? "Anonymous";
    lines.push(`${author}:`);
    lines.push(comment.message);
    lines.push("");
  }
  return lines.join("\n");
}

function buildText(input: {
  breadcrumb: string | null;
  comments: OverdueReminderComment[];
  daysLate: number;
  description: string | null;
  isFinal: boolean;
  taskUrl: string;
  title: string;
  unsubscribePlaceholder: string;
}) {
  const overdueLine =
    input.daysLate > 0
      ? `${input.daysLate} day${input.daysLate === 1 ? "" : "s"} overdue.`
      : "Overdue.";
  const banner = input.isFinal ? "FINAL NOTICE" : "OVERDUE TASK";
  const commentsBlock = renderCommentsText(input.comments);

  return [
    banner,
    "",
    input.title,
    input.breadcrumb ? input.breadcrumb : null,
    "",
    overdueLine,
    "",
    input.description ?? null,
    input.description ? "" : null,
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
  const isFinal = input.sendCount >= MAX_OVERDUE_SEND_COUNT;
  const daysLate = daysOverdue(input.task.dueAt, now);
  const breadcrumb = formatBreadcrumb(input.ancestors);
  const taskUrl = absoluteTaskUrl(input.task.id, baseUrl);
  const subject = buildSubject(input.sendCount, input.task.title);
  const comments = (input.comments ?? []).slice(0, MAX_COMMENTS_IN_REMINDER);
  const params = {
    breadcrumb,
    comments,
    daysLate,
    description: input.task.description,
    isFinal,
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
