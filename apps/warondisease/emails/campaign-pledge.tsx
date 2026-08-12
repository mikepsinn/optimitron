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

interface CampaignPledgeEmailProps {
  backerName?: string
  campaignTitle: string
  pledgeAmount: number
  currency: string
  rewardTitle?: string
  campaignSlug: string
}

export function CampaignPledgeEmail({
  backerName,
  campaignTitle,
  pledgeAmount,
  currency,
  rewardTitle,
  campaignSlug,
}: CampaignPledgeEmailProps) {
  const formatCurrency = (amount: number, curr: string) => {
    return (amount / 100).toLocaleString("en-US", {
      style: "currency",
      currency: curr,
    })
  }

  const baseUrl = getBaseUrl()

  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Text style={heading}>Thank You for Your Support! 🚀</Text>

          <Text style={paragraph}>
            {backerName ? `Hi ${backerName},` : "Hi there,"}
          </Text>

          <Text style={paragraph}>
            Thank you for backing <strong>{campaignTitle}</strong>!
          </Text>

          <Section style={pledgeBox}>
            <Text style={pledgeLabel}>Your Pledge</Text>
            <Text style={{ fontSize: "32px", fontWeight: "900", marginTop: "16px" }}>{formatCurrency(pledgeAmount, currency)}</Text>
            {rewardTitle && (
              <Text style={rewardText}>Reward: {rewardTitle}</Text>
            )}
          </Section>

          <Text style={paragraph}>
            Your support helps make this campaign possible. You'll receive email updates
            as the campaign progresses and when your reward is ready to ship (if applicable).
          </Text>

          <Text style={paragraph}>
            <Link
              href={`${baseUrl}/campaigns/${campaignSlug}`}
              style={button}
            >
              View Campaign
            </Link>
          </Text>

          <Hr style={hr} />

          <Text style={footer}>
            {getSiteConfig().title}
            <br />
            Building the future of medical research, together.
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
  fontSize: "32px",
  fontWeight: "bold",
  marginBottom: "24px",
}

const paragraph = {
  fontSize: "16px",
  lineHeight: "26px",
  marginBottom: "16px",
}

const pledgeBox = {
  backgroundColor: "#f4f4f5",
  border: "4px solid #000",
  padding: "24px",
  marginTop: "24px",
  marginBottom: "24px",
  textAlign: "center" as const,
}

const pledgeLabel = {
  fontSize: "14px",
  fontWeight: "bold",
  textTransform: "uppercase" as const,
  marginBottom: "8px",
}

const rewardText = {
  fontSize: "14px",
  fontWeight: "600",
  marginTop: "8px",
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

export default CampaignPledgeEmail
