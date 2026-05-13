import React from "react";
import type { SenderSignature } from "@/lib/email/wishonia-signature";
import { formatDefaultSystemEmailFromHeader } from "@/lib/email/from-address";
import { EMAIL_UNSUBSCRIBE_URL_PLACEHOLDER } from "@/lib/email/placeholders";
import {
  SAMPLE_REFERRAL_URL,
  SAMPLE_TASK_ID,
  SAMPLE_TASK_REPLY_ADDRESS,
  type EmailPreview,
} from "@/lib/email/preview-envelope";
import { renderReactEmailBody } from "@/lib/email/render-react-email";
import { ROUTES } from "@/lib/routes";
import { TaskCommentNotificationReactEmail } from "@/lib/tasks/task-comment-notification-react-email";
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
  /**
   * When the recipient is one of our users (has a referral URL), pass it
   * here so the canonical share footer appears at the bottom. Omit for
   * external/leader recipients — we don't pitch the share kit to people
   * who haven't opted into the campaign.
   */
  recipientReferralUrl?: string | null;
}

export interface CommentNotificationEmail {
  html: string;
  subject: string;
  text: string;
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

export async function buildTaskCommentNotificationEmail(
  input: CommentNotificationInput,
): Promise<CommentNotificationEmail> {
  const baseUrl = input.baseUrl ?? getBaseUrl();
  const cta =
    input.cta === null
      ? null
      : (input.cta ?? {
          label: "Open the task",
          url: absoluteTaskUrl(input.task.id, baseUrl),
        });
  const authorName = input.comment.authorName?.trim() || "Someone";
  const body = await renderReactEmailBody(
    React.createElement(TaskCommentNotificationReactEmail, {
      authorAvatarUrl: absoluteUrl(input.comment.authorAvatarUrl, baseUrl),
      authorName,
      commentMessage: input.comment.message,
      cta,
      recipientReason: input.recipientReason ?? null,
      recipientReferralUrl: input.recipientReferralUrl ?? null,
      replyInstruction: input.replyInstruction ?? null,
      secondaryCta: input.secondaryCta ?? null,
      senderSignature: input.senderSignature ?? null,
      title: input.task.title,
      unsubscribeUrl: COMMENT_NOTIFICATION_PLACEHOLDER,
    }),
  );

  return {
    ...body,
    subject: input.task.title,
  };
}

export const TASK_COMMENT_NOTIFICATION_TEMPLATE_ID =
  "task-comment-notification";

const SAMPLE_COMMENT_INPUT = {
  task: { id: SAMPLE_TASK_ID, title: "Sign the 1% Treaty" },
  comment: {
    authorAvatarUrl: null,
    authorName: "Sample Author",
    message:
      "I just signed and forwarded the share message to four of my family members. Two of them have already voted.",
  },
  recipientReason: "You are assigned to this task.",
  replyInstruction: "Reply to this email to leave a comment on the task.",
  recipientReferralUrl: SAMPLE_REFERRAL_URL,
} as const;

export const TASK_COMMENT_NOTIFICATION_PREVIEW: EmailPreview = {
  templateId: TASK_COMMENT_NOTIFICATION_TEMPLATE_ID,
  displayName: "Someone replied on a task you're following",
  trigger:
    "Fires when someone posts a comment on a task that the recipient is assigned to, watching, or has previously commented on. Subject = task title only (no '{author}: ' prefix — sender identity is in the From header). Reply-To routes the recipient's reply back to the task as a new comment.",
  scope: "task_notifications",
  from: () => formatDefaultSystemEmailFromHeader(),
  subject: () => SAMPLE_COMMENT_INPUT.task.title,
  replyTo: () => SAMPLE_TASK_REPLY_ADDRESS,
  skipWishoniaSignature: false,
  renderReact: () =>
    React.createElement(TaskCommentNotificationReactEmail, {
      authorAvatarUrl: SAMPLE_COMMENT_INPUT.comment.authorAvatarUrl,
      authorName: SAMPLE_COMMENT_INPUT.comment.authorName,
      commentMessage: SAMPLE_COMMENT_INPUT.comment.message,
      cta: {
        label: "Open the task",
        url: `${getBaseUrl()}${ROUTES.tasks}/${SAMPLE_COMMENT_INPUT.task.id}`,
      },
      recipientReason: SAMPLE_COMMENT_INPUT.recipientReason,
      recipientReferralUrl: SAMPLE_COMMENT_INPUT.recipientReferralUrl,
      replyInstruction: SAMPLE_COMMENT_INPUT.replyInstruction,
      secondaryCta: null,
      senderSignature: null,
      title: SAMPLE_COMMENT_INPUT.task.title,
      unsubscribeUrl: EMAIL_UNSUBSCRIBE_URL_PLACEHOLDER,
    }),
};
