import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";
import { buildShareMessage } from "@/lib/share-message";

const colors = {
  ink: "#111827",
  muted: "#71717a",
  paper: "#ffffff",
  soft: "#f4f4f5",
};

const baseFont = "Arial, sans-serif";

export function CampaignEmailShell({
  children,
  preview,
}: {
  children: React.ReactNode;
  preview: string;
}) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body
        style={{
          backgroundColor: colors.paper,
          color: colors.ink,
          fontFamily: baseFont,
          margin: "0",
          padding: "0",
        }}
      >
        <Container
          style={{
            margin: "0 auto",
            maxWidth: "640px",
            padding: "32px 16px",
          }}
        >
          {children}
        </Container>
      </Body>
    </Html>
  );
}

export function CampaignEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <Text
      style={{
        color: colors.muted,
        fontSize: "13px",
        fontWeight: "700",
        letterSpacing: "0.14em",
        lineHeight: "1.6",
        margin: "0 0 24px",
        textTransform: "uppercase",
      }}
    >
      {children}
    </Text>
  );
}

export function CampaignHeading({ children }: { children: React.ReactNode }) {
  return (
    <Heading
      as="h1"
      style={{
        color: colors.ink,
        fontSize: "32px",
        fontWeight: "900",
        lineHeight: "1.1",
        margin: "0 0 16px",
      }}
    >
      {children}
    </Heading>
  );
}

export function CampaignText({
  children,
  muted = false,
}: {
  children: React.ReactNode;
  muted?: boolean;
}) {
  return (
    <Text
      style={{
        color: muted ? colors.muted : colors.ink,
        fontSize: muted ? "13px" : "16px",
        fontWeight: muted ? "400" : "700",
        lineHeight: muted ? "1.6" : "1.7",
        margin: "0 0 16px",
      }}
    >
      {children}
    </Text>
  );
}

export function CampaignButton({
  children,
  href,
  variant = "primary",
}: {
  children: React.ReactNode;
  href: string;
  variant?: "primary" | "secondary";
}) {
  const isSecondary = variant === "secondary";
  return (
    <Section style={{ margin: "8px 0 24px" }}>
      <Button
        href={href}
        style={{
          backgroundColor: isSecondary ? colors.paper : colors.ink,
          border: `2px solid ${colors.ink}`,
          color: isSecondary ? colors.ink : colors.paper,
          display: "inline-block",
          fontSize: "14px",
          fontWeight: "900",
          letterSpacing: "0.08em",
          padding: "16px 32px",
          textDecoration: "none",
          textTransform: "uppercase",
        }}
      >
        {children}
      </Button>
    </Section>
  );
}

export function CampaignDivider() {
  return (
    <Hr
      style={{
        borderColor: colors.ink,
        borderStyle: "solid",
        borderWidth: "1px 0 0",
        margin: "24px 0",
      }}
    />
  );
}

export function CampaignCopyBlock({ children }: { children: string }) {
  return (
    <Section
      style={{
        backgroundColor: colors.soft,
        border: `1px solid ${colors.ink}`,
        margin: "0 0 28px",
        padding: "14px",
      }}
    >
      <Text
        style={{
          color: colors.ink,
          fontFamily: baseFont,
          fontSize: "14px",
          lineHeight: "1.6",
          margin: "0",
          whiteSpace: "pre-wrap",
        }}
      >
        {children}
      </Text>
    </Section>
  );
}

export function CampaignMetricTable({
  rows,
}: {
  rows: ReadonlyArray<{ label: string; value: string }>;
}) {
  return (
    <Section
      style={{
        borderLeft: `1px solid ${colors.ink}`,
        borderRight: `1px solid ${colors.ink}`,
        borderTop: `1px solid ${colors.ink}`,
        fontFamily: baseFont,
        margin: "0 0 28px",
      }}
    >
      {rows.map((row) => (
        <Text
          key={row.label}
          style={{
            borderBottom: `1px solid ${colors.ink}`,
            color: colors.ink,
            fontSize: "16px",
            fontWeight: "900",
            lineHeight: "1.5",
            margin: "0",
            padding: "10px 12px",
          }}
        >
          <span
            style={{
              color: colors.muted,
              fontSize: "13px",
              fontWeight: "700",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            {row.label}
          </span>
          <span
            style={{
              color: colors.muted,
              fontSize: "13px",
              fontWeight: "700",
            }}
          >
            :{" "}
          </span>
          {row.value}
        </Text>
      ))}
    </Section>
  );
}

export function CampaignShareFooter({ referralUrl }: { referralUrl: string }) {
  return (
    <Section
      style={{
        borderTop: `2px solid ${colors.ink}`,
        marginTop: "48px",
        paddingTop: "24px",
      }}
    >
      <Text
        style={{
          color: colors.muted,
          fontSize: "12px",
          fontWeight: "700",
          letterSpacing: "0.14em",
          lineHeight: "1.6",
          margin: "0 0 12px",
          textTransform: "uppercase",
        }}
      >
        Forward this
      </Text>
      <CampaignText>
        Forward this email to every human you love and do not want to suffer and
        die of horrible diseases.
      </CampaignText>
      <CampaignText>{buildShareMessage(referralUrl)}</CampaignText>
      <CampaignText muted>
        Copy that into iMessage, WhatsApp, Signal, email, or wherever humans
        read words that you write. Or send them straight to {referralUrl}. 32
        doubling rounds x 2 referrals each = 4,300,000,000 humans reached.
      </CampaignText>
    </Section>
  );
}
