"use client";

/**
 * Web adapter for the shared Humanity Manager promotion.
 *
 * The content lives in `humanity-manager-promotion-content.tsx`; this file
 * stays client-safe because the dashboard imports it from a client component.
 */

import Link from "next/link";
import * as React from "react";
import { ParameterValue } from "@/components/shared/ParameterValue";
import { createHumanityManagerPromotion } from "@/lib/humanity-manager-promotion-content";

function PromoLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="underline decoration-dotted underline-offset-2 hover:no-underline"
    >
      {children}
    </Link>
  );
}

function PromoEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">
      {children}
    </p>
  );
}

function PromoHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mt-2 text-2xl font-black uppercase leading-tight tracking-tight sm:text-3xl">
      {children}
    </h2>
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
  PromoHeading,
  PromoLink,
  PromoText,
});
