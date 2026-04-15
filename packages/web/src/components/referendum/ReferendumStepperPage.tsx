"use client";

import { notFound } from "next/navigation";
import { ReferendumSignatureBox } from "@/components/referendum/ReferendumSignatureBox";
import { ReferendumStepper } from "@/components/referendum/ReferendumStepper";
import { getReferendumConfig } from "@/config/referendums";

interface ReferendumStepperPageProps {
  slug: string;
  referralCode?: string | null;
}

export function ReferendumStepperPage({
  slug,
  referralCode = null,
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
      signatureSlot={(variant) => (
        <ReferendumSignatureBox
          referendumSlug={config.slug}
          title={config.title}
          authPromptText={config.authPromptText}
          authCallbackUrl={config.authCallbackUrl}
          referralCode={referralCode}
          storePendingVote={(name) =>
            config.storePendingVote(name, referralCode)
          }
          clearPendingVote={() => config.clearPendingVote()}
          shareText={config.shareText}
          emailSubject={config.emailSubject}
          signedTitle={config.signedTitle}
          signedBody={config.signedBody}
          variant={variant}
        />
      )}
    />
  );
}
