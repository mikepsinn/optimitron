import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components"
import * as React from "react"
import { getEmail } from "@/lib/site-config"
import { CTAButton } from "./components/CTAButton"
import { getEmailUrls } from "@/lib/email-urls"

interface DonationThankYouEmailProps {
  donorName?: string
  amount: number
  donationType: "one-time" | "monthly"
  donationDate: string
}

export const DonationThankYouEmail = ({
  donorName = "friend",
  amount,
  donationType,
  donationDate,
}: DonationThankYouEmailProps) => {
  const formattedAmount = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount)

  return (
    <Html>
      <Head />
      <Preview>Thank you for joining the war on disease!</Preview>
      <Body
        style={{
          backgroundColor: "#ffffff",
          fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
          margin: "0 auto",
          padding: "20px",
        }}
      >
        <Container
          style={{
            backgroundColor: "#ffffff",
            border: "4px solid #000000",
            borderRadius: "0px",
            margin: "0 auto",
            padding: "40px",
            maxWidth: "600px",
          }}
        >
          <Heading
            style={{
              color: "#000000",
              fontSize: "32px",
              fontWeight: "900",
              textAlign: "center",
              textTransform: "uppercase",
              margin: "0 0 30px 0",
            }}
          >
            THANK YOU, {donorName.toUpperCase()}!
          </Heading>

          <Text
            style={{
              color: "#000000",
              fontSize: "18px",
              fontWeight: "bold",
              lineHeight: "1.6",
              margin: "0 0 20px 0",
            }}
          >
            Your {donationType === "monthly" ? "monthly " : ""}donation of{" "}
            <span style={{ color: "#FF6B9D" }}>{formattedAmount}</span> is helping us eradicate disease and make
            suffering optional.
          </Text>

          <Section
            style={{
              backgroundColor: "#00D4FF",
              border: "4px solid #000000",
              padding: "30px",
              margin: "30px 0",
            }}
          >
            <Text
              style={{
                color: "#000000",
                fontSize: "16px",
                fontWeight: "bold",
                margin: "0 0 15px 0",
                textTransform: "uppercase",
              }}
            >
              WHAT HAPPENS NEXT?
            </Text>
            <Text style={{ color: "#000000", fontSize: "14px", margin: "0 0 10px 0" }}>
              ✓ Receipt sent to your email (from Stripe)
            </Text>
            <Text style={{ color: "#000000", fontSize: "14px", margin: "0 0 10px 0" }}>
              ✓ Monthly newsletter with treaty progress & research findings
            </Text>
            <Text style={{ color: "#000000", fontSize: "14px", margin: "0" }}>
              ✓ Quarterly reports with financial transparency & impact metrics
            </Text>
          </Section>

          <Text
            style={{
              color: "#000000",
              fontSize: "16px",
              fontWeight: "bold",
              lineHeight: "1.6",
              margin: "30px 0 20px 0",
            }}
          >
            Your contribution is funding research that will save millions of lives. Together, we're building a world
            where disease is optional.
          </Text>

          <CTAButton href={getEmailUrls().dashboardLink} margin="40px 0">VIEW YOUR DASHBOARD</CTAButton>

          <Section style={{ textAlign: "center", margin: "40px 0 20px 0" }}>
            <Text
              style={{
                color: "#666666",
                fontSize: "14px",
                margin: "0 0 10px 0",
              }}
            >
              Donation Date: {donationDate}
            </Text>
            <Text
              style={{
                color: "#666666",
                fontSize: "12px",
                margin: "0",
              }}
            >
              Questions? Contact us at{" "}
              <Link href={`mailto:${getEmail()}`} style={{ color: "#000000", fontWeight: "bold" }}>
                {getEmail()}
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export default DonationThankYouEmail

