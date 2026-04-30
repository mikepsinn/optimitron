import type { SendVerificationRequestParams } from "next-auth/providers/email";
import { prisma } from "@/lib/prisma";
import { sendResendEmail } from "@/lib/email/resend";

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
  _host: string,
  theme: SendVerificationRequestParams["theme"],
) {
  const escapedUrl = escapeHtml(url);
  const brandColor = theme.brandColor || "#111827";
  const buttonText = theme.buttonText || "#ffffff";

  return `
    <div style="padding:32px 16px;font-family:Arial,sans-serif;color:#111827;">
      <p style="margin:0 0 20px;font-size:16px;line-height:1.6;">
        Yeahhh, here's your sign-in link. Mmkay.
      </p>
      <a
        href="${escapedUrl}"
        style="display:inline-block;background:${brandColor};color:${buttonText};padding:14px 24px;text-decoration:none;font-weight:700;border:2px solid #111827;"
      >
        Sign in
      </a>
      <p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:#71717a;">
        Didn't ask for this? Just go ahead and ignore it. That'd be great.
      </p>
    </div>
  `;
}

function buildMagicLinkText(url: string, _host: string) {
  return [
    "Yeahhh, here's your sign-in link. Mmkay.",
    "",
    `Sign in: ${url}`,
    "",
    "Didn't ask for this? Just go ahead and ignore it. That'd be great.",
  ].join("\n");
}

export async function sendMagicLinkEmail({
  identifier,
  url,
  theme,
}: SendVerificationRequestParams) {
  const host = new URL(url).host;

  // Magic-link is transactional and bypasses suppression, but the shared send
  // helper still expects a stable account identifier when one exists.
  // First-time signups (email not yet in User) use the email as a placeholder.
  const existing = await prisma.user.findUnique({
    where: { email: identifier },
    select: { id: true },
  });

  const result = await sendResendEmail({
    to: identifier,
    userId: existing?.id ?? identifier,
    scope: "magic_link",
    subject: `Sign in to ${host}`,
    html: buildMagicLinkHtml(url, host, theme),
    text: buildMagicLinkText(url, host),
    skipSuppressionCheck: true,
  });

  if (result.status !== "sent") {
    throw new Error("Resend is not configured for magic-link email.");
  }
}
