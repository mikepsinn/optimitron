import {
  buildSenderSignatureHtml,
  buildSenderSignatureText,
  type SenderSignature,
} from "@/lib/email/wishonia-signature";
import { EMAIL_UNSUBSCRIBE_URL_PLACEHOLDER } from "@/lib/email/placeholders";
import { ROUTES } from "@/lib/routes";
import { getBaseUrl } from "@/lib/url";

export const COMMENT_NOTIFICATION_PLACEHOLDER =
  EMAIL_UNSUBSCRIBE_URL_PLACEHOLDER;

export interface CommentNotificationTaskInput {
  description?: string | null;
  id: string;
  title: string;
}

export interface CommentNotificationCommentInput {
  authorAvatarUrl?: string | null;
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
  secondaryCta?: CommentNotificationCta | null;
  /// When set, render a sender sign-off block (name / role / org) at the
  /// bottom of the body. Used by share emails so the recipient sees their
  /// friend's name signing off, not Wishonia. The Resend layer skips the
  /// Wishonia auto-append when `from` is also set on the message.
  senderSignature?: SenderSignature | null;
  recipientReason?: string | null;
  replyInstruction?: string | null;
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

function absoluteUrl(url: string | null | undefined, baseUrl: string) {
  const value = url?.trim();
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith("//")) return `https:${value}`;
  const path = value.startsWith("/") ? value : `/${value}`;
  return `${baseUrl.replace(/\/+$/, "")}${path}`;
}

function authorInitial(authorName: string) {
  return (authorName.trim()[0] ?? "?").toUpperCase();
}

function buildCtaHtml(input: {
  cta: CommentNotificationCta;
  variant: "primary" | "secondary";
}) {
  const styles =
    input.variant === "primary"
      ? "display:inline-block;background:#111827;color:#ffffff;padding:14px 24px;text-decoration:none;font-weight:900;border:2px solid #111827;text-transform:uppercase;letter-spacing:.06em;font-size:14px;margin:0 8px 8px 0;"
      : "display:inline-block;background:#ffffff;color:#111827;padding:14px 24px;text-decoration:none;font-weight:900;border:2px solid #111827;text-transform:uppercase;letter-spacing:.06em;font-size:14px;margin:0 0 8px 0;";
  return `<a href="${escapeHtml(input.cta.url)}" style="${styles}">${escapeHtml(input.cta.label)}</a>`;
}

function buildHtml(input: {
  authorAvatarUrl: string;
  authorName: string;
  commentMessage: string;
  cta: CommentNotificationCta | null;
  secondaryCta: CommentNotificationCta | null;
  senderSignature: SenderSignature | null;
  recipientReason: string | null;
  replyInstruction: string | null;
  title: string;
  unsubscribePlaceholder: string;
}) {
  const titleEsc = escapeHtml(input.title);
  const messageEsc = escapeHtml(input.commentMessage);
  const authorEsc = escapeHtml(input.authorName);
  const avatarHtml = input.authorAvatarUrl
    ? `<img src="${escapeHtml(input.authorAvatarUrl)}" alt="${authorEsc}" width="44" height="44" style="display:block;width:44px;height:44px;border:2px solid #111827;background:#ffffff;object-fit:cover;" />`
    : `<div style="width:44px;height:44px;border:2px solid #111827;background:#ffffff;color:#111827;font-size:18px;line-height:44px;text-align:center;font-weight:900;">${escapeHtml(authorInitial(input.authorName))}</div>`;
  const ctaHtml = [
    input.cta ? buildCtaHtml({ cta: input.cta, variant: "primary" }) : "",
    input.secondaryCta
      ? buildCtaHtml({ cta: input.secondaryCta, variant: "secondary" })
      : "",
  ].join("");
  const signatureHtml = input.senderSignature
    ? buildSenderSignatureHtml(input.senderSignature)
    : "";
  const reasonHtml = input.recipientReason
    ? `<p style="margin:24px 0 0;font-size:12px;line-height:1.6;color:#71717a;">${escapeHtml(input.recipientReason)}</p>`
    : "";
  const replyInstructionHtml = input.replyInstruction
    ? `<p style="margin:18px 0 0;font-size:13px;line-height:1.6;color:#3f3f46;">${escapeHtml(input.replyInstruction)}</p>`
    : "";

  return `<!doctype html>
<html lang="en">
<body style="margin:0;padding:0;background:#ffffff;font-family:Arial,sans-serif;color:#111827;">
  <div style="padding:32px 16px;">
    <div style="max-width:560px;margin:0 auto;">
      <h1 style="margin:0 0 20px;font-size:22px;line-height:1.3;font-weight:900;">${titleEsc}</h1>
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 24px;border-collapse:collapse;width:100%;font-family:Arial,sans-serif;">
        <tr>
          <td valign="top" style="width:52px;padding:0 12px 0 0;">${avatarHtml}</td>
          <td valign="top" style="border-left:3px solid #111827;padding:0 0 0 14px;">
            <div style="margin:0 0 8px;font-size:13px;line-height:1.4;font-weight:900;color:#111827;text-transform:uppercase;">${authorEsc} commented</div>
            <div style="margin:0;font-size:16px;line-height:1.6;white-space:pre-wrap;color:#111827;">${messageEsc}</div>
          </td>
        </tr>
      </table>
      ${ctaHtml}
      ${replyInstructionHtml}
      ${reasonHtml}
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
  authorName: string;
  commentMessage: string;
  cta: CommentNotificationCta | null;
  secondaryCta: CommentNotificationCta | null;
  senderSignature: SenderSignature | null;
  recipientReason: string | null;
  replyInstruction: string | null;
  title: string;
  unsubscribePlaceholder: string;
}) {
  return [
    input.title,
    "",
    `${input.authorName} commented:`,
    "",
    input.commentMessage,
    "",
    input.cta ? `${input.cta.label}: ${input.cta.url}` : null,
    input.cta ? "" : null,
    input.secondaryCta
      ? `${input.secondaryCta.label}: ${input.secondaryCta.url}`
      : null,
    input.secondaryCta ? "" : null,
    input.replyInstruction,
    input.replyInstruction ? "" : null,
    input.recipientReason,
    input.recipientReason ? "" : null,
    input.senderSignature
      ? buildSenderSignatureText(input.senderSignature)
      : null,
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
      : (input.cta ?? {
          label: "Open the task",
          url: absoluteTaskUrl(input.task.id, baseUrl),
        });
  const authorName = input.comment.authorName?.trim() || "Someone";
  const params = {
    authorAvatarUrl: absoluteUrl(input.comment.authorAvatarUrl, baseUrl),
    authorName,
    commentMessage: input.comment.message,
    cta,
    recipientReason: input.recipientReason ?? null,
    replyInstruction: input.replyInstruction ?? null,
    secondaryCta: input.secondaryCta ?? null,
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
