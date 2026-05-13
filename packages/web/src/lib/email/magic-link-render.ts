import type { SendVerificationRequestParams } from "next-auth/providers/email";
import { getSiteFromHost, type SiteKey } from "@/lib/site";

interface MagicLinkCopy {
  buttonLabel: string;
  intro: string;
  notRequested: string;
}

const defaultIntro = "Your sign-in link is below.";
const defaultNotRequested = "Didn't request this? Ignore it.";

const optimitronCopy: MagicLinkCopy = {
  buttonLabel: "Sign in",
  intro: defaultIntro,
  notRequested: defaultNotRequested,
};

const warOnDiseaseCopy: MagicLinkCopy = {
  buttonLabel: "End war and disease",
  intro: defaultIntro,
  notRequested: defaultNotRequested,
};

const magicLinkCopyBySite: Record<SiteKey, MagicLinkCopy> = {
  optimitron: optimitronCopy,
  warOnDisease: warOnDiseaseCopy,
  dfda: {
    buttonLabel: "Sign in",
    intro: defaultIntro,
    notRequested: defaultNotRequested,
  },
  dih: {
    buttonLabel: "Sign in",
    intro: defaultIntro,
    notRequested: defaultNotRequested,
  },
};

export function getMagicLinkCopy(host: string): MagicLinkCopy {
  return magicLinkCopyBySite[getSiteFromHost(host).key];
}

export const MAGIC_LINK_TEMPLATE_ID = "magic-link";

export function buildMagicLinkSubject(host: string) {
  if (getSiteFromHost(host).key === "warOnDisease") {
    return "End war and disease";
  }

  return `Sign in to ${host}`;
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

import React from "react";
import { formatDefaultSystemEmailFromHeader } from "@/lib/email/from-address";
import { MagicLinkReactEmail } from "@/lib/email/magic-link-react-email";
import type { EmailPreview } from "@/lib/email/preview-envelope";

const SAMPLE_MAGIC_LINK_HOST = "warondisease.local";
const SAMPLE_MAGIC_LINK_URL =
  "https://warondisease.local/api/auth/callback/email?token=SAMPLE";

export const MAGIC_LINK_PREVIEW: EmailPreview = {
  templateId: MAGIC_LINK_TEMPLATE_ID,
  displayName: "Sign-in link (passwordless auth)",
  trigger:
    "Fires when a user submits the sign-in email form. Auth provider (NextAuth) dispatches a single-use callback URL signed with the auth secret; clicking it completes the sign-in flow.",
  scope: "auth",
  from: () => formatDefaultSystemEmailFromHeader(),
  subject: () => buildMagicLinkSubject(SAMPLE_MAGIC_LINK_HOST),
  skipWishoniaSignature: false,
  render: () =>
    buildMagicLinkHtml(SAMPLE_MAGIC_LINK_URL, SAMPLE_MAGIC_LINK_HOST, {
      brandColor: "#111827",
      buttonText: "#ffffff",
    }),
  renderReact: () => {
    const copy = getMagicLinkCopy(SAMPLE_MAGIC_LINK_HOST);
    return React.createElement(MagicLinkReactEmail, {
      url: SAMPLE_MAGIC_LINK_URL,
      intro: copy.intro,
      buttonLabel: copy.buttonLabel,
      notRequested: copy.notRequested,
    });
  },
};
