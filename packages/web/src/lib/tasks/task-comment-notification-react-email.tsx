import { Img, Section, Text } from "@react-email/components";
import * as React from "react";
import {
  CampaignButton,
  CampaignEmailShell,
  CampaignHeading,
  CampaignShareFooter,
  CampaignText,
} from "@/lib/email/react-email-components";
import { EMAIL_SHARE_TEMPLATE_ID } from "@/lib/email/share-footer";
import type { SenderSignature } from "@/lib/email/wishonia-signature";

const ink = "#111827";
const muted = "#71717a";

export function TaskCommentNotificationReactEmail({
  authorAvatarUrl,
  authorName,
  commentMessage,
  cta,
  recipientReason,
  recipientReferralUrl,
  replyInstruction,
  secondaryCta,
  senderSignature,
  title,
  unsubscribeUrl,
}: {
  authorAvatarUrl: string | null;
  authorName: string;
  commentMessage: string;
  cta: { label: string; url: string } | null;
  recipientReason: string | null;
  recipientReferralUrl: string | null;
  replyInstruction: string | null;
  secondaryCta: { label: string; url: string } | null;
  senderSignature: SenderSignature | null;
  title: string;
  unsubscribeUrl: string;
}) {
  const authorInitial = (authorName.trim()[0] ?? "?").toUpperCase();
  return (
    <CampaignEmailShell preview={`${authorName} commented: ${commentMessage.slice(0, 80)}`}>
      <CampaignHeading>{title}</CampaignHeading>
      <Section
        style={{
          borderLeft: `3px solid ${ink}`,
          margin: "0 0 24px",
          paddingLeft: "14px",
        }}
      >
        <Section style={{ marginBottom: "8px" }}>
          {authorAvatarUrl ? (
            <Img
              src={authorAvatarUrl}
              alt={authorName}
              width="44"
              height="44"
              style={{
                background: "#ffffff",
                border: `2px solid ${ink}`,
                display: "inline-block",
                height: "44px",
                marginRight: "12px",
                objectFit: "cover",
                verticalAlign: "middle",
                width: "44px",
              }}
            />
          ) : (
            <span
              style={{
                background: "#ffffff",
                border: `2px solid ${ink}`,
                color: ink,
                display: "inline-block",
                fontSize: "18px",
                fontWeight: "900",
                height: "44px",
                lineHeight: "44px",
                marginRight: "12px",
                textAlign: "center",
                verticalAlign: "middle",
                width: "44px",
              }}
            >
              {authorInitial}
            </span>
          )}
          <Text
            style={{
              color: ink,
              display: "inline-block",
              fontSize: "13px",
              fontWeight: "900",
              lineHeight: "1.4",
              margin: "0",
              textTransform: "uppercase",
              verticalAlign: "middle",
            }}
          >
            {authorName} commented
          </Text>
        </Section>
        <Text
          style={{
            color: ink,
            fontSize: "16px",
            lineHeight: "1.6",
            margin: "0",
            whiteSpace: "pre-wrap",
          }}
        >
          {commentMessage}
        </Text>
      </Section>
      {cta ? <CampaignButton href={cta.url}>{cta.label}</CampaignButton> : null}
      {secondaryCta ? (
        <CampaignButton href={secondaryCta.url} variant="secondary">
          {secondaryCta.label}
        </CampaignButton>
      ) : null}
      {replyInstruction ? <CampaignText muted>{replyInstruction}</CampaignText> : null}
      {recipientReason ? (
        <Text
          style={{
            color: muted,
            fontSize: "12px",
            lineHeight: "1.6",
            margin: "24px 0 0",
          }}
        >
          {recipientReason}
        </Text>
      ) : null}
      {senderSignature ? <SenderSignatureBlock signature={senderSignature} /> : null}
      {recipientReferralUrl ? (
        <CampaignShareFooter
          referralUrl={recipientReferralUrl}
          templateId={EMAIL_SHARE_TEMPLATE_ID}
        />
      ) : null}
      <Text
        style={{
          color: muted,
          fontSize: "12px",
          lineHeight: "1.6",
          margin: "32px 0 0",
        }}
      >
        <a href={unsubscribeUrl} style={{ color: muted }}>
          Unsubscribe
        </a>
      </Text>
    </CampaignEmailShell>
  );
}

function SenderSignatureBlock({ signature }: { signature: SenderSignature }) {
  const role = signature.role ?? "Recently promoted to Humanity Manager";
  const org = signature.org ?? "Earth Optimization Services LLC";
  return (
    <Section
      style={{
        borderLeft: `3px solid ${ink}`,
        margin: "32px 0 0",
        paddingLeft: "16px",
      }}
    >
      <Text style={{ color: "#3f3f46", fontSize: "14px", lineHeight: "1.4", margin: "0 0 8px" }}>
        Love,
      </Text>
      <Text
        style={{
          color: ink,
          fontSize: "18px",
          fontWeight: "700",
          lineHeight: "1.3",
          margin: "0",
        }}
      >
        {signature.name}
      </Text>
      <Text style={{ color: "#3f3f46", fontSize: "14px", lineHeight: "1.4", margin: "2px 0 0" }}>
        {role}
      </Text>
      <Text
        style={{
          color: ink,
          fontSize: "14px",
          fontWeight: "700",
          lineHeight: "1.4",
          margin: "8px 0 0",
        }}
      >
        {org}
      </Text>
    </Section>
  );
}
