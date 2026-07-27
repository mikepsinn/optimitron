import { getSignInPath, getTaskPath } from "@/lib/routes";
import { getBaseUrl } from "@/lib/url";

export interface PrivateReviewInvitationEmail {
  html: string;
  subject: string;
  text: string;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function getPrivateReviewSignInUrl(
  taskId: string,
  baseUrl: string = getBaseUrl(),
) {
  return new URL(getSignInPath(getTaskPath(taskId)), baseUrl).toString();
}

/**
 * Confidential-safe by construction: callers cannot pass document titles,
 * bodies, review instructions, or filenames into this renderer.
 */
export function buildPrivateReviewInvitationEmail(input: {
  kind: "INVITATION" | "REMINDER";
  recipientName: string;
  signInUrl: string;
}): PrivateReviewInvitationEmail {
  const greeting = `Hi ${input.recipientName},`;
  const invitation =
    "You have been invited to independently review a private document. Your review will help the people responsible decide whether it is ready to use.";
  const reminder =
    "This is a reminder about your invitation to independently review a private document.";
  const lead = input.kind === "REMINDER" ? reminder : invitation;
  const instruction =
    "Sign in with this email address to see the exact revision, instructions, and deadline.";
  const privacy =
    "The document is not included in this email. Reply if you have a conflict, cannot take the review, or need clarification.";
  const subject =
    input.kind === "REMINDER"
      ? "Reminder: private document review"
      : "Private document review invitation";
  const text = [
    greeting,
    "",
    lead,
    "",
    instruction,
    input.signInUrl,
    "",
    privacy,
  ].join("\n");
  const html = [
    '<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;color:#111827;">',
    `<p>${escapeHtml(greeting)}</p>`,
    `<p>${escapeHtml(lead)}</p>`,
    `<p>${escapeHtml(instruction)}</p>`,
    `<p><a href="${escapeHtml(input.signInUrl)}" style="color:#111827;font-weight:700;">Sign in to see the review assignment</a></p>`,
    `<p>${escapeHtml(privacy)}</p>`,
    "</div>",
  ].join("");

  return { html, subject, text };
}
