import type { SendVerificationRequestParams } from "next-auth/providers/email";
import { sendResendEmail } from "@/lib/resend";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function buildMagicLinkHtml(
  url: string,
  host: string,
  theme: SendVerificationRequestParams["theme"],
) {
  const escapedUrl = escapeHtml(url);
  const escapedHost = escapeHtml(host);
  const brandColor = theme.brandColor || "#111827";
  const buttonText = theme.buttonText || "#ffffff";

  return `
    <div style="background:#f4f4f5;padding:32px 16px;font-family:Arial,sans-serif;color:#111827;">
      <div style="max-width:560px;margin:0 auto;background:#ffffff;border:3px solid #111827;padding:32px;">
        <p style="margin:0 0 12px;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#71717a;">
          Optimitron Magic Link
        </p>
        <h1 style="margin:0 0 16px;font-size:28px;line-height:1.2;">
          Sign in to ${escapedHost}
        </h1>
        <p style="margin:0 0 20px;font-size:16px;line-height:1.6;">
          Use the secure link below to sign in or finish creating your account.
        </p>
        <a
          href="${escapedUrl}"
          style="display:inline-block;background:${brandColor};color:${buttonText};padding:14px 24px;text-decoration:none;font-weight:700;border:2px solid #111827;"
        >
          Sign in to Optimitron
        </a>
        <p style="margin:20px 0 8px;font-size:14px;line-height:1.6;color:#3f3f46;">
          If the button does not work, paste this URL into your browser:
        </p>
        <p style="margin:0;font-size:14px;line-height:1.6;word-break:break-all;">
          ${escapedUrl}
        </p>
        <p style="margin:20px 0 0;font-size:13px;line-height:1.6;color:#71717a;">
          If you did not request this email, you can ignore it.
        </p>
      </div>
    </div>
  `;
}

function buildMagicLinkText(url: string, host: string) {
  return [
    `Sign in to ${host}`,
    "",
    "Use this secure link to sign in or finish creating your account:",
    url,
    "",
    "If you did not request this email, you can ignore it.",
  ].join("\n");
}

export async function sendMagicLinkEmail({
  identifier,
  url,
  theme,
}: SendVerificationRequestParams) {
  const host = new URL(url).host;

  const result = await sendResendEmail({
    to: identifier,
    subject: `Sign in to ${host}`,
    html: buildMagicLinkHtml(url, host, theme),
    text: buildMagicLinkText(url, host),
  });

  if (result.status !== "sent") {
    throw new Error("Resend is not configured for magic-link email.");
  }
}
