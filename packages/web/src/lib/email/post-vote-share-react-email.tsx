import * as React from "react";
import {
  CampaignButton,
  CampaignEmailShell,
  CampaignText,
} from "@/lib/email/react-email-components";
import { HumanityManagerPromotion } from "@/lib/humanity-manager-promotion";
import { buildShareMessage } from "@/lib/share-message";

export function PostVoteShareReactEmail({
  referralUrl,
}: {
  referralUrl: string;
}) {
  return (
    <CampaignEmailShell preview="You have been promoted to Humanity Manager.">
      <HumanityManagerPromotion target="email" />
      <CampaignText>{buildShareMessage(referralUrl)}</CampaignText>
      <CampaignButton href={referralUrl}>Share with two humans</CampaignButton>
      <CampaignText muted>
        Forward this email or copy the message above into iMessage,
        WhatsApp, Signal, or wherever humans read your words.
      </CampaignText>
    </CampaignEmailShell>
  );
}
