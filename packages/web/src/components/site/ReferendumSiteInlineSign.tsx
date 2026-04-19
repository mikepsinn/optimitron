"use client";

import { PostVoteReminders } from "@/components/landing/PostVoteReminders";
import { getReferendumConfig } from "@/config/referendums";
import { ReferendumSignatureBox } from "@/components/referendum/ReferendumSignatureBox";
import { ParameterValue } from "@/components/shared/ParameterValue";
import {
  VOTER_LIVES_SAVED,
  VOTER_SUFFERING_HOURS_PREVENTED,
} from "@optimitron/data/parameters";
import { TREATY_REFERENDUM_SLUG } from "@/lib/treaty";

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

  const signedBody =
    config.slug === TREATY_REFERENDUM_SLUG ? (
      <>
        For each person you get to sign with your link, you will be personally
        {" "}to blame for saving{" "}
        <ParameterValue param={VOTER_LIVES_SAVED} figures={2} />
        {" "}lives and preventing{" "}
        <ParameterValue
          param={VOTER_SUFFERING_HOURS_PREVENTED}
          figures={2}
        />
        {" "}hours of suffering.
      </>
    ) : (
      config.signedBody
    );
  const signedShare =
    config.slug === TREATY_REFERENDUM_SLUG ? (
      <PostVoteReminders
        defaultCowardMode
        surface="post_sign_treaty_share"
        cardClassName="w-full overflow-hidden border-2 border-[#8e6b48]/35 bg-background p-0 text-foreground shadow-[6px_6px_0_rgba(58,42,25,0.12)]"
      />
    ) : undefined;

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
      signedBody={signedBody}
      signedShare={signedShare}
      variant="reader"
      showReaderShell={showReaderShell}
      showPrivacyToggle={showPrivacyToggle}
    />
  );
}
