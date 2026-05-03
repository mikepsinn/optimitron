"use client";

import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import {
  ReferendumStepper,
  splitIntoSlides,
} from "@/components/referendum/ReferendumStepper";
import { TreatyVoteFlow } from "@/components/landing/TreatyVoteFlow";
import { ReferendumSiteInlineSign } from "@/components/site/ReferendumSiteInlineSign";
import { getReferendumConfig } from "@/config/referendums";
import { TREATY_REFERENDUM_SLUG } from "@/lib/treaty";

interface ReferendumStepperPageProps {
  slug: string;
  referralCode?: string | null;
  question?: string | null;
  bodyMarkdown?: string | null;
  authCallbackUrl?: string;
  postSignRedirectUrl?: string;
  /**
   * Override the default signature UI. Defaults to `<TreatyVoteFlow />`
   * (slider + YES/NO + auth) for the 1% Treaty. Other referendums (e.g.
   * Court of Humanity) pass a binary "join" component instead.
   */
  signatureSlot?: (mode: "stepper" | "reader") => ReactNode;
}

export function ReferendumStepperPage({
  slug,
  referralCode = null,
  question = null,
  bodyMarkdown = null,
  authCallbackUrl,
  postSignRedirectUrl,
  signatureSlot,
}: ReferendumStepperPageProps) {
  const config = getReferendumConfig(slug);
  if (!config) return notFound();
  const slides = bodyMarkdown ? splitIntoSlides(bodyMarkdown) : config.slides;
  const defaultSignatureSlot = (mode: "stepper" | "reader") =>
    config.slug === TREATY_REFERENDUM_SLUG ? (
      <TreatyVoteFlow authCallbackUrl={authCallbackUrl ?? config.authCallbackUrl} />
    ) : (
      <ReferendumSiteInlineSign
        referendumSlug={config.slug}
        referralCode={referralCode}
        authCallbackUrl={authCallbackUrl}
        postSignRedirectUrl={postSignRedirectUrl}
        showReaderShell={mode === "reader"}
      />
    );

  return (
    <ReferendumStepper
      introText={question ?? config.introText}
      slides={slides}
      backgroundImages={config.backgroundImages}
      audioManifestPath={config.audioManifestPath}
      audioBasePath={config.audioBasePath}
      signatureSlot={signatureSlot ?? defaultSignatureSlot}
    />
  );
}
