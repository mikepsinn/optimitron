import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Row,
  Column,
} from "@react-email/components"
import * as React from "react"
import { EmailFooter } from "./components/EmailFooter"
import { SocialShareButtons } from "./components/SocialShareButtons"
import { ReferralLinkBox } from "./components/ReferralLinkBox"
import { CTAButton } from "./components/CTAButton"
import { ResourcePromoSection } from "./components/ResourcePromoSection"
import { getEmailUrls } from "@/lib/email-urls"

interface WelcomeImpactEmailProps {
  userName: string
  referralLink: string
  primaryColor?: string
}

export const WelcomeImpactEmail = ({
  userName,
  referralLink,
  primaryColor = "#FF6B9D",
}: WelcomeImpactEmailProps) => {
  const { dashboardLink } = getEmailUrls()
  // Impact calculations (per vote — from parameters-calculations-citations.ts)
  const livesSaved = 38.4
  const sufferingYearsPrevented = 787
  const economicValue = "$5.8M"

  return (
    <Html>
      <Head />
      <Preview>
        {`Your vote is confirmed — here's your impact: ${livesSaved} lives saved, ${sufferingYearsPrevented} years of suffering prevented!`}
      </Preview>
      <Body
        style={{
          backgroundColor: "#f5f5f5",
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
          {/* Header */}
          <Heading
            style={{
              color: "#000000",
              fontSize: "32px",
              fontWeight: "900",
              textAlign: "center",
              textTransform: "uppercase",
              margin: "0 0 10px 0",
            }}
          >
            WELCOME TO
          </Heading>
          <Heading
            style={{
              color: primaryColor,
              fontSize: "42px",
              fontWeight: "900",
              textAlign: "center",
              textTransform: "uppercase",
              margin: "0 0 30px 0",
            }}
          >
            OPTIMITRON
          </Heading>

          <Text
            style={{
              color: "#000000",
              fontSize: "16px",
              fontWeight: "bold",
              textAlign: "center",
              margin: "0 0 30px 0",
              lineHeight: "1.6",
            }}
          >
            Hey {userName}! Your vote for the 1% Treaty referendum is confirmed. Here's the impact you just made:
          </Text>

          {/* Impact Stats */}
          <Section
            style={{
              backgroundColor: "#00D4FF",
              border: "4px solid #000000",
              padding: "30px",
              marginBottom: "20px",
            }}
          >
            <Text
              style={{
                color: "#000000",
                fontSize: "14px",
                fontWeight: "900",
                textTransform: "uppercase",
                textAlign: "center",
                margin: "0 0 20px 0",
              }}
            >
              YOUR SINGLE VOTE JUST:
            </Text>

            <Row style={{ marginBottom: "15px" }}>
              <Column>
                <div
                  style={{
                    backgroundColor: "#ffffff",
                    border: "3px solid #000000",
                    padding: "20px",
                    textAlign: "center",
                  }}
                >
                  <Text
                    style={{
                      color: "#FF6B9D",
                      fontSize: "40px",
                      fontWeight: "900",
                      lineHeight: "1",
                      margin: "0 0 10px 0",
                    }}
                  >
                    {livesSaved}
                  </Text>
                  <Text
                    style={{
                      color: "#000000",
                      fontSize: "14px",
                      fontWeight: "bold",
                      textTransform: "uppercase",
                      margin: "0",
                    }}
                  >
                    Lives Saved
                  </Text>
                </div>
              </Column>
            </Row>

            <Row style={{ marginBottom: "15px" }}>
              <Column>
                <div
                  style={{
                    backgroundColor: "#ffffff",
                    border: "3px solid #000000",
                    padding: "20px",
                    textAlign: "center",
                  }}
                >
                  <Text
                    style={{
                      color: "#FFE66D",
                      fontSize: "40px",
                      fontWeight: "900",
                      lineHeight: "1",
                      margin: "0 0 10px 0",
                      textShadow: "2px 2px 0px #000000",
                    }}
                  >
                    {sufferingYearsPrevented}
                  </Text>
                  <Text
                    style={{
                      color: "#000000",
                      fontSize: "14px",
                      fontWeight: "bold",
                      textTransform: "uppercase",
                      margin: "0",
                    }}
                  >
                    Years of Suffering Prevented
                  </Text>
                </div>
              </Column>
            </Row>

            <Row>
              <Column>
                <div
                  style={{
                    backgroundColor: "#ffffff",
                    border: "3px solid #000000",
                    padding: "20px",
                    textAlign: "center",
                  }}
                >
                  <Text
                    style={{
                      color: "#00D4FF",
                      fontSize: "40px",
                      fontWeight: "900",
                      lineHeight: "1",
                      margin: "0 0 10px 0",
                    }}
                  >
                    {economicValue}
                  </Text>
                  <Text
                    style={{
                      color: "#000000",
                      fontSize: "14px",
                      fontWeight: "bold",
                      textTransform: "uppercase",
                      margin: "0",
                    }}
                  >
                    Economic Value Created
                  </Text>
                </div>
              </Column>
            </Row>
          </Section>

          {/* Referral Motivation */}
          <Section
            style={{
              backgroundColor: "#FFE66D",
              border: "4px solid #000000",
              padding: "30px",
              marginBottom: "30px",
            }}
          >
            <Text
              style={{
                color: "#000000",
                fontSize: "18px",
                fontWeight: "900",
                textTransform: "uppercase",
                textAlign: "center",
                margin: "0 0 15px 0",
              }}
            >
              MULTIPLY YOUR IMPACT
            </Text>
            <Text
              style={{
                color: "#000000",
                fontSize: "16px",
                fontWeight: "bold",
                textAlign: "center",
                margin: "0 0 20px 0",
                lineHeight: "1.6",
              }}
            >
              Each verified voter you recruit earns you a VOTE token and multiplies your impact.
            </Text>
            <Text
              style={{
                color: "#000000",
                fontSize: "14px",
                fontWeight: "bold",
                textAlign: "center",
                margin: "0 0 25px 0",
                lineHeight: "1.6",
              }}
            >
              Share your unique referral link to recruit more voters for the referendum:
            </Text>

            <ReferralLinkBox referralLink={referralLink} />
            <SocialShareButtons referralLink={referralLink} />
          </Section>

          <CTAButton href={dashboardLink}>VIEW YOUR DASHBOARD</CTAButton>

          {/* What happens next */}
          <Section style={{ marginTop: "30px" }}>
            <Text
              style={{
                color: "#000000",
                fontSize: "14px",
                textAlign: "center",
                margin: "0 0 15px 0",
                fontWeight: "bold",
              }}
            >
              What happens next?
            </Text>
            <Text
              style={{
                color: "#666666",
                fontSize: "13px",
                textAlign: "center",
                margin: "0 0 10px 0",
                lineHeight: "1.6",
              }}
            >
              Your vote is now counted toward the global tipping point. When enough people vote,
              we'll have the democratic mandate to reallocate 1% of military spending to pragmatic
              clinical trials — optimizing governance with data instead of ideology.
            </Text>
            <Text
              style={{
                color: "#666666",
                fontSize: "13px",
                textAlign: "center",
                margin: "0",
                lineHeight: "1.6",
              }}
            >
              Every person you recruit brings us closer. Let's optimize Earth together.
            </Text>
          </Section>

          <ResourcePromoSection utmSource="welcome_email" />

          <EmailFooter reason="you voted in the Optimitron referendum" />
        </Container>
      </Body>
    </Html>
  )
}

export default WelcomeImpactEmail
