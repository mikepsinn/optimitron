import type { SendVerificationRequestParams } from "next-auth/providers/email";
import React from "react";
import { renderReactEmailHtml } from "@/lib/email/render-react-email";

interface MagicLinkCopy {
  buttonLabel: string;
  intro: string;
  textIntro?: string;
  notRequested: string;
}

const defaultIntro = "Your sign-in link is below.";
const defaultNotRequested = "Didn't request this? Ignore it.";

const magicLinkCopy: MagicLinkCopy = {
  buttonLabel: "Sign in",
  intro: defaultIntro,
  notRequested: defaultNotRequested,
};

export function getMagicLinkCopy(): MagicLinkCopy {
  return magicLinkCopy;
}

export const MAGIC_LINK_TEMPLATE_ID = "magic-link";

export function buildMagicLinkSubject(host: string) {
  return `Sign in to ${host}`;
}

// Only optimitron.com sends sign-in links from this app.
export function buildMagicLinkFromHeader() {
  return formatSystemEmailFromHeader(
    getSiteConfig("optimitron").emailBranding.fromName,
  );
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
  _theme: SendVerificationRequestParams["theme"],
) {
  const copy = getMagicLinkCopy();
  return renderReactEmailHtml(
    React.createElement(MagicLinkReactEmail, {
      url,
      intro: copy.intro,
      buttonLabel: copy.buttonLabel,
      notRequested: copy.notRequested,
    }),
  );
}

export function buildMagicLinkText(url: string) {
  const copy = getMagicLinkCopy();
  return [
    copy.textIntro ?? copy.intro,
    "",
    `${copy.buttonLabel}: ${url}`,
    "",
    copy.notRequested,
  ].join("\n");
}

import { formatSystemEmailFromHeader } from "@/lib/email/from-address";
import { MagicLinkReactEmail } from "@/lib/email/magic-link-react-email";
import type { EmailPreview } from "@/lib/email/preview-envelope";
import { getSiteConfig } from "@/lib/site";

const SAMPLE_MAGIC_LINK_HOST = "optimitron.local";
const SAMPLE_MAGIC_LINK_URL =
  "https://optimitron.local/api/auth/callback/email?token=SAMPLE";

export const MAGIC_LINK_PREVIEW: EmailPreview = {
  templateId: MAGIC_LINK_TEMPLATE_ID,
  displayName: "Sign-in link (passwordless auth)",
  trigger:
    "Fires when a user submits the sign-in email form. Auth provider (NextAuth) dispatches a single-use callback URL signed with the auth secret; clicking it completes the sign-in flow.",
  scope: "auth",
  from: () => buildMagicLinkFromHeader(),
  subject: () => buildMagicLinkSubject(SAMPLE_MAGIC_LINK_HOST),
  skipWishoniaSignature: true,
  renderReact: () => {
    const copy = getMagicLinkCopy();
    return React.createElement(MagicLinkReactEmail, {
      url: SAMPLE_MAGIC_LINK_URL,
      intro: copy.intro,
      buttonLabel: copy.buttonLabel,
      notRequested: copy.notRequested,
    });
  },
};
