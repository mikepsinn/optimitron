import * as React from "react";
import {
  CampaignButton,
  CampaignCopyBlock,
  CampaignEmailShell,
  CampaignText,
} from "@/lib/email/react-email-components";
import { HumanityManagerPromotionEmail } from "@/lib/humanity-manager-promotion.email";
import { REFERRAL_SHARE_LABEL } from "@/lib/messaging";
import { buildShareMessage } from "@/lib/share-message";

export function PostVoteShareReactEmail({
  referralUrl,
}: {
  referralUrl: string;
}) {
  const shareMessage = buildShareMessage(referralUrl);

  return (
    <CampaignEmailShell preview="You have been promoted to Humanity Manager.">
      <HumanityManagerPromotionEmail />
      <CampaignText>
        <strong>{REFERRAL_SHARE_LABEL}</strong>
      </CampaignText>
      <CampaignText>
        <strong>COPY THIS MESSAGE:</strong> Copy it and forward it to two
        friends right now.
      </CampaignText>
      <CampaignCopyBlock>{shareMessage}</CampaignCopyBlock>
      <CampaignButton href={referralUrl}>End war and disease</CampaignButton>
      <CampaignText muted>
        Paste it into WhatsApp, SMS, email, Signal, or wherever your friends
        read words from you.
      </CampaignText>
    </CampaignEmailShell>
  );
}
