import * as React from "react";
import {
  CampaignButton,
  CampaignEmailShell,
  CampaignText,
} from "@/lib/email/react-email-components";

export function MagicLinkReactEmail({
  url,
  intro,
  buttonLabel,
  notRequested,
}: {
  url: string;
  intro: string;
  buttonLabel: string;
  notRequested: string;
}) {
  return (
    <CampaignEmailShell preview={intro}>
      <CampaignText>{intro}</CampaignText>
      <CampaignButton href={url}>{buttonLabel}</CampaignButton>
      <CampaignText muted>{notRequested}</CampaignText>
    </CampaignEmailShell>
  );
}
