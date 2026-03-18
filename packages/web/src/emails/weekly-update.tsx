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

interface WeeklyUpdateEmailProps {
  userName: string
  stats: {
    referrals: number
    newReferrals: number
    rank: number
    shares: number
    reach: number
  }
  referralLink: string
  globalProgress: {
    current: number // e.g., 0.001
    target: number // 3.5
  }
}

export const WeeklyUpdateEmail = ({
  userName,
  stats,
  referralLink,
  globalProgress,
}: WeeklyUpdateEmailProps) => {
  const { dashboardLink } = getEmailUrls()
  const progressPercentage = (globalProgress.current / globalProgress.target) * 100
  const peopleNeeded = ((globalProgress.target - globalProgress.current) * 80000000).toLocaleString()

  return (
    <Html>
      <Head />
      <Preview>
        Your Weekly Optimitron Update - {stats.newReferrals > 0 ? `+${stats.newReferrals} new recruits!` : "Keep recruiting!"}
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
            YOUR WEEKLY
          </Heading>
          <Heading
            style={{
              color: "#FF6B9D",
              fontSize: "36px",
              fontWeight: "900",
              textAlign: "center",
              textTransform: "uppercase",
              margin: "0 0 30px 0",
            }}
          >
            IMPACT REPORT
          </Heading>

          <Text
            style={{
              color: "#000000",
              fontSize: "16px",
              fontWeight: "bold",
              textAlign: "center",
              margin: "0 0 30px 0",
            }}
          >
            Hey {userName}! Here's your governance optimization impact this week.
          </Text>

          {/* Stats Grid */}
          <Row style={{ marginBottom: "20px" }}>
            <Column
              style={{
                width: "50%",
                paddingRight: "10px",
              }}
            >
              <Section
                style={{
                  backgroundColor: "#FF6B9D",
                  border: "4px solid #000000",
                  padding: "20px",
                  textAlign: "center",
                }}
              >
                <Text
                  style={{
                    color: "#000000",
                    fontSize: "12px",
                    fontWeight: "900",
                    textTransform: "uppercase",
                    margin: "0 0 10px 0",
                  }}
                >
                  Total Referrals
                </Text>
                <Text
                  style={{
                    color: "#000000",
                    fontSize: "48px",
                    fontWeight: "900",
                    lineHeight: "1",
                    margin: "0",
                  }}
                >
                  {stats.referrals}
                </Text>
                {stats.newReferrals > 0 && (
                  <Text
                    style={{
                      color: "#000000",
                      fontSize: "14px",
                      fontWeight: "bold",
                      margin: "10px 0 0 0",
                    }}
                  >
                    +{stats.newReferrals} this week!
                  </Text>
                )}
              </Section>
            </Column>
            <Column
              style={{
                width: "50%",
                paddingLeft: "10px",
              }}
            >
              <Section
                style={{
                  backgroundColor: "#00D4FF",
                  border: "4px solid #000000",
                  padding: "20px",
                  textAlign: "center",
                }}
              >
                <Text
                  style={{
                    color: "#000000",
                    fontSize: "12px",
                    fontWeight: "900",
                    textTransform: "uppercase",
                    margin: "0 0 10px 0",
                  }}
                >
                  Global Rank
                </Text>
                <Text
                  style={{
                    color: "#000000",
                    fontSize: "48px",
                    fontWeight: "900",
                    lineHeight: "1",
                    margin: "0",
                  }}
                >
                  #{stats.rank}
                </Text>
              </Section>
            </Column>
          </Row>

          <Row style={{ marginBottom: "30px" }}>
            <Column
              style={{
                width: "50%",
                paddingRight: "10px",
              }}
            >
              <Section
                style={{
                  backgroundColor: "#FFE66D",
                  border: "4px solid #000000",
                  padding: "20px",
                  textAlign: "center",
                }}
              >
                <Text
                  style={{
                    color: "#000000",
                    fontSize: "12px",
                    fontWeight: "900",
                    textTransform: "uppercase",
                    margin: "0 0 10px 0",
                  }}
                >
                  Total Reach
                </Text>
                <Text
                  style={{
                    color: "#000000",
                    fontSize: "32px",
                    fontWeight: "900",
                    lineHeight: "1",
                    margin: "0",
                  }}
                >
                  {stats.reach.toLocaleString()}
                </Text>
              </Section>
            </Column>
            <Column
              style={{
                width: "50%",
                paddingLeft: "10px",
              }}
            >
              <Section
                style={{
                  backgroundColor: "#ffffff",
                  border: "4px solid #000000",
                  padding: "20px",
                  textAlign: "center",
                }}
              >
                <Text
                  style={{
                    color: "#000000",
                    fontSize: "12px",
                    fontWeight: "900",
                    textTransform: "uppercase",
                    margin: "0 0 10px 0",
                  }}
                >
                  Total Shares
                </Text>
                <Text
                  style={{
                    color: "#000000",
                    fontSize: "32px",
                    fontWeight: "900",
                    lineHeight: "1",
                    margin: "0",
                  }}
                >
                  {stats.shares}
                </Text>
              </Section>
            </Column>
          </Row>

          {/* Global Progress */}
          <Section
            style={{
              backgroundColor: "#FFE66D",
              border: "4px solid #000000",
              padding: "30px",
              margin: "30px 0",
            }}
          >
            <Text
              style={{
                color: "#000000",
                fontSize: "16px",
                fontWeight: "900",
                textTransform: "uppercase",
                margin: "0 0 15px 0",
              }}
            >
              PROGRESS TOWARD TIPPING POINT
            </Text>
            <div
              style={{
                height: "40px",
                backgroundColor: "#ffffff",
                border: "4px solid #000000",
                borderRadius: "0px",
                overflow: "hidden",
                marginBottom: "10px",
              }}
            >
              <div
                style={{
                  height: "100%",
                  backgroundColor: "#000000",
                  width: `${Math.min(progressPercentage, 100)}%`,
                }}
              />
            </div>
            <Text
              style={{
                color: "#000000",
                fontSize: "14px",
                fontWeight: "bold",
                margin: "0",
              }}
            >
              {globalProgress.current.toFixed(3)}% of global population &bull; {peopleNeeded} more people needed
            </Text>
          </Section>

          {/* Referral Link Section */}
          <Section
            style={{
              backgroundColor: "#00D4FF",
              border: "4px solid #000000",
              padding: "30px",
              margin: "30px 0",
              textAlign: "center",
            }}
          >
            <Text
              style={{
                color: "#000000",
                fontSize: "16px",
                fontWeight: "900",
                textTransform: "uppercase",
                margin: "0 0 20px 0",
              }}
            >
              YOUR REFERRAL LINK
            </Text>
            <ReferralLinkBox referralLink={referralLink} />
            <Text
              style={{
                color: "#000000",
                fontSize: "14px",
                fontWeight: "bold",
                margin: "0 0 20px 0",
              }}
            >
              Share this link to recruit more voters for the referendum!
            </Text>
            <SocialShareButtons referralLink={referralLink} tweetText="Join the movement to optimize governance with evidence-based policy!" />
          </Section>

          <CTAButton href={dashboardLink} margin="40px 0">VIEW FULL DASHBOARD</CTAButton>

          <ResourcePromoSection utmSource="weekly_update" />

          <EmailFooter reason="you opted in to weekly updates" />
        </Container>
      </Body>
    </Html>
  )
}

export default WeeklyUpdateEmail
