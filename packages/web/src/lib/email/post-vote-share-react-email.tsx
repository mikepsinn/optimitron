import * as React from "react";
import {
  CampaignButton,
  CampaignEmailShell,
  CampaignText,
} from "@/lib/email/react-email-components";
import { HumanityManagerPromotion } from "@/lib/humanity-manager-promotion";
import { EmailShareMessage } from "@/lib/email/share-footer";

export function PostVoteShareReactEmail({
  referralUrl,
}: {
  referralUrl: string;
}) {
  return (
    <CampaignEmailShell preview="You have been promoted to Humanity Manager.">
      <HumanityManagerPromotion target="email" />
      <CampaignText>
        <EmailShareMessage referralUrl={referralUrl} />
      </CampaignText>
      <CampaignButton href={referralUrl}>End war and disease</CampaignButton>
      <CampaignText muted>
        Forward this email or copy the message above into iMessage,
        WhatsApp, Signal, or wherever humans read your words.
      </CampaignText>
    </CampaignEmailShell>
  );
}
