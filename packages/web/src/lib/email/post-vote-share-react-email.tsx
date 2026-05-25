import * as React from "react";
import {
  CampaignButton,
  CampaignCopyBlock,
  CampaignEmailShell,
  CampaignText,
} from "@/lib/email/react-email-components";
import { HumanityManagerPromotionEmail } from "@/lib/humanity-manager-promotion.email";
import { WAR_ON_DISEASE_CANONICAL_ORIGIN } from "@/lib/domains";
import { ROUTES } from "@/lib/routes";
import { buildShareMessage } from "@/lib/share-message";

export function PostVoteShareReactEmail({
  referralUrl,
}: {
  referralUrl: string;
}) {
  const shareMessage = buildShareMessage(referralUrl);
  const jokeHandoutUrl = `${WAR_ON_DISEASE_CANONICAL_ORIGIN}${ROUTES.joke}#print-handout`;

  return (
    <CampaignEmailShell preview="You have been promoted to Humanity Manager.">
      <HumanityManagerPromotionEmail />
      <CampaignText>
        <strong>TAP AND HOLD TO COPY THIS MESSAGE:</strong>
      </CampaignText>
      <CampaignCopyBlock>{shareMessage}</CampaignCopyBlock>
      <CampaignText muted>
        Paste it into WhatsApp, SMS, email, Signal, or wherever your friends
        read words you write.
      </CampaignText>
      <CampaignButton href={referralUrl}>End war and disease</CampaignButton>
      <CampaignText muted>
        Physical version: print the shirt handout at{" "}
        <a href={jokeHandoutUrl}>{jokeHandoutUrl}</a>.
      </CampaignText>
      <CampaignText>
        <strong>
          Forward this email to everyone you do not want to suffer and die of
          horrible diseases.
        </strong>
      </CampaignText>
    </CampaignEmailShell>
  );
}
