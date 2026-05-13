import * as React from "react";
import {
  CampaignButton,
  CampaignEmailShell,
  CampaignEyebrow,
  CampaignHeading,
  CampaignShareFooter,
  CampaignText,
} from "@/lib/email/react-email-components";

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
      <CampaignEyebrow>Your link worked. Round 1 of 32.</CampaignEyebrow>
      <CampaignHeading>
        {voterDisplayName} just signed the 1% Treaty through your link.
      </CampaignHeading>
      <CampaignText>
        The math: 32 doubling rounds x 2 referrals each = 4,300,000,000 humans,
        every adult on Earth.
      </CampaignText>
      <CampaignText>
        The chain breaks when voters stop reaching two humans each. Your job:
        keep going, and make sure {voterDisplayName} keeps going too.
      </CampaignText>
      <CampaignButton href={dashboardUrl}>Open dashboard</CampaignButton>
      <CampaignText muted>
        Live conversion counts are on your dashboard. We only email on the first
        conversion. No per-vote pings.
      </CampaignText>
      <CampaignShareFooter referralUrl={referrerReferralUrl} />
    </CampaignEmailShell>
  );
}
