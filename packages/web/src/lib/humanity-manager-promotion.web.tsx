"use client";

/**
 * Web adapter for the shared Humanity Manager promotion.
 *
 * The content lives in `humanity-manager-promotion-content.tsx`; this file
 * stays client-safe because the dashboard imports it from a client component.
 */

import * as React from "react";
import { ParameterValue } from "@/components/shared/ParameterValue";
import { createHumanityManagerPromotion } from "@/lib/humanity-manager-promotion-content";

function PromoEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">
      {children}
    </p>
  );
}

function PromoText({
  children,
  muted = false,
}: {
  children: React.ReactNode;
  muted?: boolean;
}) {
  return (
    <p className={muted ? "text-muted-foreground" : undefined}>{children}</p>
  );
}

function PromoBody({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-4 space-y-3 text-sm font-bold leading-7 text-[var(--treaty-ink)] sm:text-base">
      {children}
    </div>
  );
}

export const HumanityManagerPromotion = createHumanityManagerPromotion({
  ParameterValue,
  PromoBody,
  PromoEyebrow,
  PromoText,
});
