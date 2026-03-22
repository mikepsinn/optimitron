import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components"
import * as React from "react"
import { SocialShareButtons } from "./components/SocialShareButtons"
import { ReferralLinkBox } from "./components/ReferralLinkBox"
import { CTAButton } from "./components/CTAButton"
import { getEmailUrls } from "@/lib/email-urls"

interface ReferralMotivationEmailProps {
  userName: string
  currentReferrals: number
  referralLink: string
  topReferrers: Array<{
    rank: number
    name: string
    referrals: number
  }>
}

export const ReferralMotivationEmail = ({
  userName,
  currentReferrals,
  referralLink,
  topReferrers,
}: ReferralMotivationEmailProps) => {
  const { dashboardLink } = getEmailUrls()
  // Impact calculations — from VOTER_LIVES_SAVED (38.4 per voter)
  const livesSavedPerReferral = 38.4
  const potentialLivesWith10 = Math.round(livesSavedPerReferral * 10)
  const currentLivesSaved = Math.round(livesSavedPerReferral * currentReferrals)

  return (
    <Html>
      <Head />
      <Preview>
        {`Your referrals could save hundreds of lives — ${currentReferrals > 0 ? `You've already saved ${currentLivesSaved}!` : "Start today"}`}
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
              color: "#FF6B9D",
              fontSize: "38px",
              fontWeight: "900",
              textAlign: "center",
              textTransform: "uppercase",
              margin: "0 0 20px 0",
              lineHeight: "1.1",
            }}
          >
            EACH REFERRAL SAVES {livesSavedPerReferral} LIVES
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
            (Here's the math, {userName}.)
          </Text>

          {/* Current Impact */}
          {currentReferrals > 0 ? (
            <Section
              style={{
                backgroundColor: "#00D4FF",
                border: "4px solid #000000",
                padding: "25px",
                marginBottom: "20px",
                textAlign: "center",
              }}
            >
              <Text
                style={{
                  color: "#000000",
                  fontSize: "14px",
                  fontWeight: "900",
                  textTransform: "uppercase",
                  margin: "0 0 15px 0",
                }}
              >
                YOUR IMPACT SO FAR
              </Text>
              <Text
                style={{
                  color: "#000000",
                  fontSize: "48px",
                  fontWeight: "900",
                  lineHeight: "1",
                  margin: "0 0 10px 0",
                }}
              >
                {currentLivesSaved}
              </Text>
              <Text
                style={{
                  color: "#000000",
                  fontSize: "16px",
                  fontWeight: "bold",
                  margin: "0",
                }}
              >
                Lives saved through your {currentReferrals} referral{currentReferrals !== 1 ? "s" : ""}
              </Text>
            </Section>
          ) : (
            <Section
              style={{
                backgroundColor: "#FFE66D",
                border: "4px solid #000000",
                padding: "25px",
                marginBottom: "20px",
                textAlign: "center",
              }}
            >
              <Text
                style={{
                  color: "#000000",
                  fontSize: "18px",
                  fontWeight: "900",
                  textTransform: "uppercase",
                  margin: "0 0 15px 0",
                }}
              >
                START YOUR IMPACT TODAY
              </Text>
              <Text
                style={{
                  color: "#000000",
                  fontSize: "16px",
                  fontWeight: "bold",
                  margin: "0",
                  lineHeight: "1.6",
                }}
              >
                You haven't made any referrals yet. Each person you recruit saves ~{livesSavedPerReferral} lives.
                Ready to start?
              </Text>
            </Section>
          )}

          {/* Potential Impact */}
          <Section
            style={{
              backgroundColor: "#FF6B9D",
              border: "4px solid #000000",
              padding: "30px",
              marginBottom: "20px",
            }}
          >
            <Text
              style={{
                color: "#000000",
                fontSize: "18px",
                fontWeight: "900",
                textTransform: "uppercase",
                textAlign: "center",
                margin: "0 0 20px 0",
              }}
            >
              YOUR POTENTIAL
            </Text>

            <div
              style={{
                backgroundColor: "#ffffff",
                border: "3px solid #000000",
                padding: "20px",
                marginBottom: "15px",
                textAlign: "center",
              }}
            >
              <Text
                style={{
                  color: "#000000",
                  fontSize: "16px",
                  fontWeight: "bold",
                  margin: "0 0 10px 0",
                }}
              >
                With just 10 referrals you could save
              </Text>
              <Text
                style={{
                  color: "#FF6B9D",
                  fontSize: "48px",
                  fontWeight: "900",
                  lineHeight: "1",
                  margin: "0 0 5px 0",
                }}
              >
                ~{potentialLivesWith10}
              </Text>
              <Text
                style={{
                  color: "#000000",
                  fontSize: "16px",
                  fontWeight: "bold",
                  margin: "0",
                }}
              >
                lives
              </Text>
            </div>

            <Text
              style={{
                color: "#000000",
                fontSize: "14px",
                fontWeight: "bold",
                textAlign: "center",
                margin: "0",
                lineHeight: "1.6",
              }}
            >
              Each recruit adds {livesSavedPerReferral} lives to the ledger.
              If they each recruit 2 more? Over 1,000 lives from your network alone.
            </Text>
          </Section>

          {/* Global Leaderboard */}
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
                margin: "0 0 20px 0",
              }}
            >
              GLOBAL LEADERBOARD
            </Text>

            {topReferrers.map((referrer) => (
              <div
                key={referrer.rank}
                style={{
                  backgroundColor: "#ffffff",
                  border: "3px solid #000000",
                  padding: "15px 20px",
                  marginBottom: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                  <Text
                    style={{
                      color: "#FF6B9D",
                      fontSize: "24px",
                      fontWeight: "900",
                      margin: "0",
                      minWidth: "40px",
                    }}
                  >
                    #{referrer.rank}
                  </Text>
                  <Text
                    style={{
                      color: "#000000",
                      fontSize: "16px",
                      fontWeight: "bold",
                      margin: "0",
                    }}
                  >
                    {referrer.name}
                  </Text>
                </div>
                <Text
                  style={{
                    color: "#000000",
                    fontSize: "18px",
                    fontWeight: "900",
                    margin: "0",
                  }}
                >
                  {referrer.referrals}
                </Text>
              </div>
            ))}

            <Text
              style={{
                color: "#666666",
                fontSize: "13px",
                fontWeight: "bold",
                textAlign: "center",
                margin: "20px 0 0 0",
              }}
            >
              These recruiters are leading the charge. Can you join them?
            </Text>
          </Section>

          {/* Referral Link */}
          <Section
            style={{
              backgroundColor: "#00D4FF",
              border: "4px solid #000000",
              padding: "30px",
              marginBottom: "30px",
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
              Share this everywhere. Every verified voter earns you a VOTE point.
            </Text>

            <SocialShareButtons
              referralLink={referralLink}
              tweetText={`Each person who votes for the 1% Treaty referendum saves ~${livesSavedPerReferral} lives. Join me:`}
            />
          </Section>

          <CTAButton href={dashboardLink}>VIEW MY DASHBOARD</CTAButton>

          {/* Footer */}
          <Section
            style={{
              borderTop: "2px solid #000000",
              paddingTop: "20px",
              marginTop: "30px",
            }}
          >
            <Text
              style={{
                color: "#000000",
                fontSize: "14px",
                fontWeight: "bold",
                textAlign: "center",
                margin: "0 0 10px 0",
              }}
            >
              Why your referrals matter
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
              We need enough votes to trigger democratic change. Every person you recruit brings
              us closer to optimizing governance with evidence-based policy — redirecting resources
              from waste to what actually works. Your network is your superpower.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export default ReferralMotivationEmail
