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
import {
  VOTER_LIVES_SAVED,
  TREATY_CAMPAIGN_VOTING_BLOC_TARGET,
  fmtRaw,
} from "@optimitron/data/parameters"

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
  const livesSavedPerReferral = VOTER_LIVES_SAVED.value
  const currentLivesSaved = Math.round(livesSavedPerReferral * currentReferrals)

  return (
    <Html>
      <Head />
      <Preview>
        {`The Earth Optimization Game is growing. ${currentReferrals > 0 ? `Your crew: ${currentReferrals} players, ~${currentLivesSaved} lives saved.` : "Your crew: 0. That's fixable."}`}
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
            YOUR FRIENDS ARE PLAYING. ARE YOU?
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
            Hello {userName}. I have a progress report. Try not to make that face.
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
                Estimated lives saved because you talked to {currentReferrals} of your friends like a normal person
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
                YOU HAVEN&apos;T TOLD ANYONE YET
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
                Each friend who votes adds roughly {livesSavedPerReferral} lives to the ledger. Two text messages.
                That&apos;s the whole game. On my planet, toddlers manage this level of social coordination.
              </Text>
            </Section>
          )}

          {/* How the chain works */}
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
              HOW THE CHAIN WORKS
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
                  lineHeight: "1.6",
                }}
              >
                You tell 2. They tell 2.
              </Text>
              <Text
                style={{
                  color: "#FF6B9D",
                  fontSize: "36px",
                  fontWeight: "900",
                  lineHeight: "1",
                  margin: "0 0 5px 0",
                }}
              >
                {fmtRaw(TREATY_CAMPAIGN_VOTING_BLOC_TARGET.value).toUpperCase()}

              </Text>
              <Text
                style={{
                  color: "#000000",
                  fontSize: "16px",
                  fontWeight: "bold",
                  margin: "0",
                }}
              >
                players = tipping point
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
              After 10 rounds: 1,024 players. After 28 rounds: {fmtRaw(TREATY_CAMPAIGN_VOTING_BLOC_TARGET.value)}. Your species already
              turns out at 50-65% for elections that pay nothing. This one takes 30 seconds on a phone
              and the outcome is &quot;less death.&quot; The participation barrier is not motivation. It&apos;s that
              nobody&apos;s told them yet. That&apos;s your job.
            </Text>
          </Section>

          {/* Top Players */}
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
              TOP PLAYERS
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
              These players have brought the most friends into the game. On my planet we call them &quot;slightly less oblivious than average.&quot;
            </Text>
          </Section>

          {/* Share Link */}
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
              YOUR LINK
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
              Share with two people who&apos;d prefer being alive. That&apos;s a low bar but I&apos;ve learned not to assume with your species.
            </Text>

            <SocialShareButtons
              referralLink={referralLink}
              tweetText={`Each vote for the 1% Treaty saves ~${livesSavedPerReferral} lives. 30 seconds on a phone:`}
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
              Why this matters
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
              Every friend who votes makes the democratic signal louder. Your governments will notice
              eventually. They&apos;re slow but not technically plants. — Wishonia
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export default ReferralMotivationEmail
