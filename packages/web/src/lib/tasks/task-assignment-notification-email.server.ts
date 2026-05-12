import {
  getTaskCompletionUrl,
  getTaskEmailReplyInstruction,
  getTaskUrl,
} from "@/lib/email/task-notification";
import { buildCoordinationFeedbackNote } from "@/lib/email/coordination-feedback-note";
import {
  buildShareFooterHtml,
  buildShareFooterText,
} from "@/lib/email/share-footer";

export interface TaskAssignmentEmailInput {
  description: string;
  id: string;
  recipientName: string;
  replyInstruction?: string | null;
  title: string;
  /**
   * When the assignee is one of our users (not an external office),
   * pass their personal referral URL so the share kit appears at the
   * bottom of the email. Omit for external assignees — including the
   * share kit on outreach emails to leaders' offices is off-brand.
   */
  recipientReferralUrl?: string | null;
}

export interface TaskAssignmentEmail {
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

function paragraphsFromText(text: string) {
  return text
    .trim()
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

function renderDescriptionHtml(description: string) {
  return paragraphsFromText(description)
    .map(
      (paragraph) =>
        `<p style="margin:0 0 16px;font-size:16px;line-height:1.55;white-space:pre-wrap;">${escapeHtml(paragraph)}</p>`,
    )
    .join("");
}

function buildCtaHtml(input: { label: string; url: string; variant: "primary" | "secondary" }) {
  const style =
    input.variant === "primary"
      ? "display:inline-block;background:#111827;color:#ffffff;padding:14px 24px;text-decoration:none;font-weight:900;border:2px solid #111827;text-transform:uppercase;letter-spacing:.06em;font-size:14px;margin:0 8px 8px 0;"
      : "display:inline-block;background:#ffffff;color:#111827;padding:14px 24px;text-decoration:none;font-weight:900;border:2px solid #111827;text-transform:uppercase;letter-spacing:.06em;font-size:14px;margin:0 0 8px 0;";

  return `<a href="${escapeHtml(input.url)}" style="${style}">${escapeHtml(input.label)}</a>`;
}

export function buildTaskAssignmentNotificationEmail(
  input: TaskAssignmentEmailInput,
): TaskAssignmentEmail {
  const taskUrl = getTaskUrl(input.id);
  const completionUrl = getTaskCompletionUrl(input.id);
  const replyInstruction =
    input.replyInstruction === undefined
      ? getTaskEmailReplyInstruction()
      : input.replyInstruction;
  const feedbackNote = buildCoordinationFeedbackNote({
    replyEnabled: Boolean(replyInstruction),
  });
  const subject = `New task: ${input.title}`;
  const shareFooterText = input.recipientReferralUrl
    ? buildShareFooterText(input.recipientReferralUrl)
    : "";
  const shareFooterHtml = input.recipientReferralUrl
    ? buildShareFooterHtml(input.recipientReferralUrl)
    : "";
  const text = [
    `New task for ${input.recipientName}`,
    "",
    input.title,
    "",
    input.description.trim(),
    "",
    `Open task: ${taskUrl}`,
    `Mark complete: ${completionUrl}`,
    "",
    feedbackNote.text,
    replyInstruction ? "" : null,
    replyInstruction,
    shareFooterText || null,
  ]
    .filter((line): line is string => line !== null)
    .join("\n");

  const html = `<!doctype html>
<html lang="en">
<body style="margin:0;padding:0;background:#ffffff;font-family:Arial,sans-serif;color:#111827;">
  <div style="padding:32px 16px;">
    <div style="max-width:600px;margin:0 auto;">
      <p style="margin:0 0 12px;font-size:12px;line-height:1.4;font-weight:900;letter-spacing:.12em;text-transform:uppercase;color:#3f3f46;">New task for ${escapeHtml(input.recipientName)}</p>
      <h1 style="margin:0 0 24px;font-size:28px;line-height:1.15;font-weight:900;">${escapeHtml(input.title)}</h1>
      <div style="border-top:2px solid #111827;border-bottom:2px solid #111827;padding:24px 0;margin:0 0 24px;">
        ${renderDescriptionHtml(input.description)}
      </div>
      ${buildCtaHtml({ label: "Open task", url: taskUrl, variant: "primary" })}
      ${buildCtaHtml({ label: "Mark complete", url: completionUrl, variant: "secondary" })}
      ${feedbackNote.html}
      ${
        replyInstruction
          ? `<p style="margin:18px 0 0;font-size:13px;line-height:1.6;color:#3f3f46;">${escapeHtml(replyInstruction)}</p>`
          : ""
      }
      ${shareFooterHtml}
    </div>
  </div>
</body>
</html>`;

  return { html, subject, text };
}
