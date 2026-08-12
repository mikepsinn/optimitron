import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components"
import * as React from "react"
import { getSiteConfig } from "@/lib/site-config"

interface PartnerRejectionEmailProps {
  organizationName: string
  contactName?: string
  reason?: string
}

export const PartnerRejectionEmail = ({
  organizationName,
  contactName,
  reason,
}: PartnerRejectionEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Update on your partner institute application</Preview>
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
          <Section style={{ marginBottom: "30px" }}>
            <Text
              style={{
                color: "#000000",
                fontSize: "24px",
                fontWeight: "700",
                lineHeight: "1.4",
                margin: "0 0 20px 0",
              }}
            >
              Update on Your Application
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
              Thank you for your interest in joining the {getSiteConfig().title} as a partner institute with <strong>{organizationName}</strong>.
            </Text>
            <Text
              style={{
                color: "#000000",
                fontSize: "16px",
                lineHeight: "1.6",
                margin: "0 0 30px 0",
              }}
            >
              After careful review, we're unable to approve your application at this time.
            </Text>
          </Section>

          {reason && (
            <Section style={{ marginBottom: "30px" }}>
              <Text
                style={{
                  color: "#000000",
                  fontSize: "16px",
                  lineHeight: "1.6",
                  margin: "0 0 15px 0",
                  fontWeight: "600",
                }}
              >
                Reason:
              </Text>
              <Text
                style={{
                  color: "#333333",
                  fontSize: "16px",
                  lineHeight: "1.6",
                  margin: "0 0 20px 0",
                  fontStyle: "italic",
                }}
              >
                {reason}
              </Text>
            </Section>
          )}

          <Section style={{ marginBottom: "30px" }}>
            <Text
              style={{
                color: "#000000",
                fontSize: "16px",
                lineHeight: "1.6",
                margin: "0 0 20px 0",
              }}
            >
              We encourage you to review our partner institute guidelines and consider reapplying in the future if your organization's mission and structure align more closely with our criteria.
            </Text>
          </Section>

          <Section style={{ marginTop: "30px", paddingTop: "20px", borderTop: "1px solid #e0e0e0" }}>
            <Text
              style={{
                color: "#666666",
                fontSize: "14px",
                lineHeight: "1.6",
                margin: "0 0 10px 0",
              }}
            >
              If you have any questions about this decision or would like more information about our partner program, please don't hesitate to reach out.
            </Text>
            <Text
              style={{
                color: "#666666",
                fontSize: "14px",
                lineHeight: "1.6",
                margin: "0",
              }}
            >
              Thank you for your understanding and continued interest in the War on Disease.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export default PartnerRejectionEmail
