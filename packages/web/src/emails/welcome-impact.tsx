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
import {
  VOTER_LIVES_SAVED,
  VOTER_SUFFERING_HOURS_PREVENTED,
  TREATY_CAMPAIGN_VOTING_BLOC_TARGET,
  fmtRaw,
} from "@optimitron/data/parameters"

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
  const livesSaved = VOTER_LIVES_SAVED.value
  const sufferingYearsPrevented = Math.round(VOTER_SUFFERING_HOURS_PREVENTED.value / 8_760) // hours → years
  const economicValue = "$5.8M"

  return (
    <Html>
      <Head />
      <Preview>
        {`You just joined the Earth Optimization Game. One vote = ${livesSaved} lives saved. Now tell two friends.`}
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
              fontSize: "28px",
              fontWeight: "900",
              textAlign: "center",
              textTransform: "uppercase",
              margin: "0 0 10px 0",
            }}
          >
            WELCOME TO THE
          </Heading>
          <Heading
            style={{
              color: primaryColor,
              fontSize: "36px",
              fontWeight: "900",
              textAlign: "center",
              textTransform: "uppercase",
              margin: "0 0 30px 0",
            }}
          >
            EARTH OPTIMIZATION GAME
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
            Hello {userName}. You just voted for the 1% Treaty, which means you&apos;ve done more for your species in 30 seconds than most of your governments do in a fiscal quarter. Here&apos;s what one vote does:
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
              NOW TELL TWO FRIENDS
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
              The game is simple. You tell two friends. They tell two friends. On my planet this is called &quot;talking to people&quot; and is not considered revolutionary, but here we are.
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
              Share your link with two people who&apos;d prefer being alive:
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
              Your vote is counted toward the tipping point — {fmtRaw(TREATY_CAMPAIGN_VOTING_BLOC_TARGET.value)} verified humans who&apos;d
              prefer living to exploding. When you get there, the 1% Treaty passes and your
              governments redirect 1% of bomb money to medicine money.
            </Text>
            <Text
              style={{
                color: "#666666",
                fontSize: "13px",
                textAlign: "center",
                margin: "0",
                lineHeight: "1.6",
                fontStyle: "italic",
              }}
            >
              On my planet this took about four minutes. You lot are making it harder than it needs to be. — Wishonia
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
