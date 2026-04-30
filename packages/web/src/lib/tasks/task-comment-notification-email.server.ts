import {
  buildSenderSignatureHtml,
  buildSenderSignatureText,
  type SenderSignature,
} from "@/lib/email/wishonia-signature";
import { ROUTES } from "@/lib/routes";
import { getBaseUrl } from "@/lib/url";

export const COMMENT_NOTIFICATION_PLACEHOLDER = "{{UNSUBSCRIBE_URL}}";

export interface CommentNotificationTaskInput {
  description?: string | null;
  id: string;
  title: string;
}

export interface CommentNotificationCommentInput {
  authorName: string | null;
  message: string;
}

export interface CommentNotificationCta {
  label: string;
  url: string;
}

export interface CommentNotificationInput {
  /// Kept for backward compatibility; not rendered. The breadcrumb was noise
  /// for recipients — the task title alone is enough context.
  ancestors?: Array<{ title: string }>;
  baseUrl?: string;
  comment: CommentNotificationCommentInput;
  /// Override the CTA. Default points to the in-app task page with label
  /// "Open the task". Pass null to suppress the CTA entirely.
  cta?: CommentNotificationCta | null;
  /// When set, render a sender sign-off block (name / role / org) at the
  /// bottom of the body. Used by share emails so the recipient sees their
  /// friend's name signing off, not Wishonia. The Resend layer skips the
  /// Wishonia auto-append when `from` is also set on the message.
  senderSignature?: SenderSignature | null;
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

function absoluteTaskUrl(taskId: string, baseUrl: string) {
  return new URL(`${ROUTES.tasks}/${taskId}`, baseUrl).toString();
}

function buildHtml(input: {
  commentMessage: string;
  cta: CommentNotificationCta | null;
  senderSignature: SenderSignature | null;
  title: string;
  unsubscribePlaceholder: string;
}) {
  const titleEsc = escapeHtml(input.title);
  const messageEsc = escapeHtml(input.commentMessage);
  const ctaHtml = input.cta
    ? `<a href="${escapeHtml(input.cta.url)}" style="display:inline-block;background:#111827;color:#ffffff;padding:14px 24px;text-decoration:none;font-weight:900;border:2px solid #111827;text-transform:uppercase;letter-spacing:.06em;font-size:14px;">${escapeHtml(input.cta.label)}</a>`
    : "";
  const signatureHtml = input.senderSignature
    ? buildSenderSignatureHtml(input.senderSignature)
    : "";

  return `<!doctype html>
<html lang="en">
<body style="margin:0;padding:0;background:#ffffff;font-family:Arial,sans-serif;color:#111827;">
  <div style="padding:32px 16px;">
    <div style="max-width:560px;margin:0 auto;">
      <h1 style="margin:0 0 20px;font-size:22px;line-height:1.3;font-weight:900;">${titleEsc}</h1>
      <div style="margin:0 0 24px;font-size:16px;line-height:1.6;white-space:pre-wrap;">${messageEsc}</div>
      ${ctaHtml}
      ${signatureHtml}
      <p style="margin:32px 0 0;font-size:12px;line-height:1.6;color:#71717a;">
        <a href="${input.unsubscribePlaceholder}" style="color:#71717a;">Unsubscribe</a>
      </p>
    </div>
  </div>
</body>
</html>`;
}

function buildText(input: {
  commentMessage: string;
  cta: CommentNotificationCta | null;
  senderSignature: SenderSignature | null;
  title: string;
  unsubscribePlaceholder: string;
}) {
  return [
    input.title,
    "",
    input.commentMessage,
    "",
    input.cta ? `${input.cta.label}: ${input.cta.url}` : null,
    input.cta ? "" : null,
    input.senderSignature ? buildSenderSignatureText(input.senderSignature) : null,
    input.senderSignature ? "" : null,
    `Unsubscribe: ${input.unsubscribePlaceholder}`,
  ]
    .filter((line): line is string => line !== null)
    .join("\n");
}

export function buildTaskCommentNotificationEmail(
  input: CommentNotificationInput,
): CommentNotificationEmail {
  const baseUrl = input.baseUrl ?? getBaseUrl();
  const cta =
    input.cta === null
      ? null
      : (input.cta ?? { label: "Open the task", url: absoluteTaskUrl(input.task.id, baseUrl) });
  const params = {
    commentMessage: input.comment.message,
    cta,
    senderSignature: input.senderSignature ?? null,
    title: input.task.title,
    unsubscribePlaceholder: COMMENT_NOTIFICATION_PLACEHOLDER,
  };

  return {
    html: buildHtml(params),
    subject: input.task.title,
    text: buildText(params),
  };
}
