/**
 * Email adapter for the shared Humanity Manager promotion.
 *
 * Keep server-only email/render-surface imports out of the dashboard client
 * bundle; the shared content module injects these email-safe primitives.
 */

import * as React from "react";
import { EMAIL_STYLES } from "@/components/adaptive/email-styles";
import { ParameterValueEmail as ParameterValue } from "@/components/shared/ParameterValue.email";
import { createHumanityManagerPromotion } from "@/lib/humanity-manager-promotion-content";
import { getBaseUrl } from "@/lib/url";

/** Promote a relative path to an absolute URL for email contexts. */
function absoluteEmailUrl(href: string): string {
  if (/^https?:\/\//i.test(href)) return href;
  const base = getBaseUrl().replace(/\/+$/, "");
  return `${base}${href.startsWith("/") ? href : `/${href}`}`;
}

function PromoLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a href={absoluteEmailUrl(href)} style={EMAIL_STYLES.plainLink}>
      {children}
    </a>
  );
}

function PromoEyebrow({ children }: { children: React.ReactNode }) {
  return <p style={EMAIL_STYLES.eyebrow}>{children}</p>;
}

function PromoHeading({ children }: { children: React.ReactNode }) {
  return <p style={EMAIL_STYLES.largeHeadline}>{children}</p>;
}

function PromoText({
  children,
  muted = false,
}: {
  children: React.ReactNode;
  muted?: boolean;
}) {
  return (
    <p style={muted ? EMAIL_STYLES.smallMutedParagraph : EMAIL_STYLES.paragraph}>
      {children}
    </p>
  );
}

function PromoBody({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export const HumanityManagerPromotionEmail = createHumanityManagerPromotion({
  ParameterValue,
  PromoBody,
  PromoEyebrow,
  PromoHeading,
  PromoLink,
  PromoText,
});
