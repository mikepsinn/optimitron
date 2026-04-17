"use client";

import { notFound } from "next/navigation";
import { ReferendumStepper } from "@/components/referendum/ReferendumStepper";
import { TreatyVoteFlow } from "@/components/landing/TreatyVoteFlow";
import { getReferendumConfig } from "@/config/referendums";

interface ReferendumStepperPageProps {
  slug: string;
  referralCode?: string | null;
  authCallbackUrl?: string;
  postSignRedirectUrl?: string;
}

export function ReferendumStepperPage({
  slug,
  referralCode: _referralCode = null,
  authCallbackUrl: _authCallbackUrl,
  postSignRedirectUrl: _postSignRedirectUrl,
}: ReferendumStepperPageProps) {
  const config = getReferendumConfig(slug);
  if (!config) return notFound();

  return (
    <ReferendumStepper
      introText={config.introText}
      slides={config.slides}
      backgroundImages={config.backgroundImages}
      audioManifestPath={config.audioManifestPath}
      audioBasePath={config.audioBasePath}
      signatureSlot={() => <TreatyVoteFlow />}
    />
  );
}
