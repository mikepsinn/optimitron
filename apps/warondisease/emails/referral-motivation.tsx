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
import { GLOBAL_REGISTERED_VOTERS } from "@/lib/parameters-calculations-citations"
import { formatParameter } from "@/lib/format-parameter"

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
  const stupidQuestionsUrl = "https://warondisease.org/stupid-questions"
  const targetHumans = formatParameter(GLOBAL_REGISTERED_VOTERS)

  return (
    <Html>
      <Head />
      <Preview>
        {`Did you find the flaw? Nobody has yet — ${currentReferrals > 0 ? `${currentReferrals} people joined through you!` : "Share the 20 stupid questions with your smartest friends."}`}
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
            DID YOU FIND THE FLAW?
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
            Nobody has yet, {userName}. Here's where we stand.
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
                🎯 YOUR IMPACT SO FAR
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
                {currentReferrals}
              </Text>
              <Text
                style={{
                  color: "#000000",
                  fontSize: "16px",
                  fontWeight: "bold",
                  margin: "0",
                }}
              >
                people who came through your link
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
                🔍 NOBODY HAS FOUND THE FLAW
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
                Hundreds of people have read the 20 questions. None have found a "no" yet. Have you shared
                them with your 10 smartest friends?
              </Text>
            </Section>
          )}

          {/* Stupid Questions CTA */}
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
              🤔 THE CHALLENGE
            </Text>
            <Text
              style={{
                color: "#000000",
                fontSize: "16px",
                fontWeight: "bold",
                textAlign: "center",
                margin: "0 0 15px 0",
                lineHeight: "1.6",
              }}
            >
              If someone smarter than me can answer "no" to any of these 20 questions, I'll know the plan
              doesn't work.
            </Text>
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
              If nobody can, then the only thing preventing disease eradication is that not enough humans
              have read them yet. Share them with your smartest friends and let them try.
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
              🏆 TOP QUESTION SHARERS
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
              These people are spreading the questions. Can you join them?
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
              🔗 SHARE THE STUPID QUESTIONS
            </Text>

            <ReferralLinkBox referralLink={stupidQuestionsUrl} />

            <Text
              style={{
                color: "#000000",
                fontSize: "14px",
                fontWeight: "bold",
                margin: "0 0 20px 0",
              }}
            >
              Your referral link is still tracked below — every person who reads the questions and joins
              counts toward your impact.
            </Text>

            <ReferralLinkBox referralLink={referralLink} />

            <SocialShareButtons
              referralLink={stupidQuestionsUrl}
              tweetText="Can you find the flaw in these 20 questions? Nobody has yet. If you can't find a no, share with your smartest friends:"
            />
          </Section>

          <CTAButton href={stupidQuestionsUrl}>SHARE THE STUPID QUESTIONS</CTAButton>

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
              Why it matters
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
              We need {targetHumans} humans to read and agree with these questions to reach a majority of humans
              on Earth. The math works. We just need more humans to see it. Your network is the path.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export default ReferralMotivationEmail
