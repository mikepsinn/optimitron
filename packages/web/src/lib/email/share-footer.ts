/**
 * Engaged-user email share footer. Rendered at the bottom of every email
 * that goes to an authenticated user who has a referral URL (digests, task
 * notifications, comment notifications, the referral-first-conversion ping).
 *
 * NOT appropriate for transactional pre-signin emails (magic-link, password
 * reset, security alerts) where adding the share message dilutes the primary
 * CTA. Those stay clean.
 *
 * The body of every footer is the same canonical share message
 * (`buildShareMessage`). One source string, four+ surfaces.
 */

import { escapeHtml } from "@/lib/email/magic-link-render";
import { buildShareMessage } from "@/lib/share-message";

const FOOTER_EYEBROW = "Recruit two more humans";
const FOOTER_TAGLINE =
  "32 doubling rounds × 2 referrals each = 4,300,000,000 humans reached.";

export function buildShareFooterHtml(referralUrl: string): string {
  const message = escapeHtml(buildShareMessage(referralUrl));
  const escapedUrl = escapeHtml(referralUrl);
  return `
    <div style="margin-top:48px;padding-top:24px;border-top:2px solid #111827;font-family:Arial,sans-serif;color:#111827;">
      <p style="margin:0 0 12px;font-size:12px;line-height:1.6;color:#71717a;text-transform:uppercase;letter-spacing:0.14em;font-weight:700;">
        ${FOOTER_EYEBROW}
      </p>
      <p style="margin:0 0 12px;font-size:14px;line-height:1.7;font-weight:700;">
        ${message}
      </p>
      <p style="margin:0;font-size:12px;line-height:1.6;color:#71717a;">
        Copy the line above into iMessage, WhatsApp, Signal, email — wherever
        your people read you. Or send them straight to
        <a href="${escapedUrl}" style="color:#111827;font-weight:700;">${escapedUrl}</a>.
        ${FOOTER_TAGLINE}
      </p>
    </div>
  `;
}

export function buildShareFooterText(referralUrl: string): string {
  return [
    "",
    "—",
    "",
    FOOTER_EYEBROW,
    "",
    buildShareMessage(referralUrl),
    "",
    `Or send straight to: ${referralUrl}`,
    FOOTER_TAGLINE,
  ].join("\n");
}
