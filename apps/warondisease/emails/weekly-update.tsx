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
import { ManualPromoSection } from "./components/ManualPromoSection"
import { EmailFooter } from "./components/EmailFooter"
import { SocialShareButtons } from "./components/SocialShareButtons"
import { ReferralLinkBox } from "./components/ReferralLinkBox"
import { CTAButton } from "./components/CTAButton"
import { getEmailUrls } from "@/lib/email-urls"
import type { Parameter } from "@/lib/parameters-calculations-citations"
import { GLOBAL_REGISTERED_VOTERS } from "@/lib/parameters-calculations-citations"
import { formatParameter } from "@/lib/format-parameter"

interface WeeklyUpdateEmailProps {
  userName: string
  userEmail: string
  stats: {
    referrals: number
    newReferrals: number // New this week
    rank: number
    shares: number
    reach: number
  }
  referralLink: string
  globalProgress: {
    current: number // e.g., 0.001
    target: number // majority-of-humanity target as percent of global population
  }
}

export const WeeklyUpdateEmail = ({
  userName,
  userEmail: _userEmail,
  stats,
  referralLink,
  globalProgress,
}: WeeklyUpdateEmailProps) => {
  const { dashboardLink } = getEmailUrls()
  const progressPercentage = (globalProgress.current / globalProgress.target) * 100
  const targetHumans = formatParameter(GLOBAL_REGISTERED_VOTERS)
  const progressRatio = globalProgress.target > 0 ? globalProgress.current / globalProgress.target : 0
  const peopleNeeded = formatParameter(
    {
      value: Math.max(0, Math.round(GLOBAL_REGISTERED_VOTERS.value * (1 - progressRatio))),
      unit: "people",
    } satisfies Parameter,
    { compact: false },
  )

  return (
    <Html>
      <Head />
      <Preview>
        Your Weekly War on Disease Update - {stats.newReferrals > 0 ? `+${stats.newReferrals} new referrals!` : "Keep sharing!"}
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
            COMMAND REPORT
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
            Hey {userName}! Here's your impact in the War on Disease this week.
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
                    ↑ +{stats.newReferrals} this week!
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
              🎯 PROGRESS TOWARD {targetHumans} HUMANS
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
              {globalProgress.current.toFixed(3)}% of global population • {peopleNeeded} more people needed
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
              🔗 YOUR REFERRAL LINK
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
              Share this link so more people can vote in the war on disease!
            </Text>
            <SocialShareButtons referralLink={referralLink} tweetText="Join me in the War on Disease!" />
          </Section>

          <CTAButton href={dashboardLink} margin="40px 0">VIEW FULL DASHBOARD</CTAButton>

          {/* Go Deeper - Manual/Podcast Cross-Promotion */}
          <ManualPromoSection
            utmSource="weekly_email"
            description="An alien wrote 300 pages on how to point everyone's greed at diseases instead of each other."
          />

          <EmailFooter reason="you opted in to weekly updates" />
        </Container>
      </Body>
    </Html>
  )
}

export default WeeklyUpdateEmail
