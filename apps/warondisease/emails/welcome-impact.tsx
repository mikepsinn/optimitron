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
import { CTAButton } from "./components/CTAButton"
import type { Parameter } from "@/lib/parameters-calculations-citations"
import {
  DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_ECONOMIC_VALUE,
  GLOBAL_REGISTERED_VOTERS,
  HOURS_PER_YEAR,
  VOTER_LIVES_SAVED,
  VOTER_SUFFERING_HOURS_PREVENTED,
} from "@/lib/parameters-calculations-citations"
import { formatParameter } from "@/lib/format-parameter"

interface WelcomeImpactEmailProps {
  userName: string
  referralLink: string
  orgName?: string
  primaryColor?: string
}

export const WelcomeImpactEmail = ({
  userName,
  referralLink: _referralLink,
  orgName = "WAR ON DISEASE",
  primaryColor = "#FF6B9D",
}: WelcomeImpactEmailProps) => {
  const stupidQuestionsUrl = "https://warondisease.org/stupid-questions"
  const livesSavedValue = VOTER_LIVES_SAVED.value
  const sufferingHoursValue = VOTER_SUFFERING_HOURS_PREVENTED.value
  const livesSaved = `${livesSavedValue.toFixed(1)} lives`
  const hoursSuffering = formatParameter(
    { value: sufferingHoursValue, unit: "hours" } satisfies Parameter,
    { precision: 1 },
  )
  const sufferingYears = formatParameter(
    { value: sufferingHoursValue / HOURS_PER_YEAR.value, unit: "years" } satisfies Parameter,
    { precision: 0 },
  )
  const economicValue = formatParameter(
    {
      value: DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_ECONOMIC_VALUE.value / GLOBAL_REGISTERED_VOTERS.value,
      unit: "USD",
    } satisfies Parameter,
    { precision: 0 },
  )
  const targetHumans = formatParameter(GLOBAL_REGISTERED_VOTERS)

  return (
    <Html>
      <Head />
      <Preview>
        {`Your vote is confirmed — here's your impact: ${livesSaved} lives saved, ${hoursSuffering} hours of suffering prevented!`}
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
            WELCOME TO THE
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
            {orgName}
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
            Hey {userName}! Your vote is confirmed. Here's the impact you just made:
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
              🎯 YOUR SINGLE VOTE JUST:
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
                    {hoursSuffering}
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
                    Hours of Suffering Prevented
                  </Text>
                  <Text
                    style={{
                      color: "#666666",
                      fontSize: "12px",
                      fontWeight: "bold",
                      margin: "5px 0 0 0",
                    }}
                  >
                    (~{sufferingYears} years!)
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

          {/* Find the Flaw */}
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
              🔍 CAN YOU FIND THE FLAW?
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
              I made a list of 20 stupid questions. If someone smarter than me can answer "no" to any of
              them, I'll know the plan doesn't work.
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
              If nobody can, then the only thing preventing disease eradication is that not enough humans
              have read them yet. Can you find the flaw? If you can't, share them with your 10 smartest
              friends.
            </Text>
          </Section>

          <CTAButton href={stupidQuestionsUrl}>READ THE 20 STUPID QUESTIONS</CTAButton>

          {/* Go Deeper - Book/Podcast Cross-Promotion */}
          <ManualPromoSection utmSource="welcome_email" />

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
              Your vote is now counted toward a majority of humans on Earth. When we reach {targetHumans} humans,
              we'll have the democratic mandate to make suffering optional through pragmatic clinical trials.
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
              Every person who reads and passes on the questions brings us closer. Let's end preventable death together.
            </Text>
          </Section>

          <EmailFooter reason="you voted in the War on Disease" />
        </Container>
      </Body>
    </Html>
  )
}

export default WelcomeImpactEmail
