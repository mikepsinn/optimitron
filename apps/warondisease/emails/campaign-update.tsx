import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Link,
  Hr,
} from "@react-email/components"
import { getSiteConfig, getBaseUrl } from "@/lib/site-config"

interface CampaignUpdateEmailProps {
  backerName?: string
  campaignTitle: string
  updateTitle: string
  updatePreview: string
  campaignSlug: string
}

export function CampaignUpdateEmail({
  backerName,
  campaignTitle,
  updateTitle,
  updatePreview,
  campaignSlug,
}: CampaignUpdateEmailProps) {
  const baseUrl = getBaseUrl()

  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Text style={heading}>New Update from {campaignTitle}</Text>

          <Text style={paragraph}>
            {backerName ? `Hi ${backerName},` : "Hi there,"}
          </Text>

          <Text style={paragraph}>
            The creator of <strong>{campaignTitle}</strong> has posted a new update:
          </Text>

          <Section style={updateBox}>
            <Text style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "12px" }}>{updateTitle}</Text>
            <Text style={{ fontSize: "14px", lineHeight: "20px" }}>
              {updatePreview.substring(0, 200)}
              {updatePreview.length > 200 ? "..." : ""}
            </Text>
          </Section>

          <Text style={paragraph}>
            <Link
              href={`${baseUrl}/campaigns/${campaignSlug}?tab=updates`}
              style={button}
            >
              Read Full Update
            </Link>
          </Text>

          <Hr style={hr} />

          <Text style={footer}>
            {getSiteConfig().title}
            <br />
            You're receiving this email because you backed {campaignTitle}.
            <br />
            <Link href={baseUrl}>{getSiteConfig().domain}</Link>
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

// Styles
const main = {
  backgroundColor: "#ffffff",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
}

const container = {
  margin: "0 auto",
  padding: "20px 0 48px",
  maxWidth: "600px",
}

const heading = {
  fontSize: "28px",
  fontWeight: "bold",
  marginBottom: "24px",
}

const paragraph = {
  fontSize: "16px",
  lineHeight: "26px",
  marginBottom: "16px",
}

const updateBox = {
  backgroundColor: "#f4f4f5",
  border: "4px solid #000",
  padding: "24px",
  marginTop: "24px",
  marginBottom: "24px",
}

const button = {
  backgroundColor: "#22d3ee",
  color: "#000",
  fontWeight: "bold",
  fontSize: "16px",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 32px",
  border: "4px solid #000",
  marginTop: "16px",
  marginBottom: "16px",
}

const hr = {
  borderColor: "#cccccc",
  margin: "32px 0",
}

const footer = {
  color: "#8898aa",
  fontSize: "14px",
  lineHeight: "20px",
}

export default CampaignUpdateEmail
