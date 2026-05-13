import type { SendVerificationRequestParams } from "next-auth/providers/email";
import React from "react";
import { prisma } from "@/lib/prisma";
import { formatSystemEmailFromHeader } from "@/lib/email/from-address";
import { sendReactEmail } from "@/lib/email/resend";
import {
  buildMagicLinkSubject,
  getMagicLinkCopy,
} from "@/lib/email/magic-link-render";
import { MagicLinkReactEmail } from "@/lib/email/magic-link-react-email";
import { getSiteFromHost } from "@/lib/site";

export async function sendMagicLinkEmail({
  identifier,
  url,
}: SendVerificationRequestParams) {
  const host = new URL(url).host;

  // Magic-link is transactional and bypasses suppression, but the shared send
  // helper still expects a stable account identifier when one exists.
  // First-time signups (email not yet in User) use the email as a placeholder.
  const existing = await prisma.user.findUnique({
    where: { email: identifier },
    select: { id: true },
  });

  const copy = getMagicLinkCopy(host);
  const result = await sendReactEmail({
    from: getMagicLinkFromHeader(host),
    to: identifier,
    userId: existing?.id ?? identifier,
    scope: "magic_link",
    subject: buildMagicLinkSubject(host),
    react: React.createElement(MagicLinkReactEmail, {
      url,
      intro: copy.intro,
      buttonLabel: copy.buttonLabel,
      notRequested: copy.notRequested,
    }),
    skipSuppressionCheck: true,
  });

  if (result.status !== "sent") {
    throw new Error("Resend is not configured for magic-link email.");
  }
}

function getMagicLinkFromHeader(host: string): string | undefined {
  const site = getSiteFromHost(host);
  if (site.key !== "optimitron") {
    return undefined;
  }

  return formatSystemEmailFromHeader(site.emailBranding.fromName);
}
