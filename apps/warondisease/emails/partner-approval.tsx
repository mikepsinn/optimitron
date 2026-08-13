import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
  Hr,
} from "@react-email/components"
import * as React from "react"
import { getEmail } from "@/lib/site-config"
import { getEmailUrls } from "@/lib/email-urls"

interface PartnerApprovalEmailProps {
  organizationName: string
  slug: string
  contactName?: string
}

export const PartnerApprovalEmail = ({
  organizationName,
  slug,
  contactName,
}: PartnerApprovalEmailProps) => {
  const { baseUrl } = getEmailUrls()
  const surveyUrl = `${baseUrl}/survey/${slug}`
  const embedCode = `<iframe src="${surveyUrl}" width="100%" height="800" frameborder="0"></iframe>`

  return (
    <Html>
      <Head />
      <Preview>Welcome! Your Partner Institute is live - start sharing now</Preview>
      <Body
        style={{
          backgroundColor: "#ffffff",
          fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
          margin: "0 auto",
          padding: "40px 20px",
        }}
      >
        <Container
          style={{
            maxWidth: "600px",
            margin: "0 auto",
          }}
        >
          {/* Header */}
          <Section style={{ marginBottom: "30px" }}>
            <Text
              style={{
                color: "#000000",
                fontSize: "28px",
                fontWeight: "800",
                lineHeight: "1.3",
                margin: "0 0 10px 0",
                textTransform: "uppercase",
              }}
            >
              You're Live!
            </Text>
            <Text
              style={{
                color: "#000000",
                fontSize: "16px",
                lineHeight: "1.6",
                margin: "0 0 20px 0",
              }}
            >
              {contactName ? `Hi ${contactName},` : "Hi there,"}
            </Text>
            <Text
              style={{
                color: "#000000",
                fontSize: "16px",
                lineHeight: "1.6",
                margin: "0 0 20px 0",
              }}
            >
              Your Partner Institute <strong>{organizationName}</strong> is set up and ready to collect data from your community.
            </Text>
          </Section>

          {/* Survey Link Section */}
          <Section
            style={{
              backgroundColor: "#00f0ff",
              padding: "20px",
              marginBottom: "30px",
              border: "3px solid #000000",
            }}
          >
            <Text
              style={{
                color: "#000000",
                fontSize: "14px",
                fontWeight: "700",
                textTransform: "uppercase",
                margin: "0 0 10px 0",
              }}
            >
              Your Survey URL
            </Text>
            <Text
              style={{
                color: "#000000",
                fontSize: "16px",
                lineHeight: "1.4",
                margin: "0 0 15px 0",
                wordBreak: "break-all",
              }}
            >
              {surveyUrl}
            </Text>
            <Button
              href={surveyUrl}
              style={{
                backgroundColor: "#000000",
                color: "#ffffff",
                fontSize: "14px",
                fontWeight: "700",
                textDecoration: "none",
                padding: "12px 24px",
                display: "inline-block",
                textTransform: "uppercase",
              }}
            >
              Preview Your Survey
            </Button>
          </Section>

          {/* 3 Ways to Share */}
          <Section style={{ marginBottom: "30px" }}>
            <Text
              style={{
                color: "#000000",
                fontSize: "18px",
                fontWeight: "700",
                lineHeight: "1.4",
                margin: "0 0 20px 0",
              }}
            >
              3 Ways to Share Your Survey:
            </Text>

            {/* Way 1 */}
            <Text
              style={{
                color: "#000000",
                fontSize: "16px",
                lineHeight: "1.6",
                margin: "0 0 5px 0",
              }}
            >
              <strong>1. Direct Link</strong>
            </Text>
            <Text
              style={{
                color: "#666666",
                fontSize: "14px",
                lineHeight: "1.6",
                margin: "0 0 15px 0",
              }}
            >
              Share the URL above in emails, newsletters, or social media posts.
            </Text>

            {/* Way 2 */}
            <Text
              style={{
                color: "#000000",
                fontSize: "16px",
                lineHeight: "1.6",
                margin: "0 0 5px 0",
              }}
            >
              <strong>2. Website Button</strong>
            </Text>
            <Text
              style={{
                color: "#666666",
                fontSize: "14px",
                lineHeight: "1.6",
                margin: "0 0 15px 0",
              }}
            >
              Add a "Take the Survey" button on your website linking to your survey URL.
            </Text>

            {/* Way 3 */}
            <Text
              style={{
                color: "#000000",
                fontSize: "16px",
                lineHeight: "1.6",
                margin: "0 0 5px 0",
              }}
            >
              <strong>3. Embed on Your Site</strong>
            </Text>
            <Text
              style={{
                color: "#666666",
                fontSize: "14px",
                lineHeight: "1.6",
                margin: "0 0 10px 0",
              }}
            >
              Paste this code into your website HTML:
            </Text>
            <Text
              style={{
                backgroundColor: "#f5f5f5",
                padding: "12px",
                fontSize: "12px",
                fontFamily: "monospace",
                lineHeight: "1.4",
                margin: "0 0 20px 0",
                wordBreak: "break-all",
                border: "1px solid #e0e0e0",
              }}
            >
              {embedCode}
            </Text>
          </Section>

          <Hr style={{ borderColor: "#e0e0e0", margin: "30px 0" }} />

          {/* What Happens Next */}
          <Section style={{ marginBottom: "30px" }}>
            <Text
              style={{
                color: "#000000",
                fontSize: "18px",
                fontWeight: "700",
                lineHeight: "1.4",
                margin: "0 0 15px 0",
              }}
            >
              What Happens Next:
            </Text>
            <Text
              style={{
                color: "#000000",
                fontSize: "14px",
                lineHeight: "1.8",
                margin: "0",
              }}
            >
              • Your supporters take the short survey<br />
              • Responses are tracked to your organization<br />
              • You'll get access to dashboard data and exportable charts<br />
              • Use the data in grants, advocacy, and donor communications
            </Text>
          </Section>

          {/* CTA */}
          <Section style={{ textAlign: "center", marginBottom: "30px" }}>
            <Button
              href={surveyUrl}
              style={{
                backgroundColor: "#ff6b9d",
                color: "#000000",
                fontSize: "16px",
                fontWeight: "700",
                textDecoration: "none",
                padding: "16px 32px",
                display: "inline-block",
                textTransform: "uppercase",
                border: "3px solid #000000",
              }}
            >
              Start Collecting Data Now
            </Button>
          </Section>

          {/* Footer */}
          <Section style={{ marginTop: "30px", paddingTop: "20px", borderTop: "1px solid #e0e0e0" }}>
            <Text
              style={{
                color: "#666666",
                fontSize: "14px",
                lineHeight: "1.6",
                margin: "0 0 10px 0",
              }}
            >
              Questions? Reply to this email or contact us at {getEmail('institutes')}
            </Text>
            <Text
              style={{
                color: "#666666",
                fontSize: "14px",
                lineHeight: "1.6",
                margin: "0",
              }}
            >
              Welcome to the coalition. Together, we're building the case for more clinical trial funding.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export default PartnerApprovalEmail
