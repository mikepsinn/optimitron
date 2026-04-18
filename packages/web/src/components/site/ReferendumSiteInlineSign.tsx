"use client";

import { getReferendumConfig } from "@/config/referendums";
import { ReferendumSignatureBox } from "@/components/referendum/ReferendumSignatureBox";

export function ReferendumSiteInlineSign({
  referendumSlug,
  postSignRedirectUrl,
  title,
  showPrivacyToggle = false,
  showReaderShell = false,
}: {
  referendumSlug: string | null;
  postSignRedirectUrl?: string;
  title?: string;
  showPrivacyToggle?: boolean;
  showReaderShell?: boolean;
}) {
  if (!referendumSlug) {
    return null;
  }

  const config = getReferendumConfig(referendumSlug);
  if (!config) {
    return null;
  }

  return (
    <ReferendumSignatureBox
      referendumSlug={config.slug}
      title={title ?? config.title}
      authPromptText={config.authPromptText}
      authCallbackUrl={postSignRedirectUrl ?? config.authCallbackUrl}
      postSignRedirectUrl={postSignRedirectUrl}
      storePendingVote={(name) => config.storePendingVote(name, null)}
      clearPendingVote={() => config.clearPendingVote()}
      shareText={config.shareText}
      emailSubject={config.emailSubject}
      signedTitle={config.signedTitle}
      signedBody={config.signedBody}
      variant="reader"
      showReaderShell={showReaderShell}
      showPrivacyToggle={showPrivacyToggle}
    />
  );
}
