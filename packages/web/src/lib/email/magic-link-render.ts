import type { SendVerificationRequestParams } from "next-auth/providers/email";
import { getSiteFromHost, type SiteKey } from "@/lib/site";

interface MagicLinkCopy {
  buttonLabel: string;
  intro: string;
  notRequested: string;
}

const lumberghCopy: MagicLinkCopy = {
  buttonLabel: "Sign in",
  intro: "Yeahhh, here's your sign-in link. Mmkay.",
  notRequested: "Didn't ask for this? Just go ahead and ignore it. That'd be great.",
};

const magicLinkCopyBySite: Record<SiteKey, MagicLinkCopy> = {
  optimitron: lumberghCopy,
  warOnDisease: lumberghCopy,
  onePercentTreaty: lumberghCopy,
  trialAbundanceSurvey: {
    buttonLabel: "Sign in",
    intro: "Sign in to Trial Abundance Survey.",
    notRequested: "If you didn't request this, you can ignore it.",
  },
  dfda: {
    buttonLabel: "Sign in",
    intro: "Sign in to dFDA.",
    notRequested: "If you didn't request this, you can ignore it.",
  },
  dih: {
    buttonLabel: "Sign in",
    intro: "Sign in to the Decentralized Institutes of Health.",
    notRequested: "If you didn't request this, you can ignore it.",
  },
};

function getMagicLinkCopy(host: string): MagicLinkCopy {
  return magicLinkCopyBySite[getSiteFromHost(host).key];
}

export function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function buildMagicLinkHtml(
  url: string,
  host: string,
  theme: SendVerificationRequestParams["theme"],
) {
  const copy = getMagicLinkCopy(host);
  const escapedUrl = escapeHtml(url);
  const brandColor = theme.brandColor || "#111827";
  const buttonText = theme.buttonText || "#ffffff";

  return `
    <div style="padding:32px 16px;font-family:Arial,sans-serif;color:#111827;">
      <p style="margin:0 0 20px;font-size:16px;line-height:1.6;">
        ${escapeHtml(copy.intro)}
      </p>
      <a
        href="${escapedUrl}"
        style="display:inline-block;background:${brandColor};color:${buttonText};padding:14px 24px;text-decoration:none;font-weight:700;border:2px solid #111827;"
      >
        ${escapeHtml(copy.buttonLabel)}
      </a>
      <p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:#71717a;">
        ${escapeHtml(copy.notRequested)}
      </p>
    </div>
  `;
}

export function buildMagicLinkText(url: string, host: string) {
  const copy = getMagicLinkCopy(host);
  return [
    copy.intro,
    "",
    `${copy.buttonLabel}: ${url}`,
    "",
    copy.notRequested,
  ].join("\n");
}
