import { ROUTES } from "@/lib/routes";
import { getBaseUrl } from "@/lib/url";

export const COMMENT_NOTIFICATION_PLACEHOLDER = "{{UNSUBSCRIBE_URL}}";

export interface CommentNotificationTaskInput {
  description: string | null;
  id: string;
  title: string;
}

export interface CommentNotificationCommentInput {
  authorName: string | null;
  message: string;
}

export interface CommentNotificationInput {
  ancestors: Array<{ title: string }>;
  baseUrl?: string;
  comment: CommentNotificationCommentInput;
  task: CommentNotificationTaskInput;
}

export interface CommentNotificationEmail {
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

function buildSubject(comment: CommentNotificationCommentInput, taskTitle: string) {
  const author = comment.authorName?.trim();
  if (author) {
    return `${author}: ${taskTitle}`;
  }
  return `[Update] ${taskTitle}`;
}

function formatBreadcrumb(ancestors: Array<{ title: string }>) {
  if (ancestors.length === 0) return null;
  return ancestors.map((a) => a.title).join(" › ");
}

function absoluteTaskUrl(taskId: string, baseUrl: string) {
  return new URL(`${ROUTES.tasks}/${taskId}`, baseUrl).toString();
}

function buildHtml(input: {
  authorLabel: string;
  breadcrumb: string | null;
  commentMessage: string;
  description: string | null;
  taskUrl: string;
  title: string;
  unsubscribePlaceholder: string;
}) {
  const titleEsc = escapeHtml(input.title);
  const descriptionEsc = input.description ? escapeHtml(input.description) : null;
  const breadcrumbEsc = input.breadcrumb ? escapeHtml(input.breadcrumb) : null;
  const taskUrlEsc = escapeHtml(input.taskUrl);
  const authorLabelEsc = escapeHtml(input.authorLabel);
  const messageEsc = escapeHtml(input.commentMessage);

  return `<!doctype html>
<html lang="en">
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;color:#111827;">
  <div style="background:#f4f4f5;padding:32px 16px;">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border:3px solid #111827;padding:32px;">
      <p style="margin:0 0 12px;font-size:12px;font-weight:900;letter-spacing:.08em;text-transform:uppercase;color:#71717a;">
        New activity
      </p>
      <h1 style="margin:0 0 16px;font-size:26px;line-height:1.2;font-weight:900;">
        ${titleEsc}
      </h1>
      ${breadcrumbEsc
        ? `<p style="margin:0 0 16px;font-size:13px;line-height:1.5;color:#52525b;font-weight:700;">${breadcrumbEsc}</p>`
        : ""}
      <div style="margin:0 0 24px;padding:16px;border-left:3px solid #111827;background:#f4f4f5;font-size:15px;line-height:1.6;white-space:pre-wrap;">
        <div style="font-weight:700;margin-bottom:6px;">${authorLabelEsc}:</div>${messageEsc}
      </div>
      ${descriptionEsc
        ? `<div style="margin:0 0 24px;font-size:14px;line-height:1.6;white-space:pre-wrap;color:#52525b;">${descriptionEsc}</div>`
        : ""}
      <a
        href="${taskUrlEsc}"
        style="display:inline-block;background:#111827;color:#ffffff;padding:14px 24px;text-decoration:none;font-weight:900;border:2px solid #111827;text-transform:uppercase;letter-spacing:.06em;font-size:14px;"
      >
        Open the task
      </a>
      <p style="margin:32px 0 0;font-size:12px;line-height:1.6;color:#71717a;">
        Don't want updates for this task? <a href="${input.unsubscribePlaceholder}" style="color:#71717a;">Unsubscribe</a>.
      </p>
    </div>
  </div>
</body>
</html>`;
}

function buildText(input: {
  authorLabel: string;
  breadcrumb: string | null;
  commentMessage: string;
  description: string | null;
  taskUrl: string;
  title: string;
  unsubscribePlaceholder: string;
}) {
  return [
    "NEW ACTIVITY",
    "",
    input.title,
    input.breadcrumb,
    input.breadcrumb ? "" : null,
    `${input.authorLabel}:`,
    input.commentMessage,
    "",
    input.description,
    input.description ? "" : null,
    `Open the task: ${input.taskUrl}`,
    "",
    `Unsubscribe: ${input.unsubscribePlaceholder}`,
  ]
    .filter((line): line is string => line !== null && line !== undefined)
    .join("\n");
}

export function buildTaskCommentNotificationEmail(
  input: CommentNotificationInput,
): CommentNotificationEmail {
  const baseUrl = input.baseUrl ?? getBaseUrl();
  const breadcrumb = formatBreadcrumb(input.ancestors);
  const taskUrl = absoluteTaskUrl(input.task.id, baseUrl);
  const authorLabel = input.comment.authorName?.trim() || "Someone";
  const subject = buildSubject(input.comment, input.task.title);
  const params = {
    authorLabel,
    breadcrumb,
    commentMessage: input.comment.message,
    description: input.task.description,
    taskUrl,
    title: input.task.title,
    unsubscribePlaceholder: COMMENT_NOTIFICATION_PLACEHOLDER,
  };

  return {
    html: buildHtml(params),
    subject,
    text: buildText(params),
  };
}
