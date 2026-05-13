import * as React from "react";
import {
  CampaignButton,
  CampaignEmailShell,
  CampaignEyebrow,
  CampaignHeading,
  CampaignShareFooter,
  CampaignText,
} from "@/lib/email/react-email-components";

const ink = "#111827";

export function TaskAssignmentReactEmail({
  description,
  recipientName,
  replyInstruction,
  taskUrl,
  title,
  recipientReferralUrl,
}: {
  description: string;
  recipientName: string;
  replyInstruction?: string | null;
  taskUrl: string;
  title: string;
  recipientReferralUrl?: string | null;
}) {
  const paragraphs = description
    .trim()
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <CampaignEmailShell preview={`New task: ${title}`}>
      <CampaignEyebrow>New task for {recipientName}</CampaignEyebrow>
      <CampaignHeading>{title}</CampaignHeading>
      <div
        style={{
          borderBottom: `2px solid ${ink}`,
          borderTop: `2px solid ${ink}`,
          margin: "0 0 24px",
          padding: "20px 0",
        }}
      >
        {paragraphs.map((p, i) => (
          <CampaignText key={i}>{p}</CampaignText>
        ))}
      </div>
      <CampaignButton href={taskUrl}>Open task</CampaignButton>
      {replyInstruction ? <CampaignText muted>{replyInstruction}</CampaignText> : null}
      {recipientReferralUrl ? (
        <CampaignShareFooter referralUrl={recipientReferralUrl} />
      ) : null}
    </CampaignEmailShell>
  );
}
