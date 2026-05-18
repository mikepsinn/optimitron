import type { SendVerificationRequestParams } from "next-auth/providers/email";
import React from "react";
import { renderReactEmailHtml } from "@/lib/email/render-react-email";
import { getSiteFromHost, type SiteKey } from "@/lib/site";

interface MagicLinkCopy {
  buttonLabel: string;
  intro: string;
  textIntro?: string;
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
  buttonLabel: "Save my vote",
  intro: "Click the button below to verify your email and save your vote.",
  textIntro: "Use the URL below to verify your email and save your vote.",
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
    return "Save your 1% Treaty vote";
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
  _theme: SendVerificationRequestParams["theme"],
) {
  const copy = getMagicLinkCopy(host);
  return renderReactEmailHtml(
    React.createElement(MagicLinkReactEmail, {
      url,
      intro: copy.intro,
      buttonLabel: copy.buttonLabel,
      notRequested: copy.notRequested,
    }),
  );
}

export function buildMagicLinkText(url: string, host: string) {
  const copy = getMagicLinkCopy(host);
  return [
    copy.textIntro ?? copy.intro,
    "",
    `${copy.buttonLabel}: ${url}`,
    "",
    copy.notRequested,
  ].join("\n");
}

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
  skipWishoniaSignature: true,
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
