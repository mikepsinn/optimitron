import { getAppBaseUrl } from "@/lib/email/task-notification";
import { ROUTES } from "@/lib/routes";

export interface CoordinationFeedbackNote {
  html: string;
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

export function getFeedbackUrl(pathname = ROUTES.feedback) {
  return `${getAppBaseUrl()}${pathname}`;
}

export function buildCoordinationFeedbackNote(input?: {
  replyEnabled?: boolean;
}): CoordinationFeedbackNote {
  const feedbackUrl = getFeedbackUrl();
  const action = input?.replyEnabled
    ? `Reply to this email with criticism, suggestions, or anything that would make this less annoying. You can also use ${feedbackUrl}.`
    : `Send criticism, suggestions, or anything that would make this less annoying: ${feedbackUrl}`;
  const text = [
    "We are building a decentralized to-do list for humanity: coordinate the work required to end war and disease in the least irritating way possible.",
    action,
    "If this is irritating, tell us and we will stop bothering you.",
  ].join(" ");
  const html = [
    `<p style="margin:18px 0 0;font-size:13px;line-height:1.6;color:#3f3f46;">`,
    escapeHtml(
      "We are building a decentralized to-do list for humanity: coordinate the work required to end war and disease in the least irritating way possible.",
    ),
    " ",
    input?.replyEnabled
      ? `${escapeHtml(
          "Reply to this email with criticism, suggestions, or anything that would make this less annoying. You can also use",
        )} <a href="${escapeHtml(
          feedbackUrl,
        )}" style="color:#111827;text-decoration:underline;">${escapeHtml(
          feedbackUrl,
        )}</a>.`
      : `${escapeHtml(
          "Send criticism, suggestions, or anything that would make this less annoying:",
        )} <a href="${escapeHtml(
          feedbackUrl,
        )}" style="color:#111827;text-decoration:underline;">${escapeHtml(
          feedbackUrl,
        )}</a>.`,
    " ",
    escapeHtml("If this is irritating, tell us and we will stop bothering you."),
    `</p>`,
  ].join("");

  return { html, text };
}
