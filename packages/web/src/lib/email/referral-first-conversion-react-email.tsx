import * as React from "react";
import {
  CampaignButton,
  CampaignEmailShell,
  CampaignEyebrow,
  CampaignHeading,
  CampaignShareFooter,
  CampaignText,
} from "@/lib/email/react-email-components";
import {
  DoublingRoundsValue,
  EMAIL_SHARE_TEMPLATE_ID,
  ReferralAskValue,
  ReferralChainMath,
} from "@/lib/email/share-footer";

export function ReferralFirstConversionReactEmail({
  dashboardUrl,
  referrerReferralUrl,
  voterDisplayName,
}: {
  dashboardUrl: string;
  referrerReferralUrl: string;
  voterDisplayName: string;
}) {
  return (
    <CampaignEmailShell preview={`${voterDisplayName} voted through your link.`}>
      <CampaignEyebrow>
        Your link worked. Round 1 of <DoublingRoundsValue />.
      </CampaignEyebrow>
      <CampaignHeading>
        {voterDisplayName} just signed the 1% Treaty through your link.
      </CampaignHeading>
      <CampaignText>
        The math: <ReferralChainMath resultSuffix="humans" />, every adult on
        Earth.
      </CampaignText>
      <CampaignText>
        The chain only works when voters keep telling friends. Celebrate{" "}
        {voterDisplayName}, then optimize Earth — save lives, prevent suffering,
        and send this to <ReferralAskValue word /> more humans you love.
      </CampaignText>
      <CampaignButton href={dashboardUrl}>Open dashboard</CampaignButton>
      <CampaignText muted>
        Live conversion counts are on your dashboard. We only email on the first
        conversion. No per-vote pings.
      </CampaignText>
      <CampaignShareFooter
        referralUrl={referrerReferralUrl}
        templateId={EMAIL_SHARE_TEMPLATE_ID}
      />
    </CampaignEmailShell>
  );
}
