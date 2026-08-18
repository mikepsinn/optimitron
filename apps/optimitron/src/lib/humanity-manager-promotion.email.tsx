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

function PromoEyebrow({ children }: { children: React.ReactNode }) {
  return <p style={EMAIL_STYLES.eyebrow}>{children}</p>;
}

function PromoText({
  children,
  muted = false,
}: {
  children: React.ReactNode;
  muted?: boolean;
}) {
  return (
    <p
      style={
        muted
          ? EMAIL_STYLES.smallMutedParagraph
          : {
              ...EMAIL_STYLES.paragraph,
              fontSize: "14px",
              lineHeight: "1.55",
              margin: "0 0 12px",
            }
      }
    >
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
  PromoText,
});
