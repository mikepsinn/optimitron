import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Text,
} from "@react-email/components"
import * as React from "react"
import { CTAButton } from "./components/CTAButton"
import { EmailFooter } from "./components/EmailFooter"
import { formatParameter } from "@/lib/format-parameter"
import {
  DFDA_QUEUE_CLEARANCE_YEARS,
  DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_LIVES_SAVED,
  STATUS_QUO_QUEUE_CLEARANCE_YEARS,
  VOTER_LIVES_SAVED,
} from "@/lib/parameters-calculations-citations"

const bodyStyle = {
  backgroundColor: "#ffffff",
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
  margin: "0 auto",
  padding: "20px",
}

const containerStyle = {
  margin: "0 auto",
  padding: "0",
  maxWidth: "600px",
}

const textStyle = {
  color: "#000000",
  fontSize: "16px",
  fontWeight: "400",
  lineHeight: "1.6",
  margin: "0 0 16px 0",
}

function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] || name
}

function perVoteLives(): string {
  return formatParameter(VOTER_LIVES_SAVED, { precision: 1 })
}

export function ReferralInviteEmail({
  recipientName,
  senderName,
  messageText,
  surveyUrl,
}: {
  recipientName: string
  senderName: string
  messageText: string
  surveyUrl: string
}) {
  const invitee = firstName(recipientName)

  return (
    <Html>
      <Head />
      <Preview>{`${senderName} wants you to not die of a horrible disease`}</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Text style={textStyle}>Hi {invitee},</Text>
          <Text style={textStyle}>{senderName} asked us to send you this:</Text>
          <Text style={textStyle}>"{messageText}"</Text>
          <CTAButton href={surveyUrl}>Take the 30-second survey</CTAButton>
          <Text style={textStyle}>That's it. 30 seconds. One question. No password. Just verify the vote.</Text>
          <Text style={textStyle}>
            If you're wondering why this matters, the short version: 95% of diseases have zero treatments,
            and redirecting 1% of military spending to clinical trials could fix that in{" "}
            {formatParameter(DFDA_QUEUE_CLEARANCE_YEARS, { precision: 0 })} years instead of{" "}
            {formatParameter(STATUS_QUO_QUEUE_CLEARANCE_YEARS, { precision: 0 })}. The math is at
            manual.warondisease.org if you want to check it.
          </Text>
          <Text style={textStyle}>— warondisease.org</Text>
          <EmailFooter reason={`${senderName} asked us to send you one 1% Treaty survey invitation`} />
        </Container>
      </Body>
    </Html>
  )
}

export function ReferralRecipientNudgeEmail({
  recipientName,
  senderName,
  surveyUrl,
  step,
}: {
  recipientName: string
  senderName: string
  surveyUrl: string
  step: 2 | 3 | 4
}) {
  const invitee = firstName(recipientName)
  const final = step === 4

  return (
    <Html>
      <Head />
      <Preview>{final ? "Last one. 30 seconds. Then we stop." : "This is technically a chain letter."}</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          {step === 2 && (
            <>
              <Text style={textStyle}>Hi {invitee},</Text>
              <Text style={textStyle}>
                Three days ago, {senderName} asked you to take a 30-second survey about redirecting 1% of
                military spending to clinical trials.
              </Text>
              <Text style={textStyle}>
                You haven't taken it yet, which is fine. But statistically, you or someone you love will get a
                disease with no available treatment. That part isn't fine.
              </Text>
              <CTAButton href={surveyUrl}>30 seconds</CTAButton>
            </>
          )}
          {step === 3 && (
            <>
              <Text style={textStyle}>Hi {invitee},</Text>
              <Text style={textStyle}>
                The old chain letters threatened 7 years of bad luck if you broke the chain. If this chain
                breaks, you and everyone you love will suffer and die of curable diseases. Which is also bad luck.
              </Text>
              <Text style={textStyle}>
                The difference: this one is free, takes 30 seconds, and the threat is not a superstition. It is
                an epidemiological fact.
              </Text>
              <CTAButton href={surveyUrl}>30 seconds</CTAButton>
              <Text style={textStyle}>
                {senderName} asked us to send this because they care about you. We'll stop emailing after this if
                you don't respond.
              </Text>
            </>
          )}
          {step === 4 && (
            <>
              <Text style={textStyle}>{invitee},</Text>
              <Text style={textStyle}>{senderName} loves you and asked us to ask you one more time.</Text>
              <Text style={textStyle}>30 seconds. One question. Then we stop.</Text>
              <CTAButton href={surveyUrl}>warondisease.org</CTAButton>
            </>
          )}
          <Text style={textStyle}>— warondisease.org</Text>
          <EmailFooter reason={`${senderName} asked us to send you a 1% Treaty survey invitation`} />
        </Container>
      </Body>
    </Html>
  )
}

export function VoteConfirmedImpactEmail({
  dashboardUrl,
  sharedDuringFlow = false,
}: {
  dashboardUrl: string
  sharedDuringFlow?: boolean
}) {
  return (
    <Html>
      <Head />
      <Preview>Vote counted. Here's what it's worth.</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Text style={textStyle}>Your vote for the 1% Treaty was verified.</Text>
          <Text style={textStyle}>What that means, if the treaty passes:</Text>
          <Text style={textStyle}>
            1 human lifetime of suffering prevented. {perVoteLives()} lives saved.
          </Text>
          <Text style={textStyle}>
            That's your share of{" "}
            {formatParameter(DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_LIVES_SAVED, { compact: true, precision: 1 })} deaths
            prevented, divided across a majority of humans on Earth.
          </Text>
          <CTAButton href={dashboardUrl}>See your dashboard</CTAButton>
          {sharedDuringFlow && (
            <Text style={textStyle}>
              If you shared with anyone during the flow, their status is on your dashboard. We'll email you the
              moment any of them vote.
            </Text>
          )}
          <Text style={textStyle}>— warondisease.org</Text>
          <EmailFooter reason="you verified your 1% Treaty vote" />
        </Container>
      </Body>
    </Html>
  )
}

export function ReferralConfirmedEmail({
  recipientName,
  confirmedLives,
  pendingLives,
  dashboardUrl,
}: {
  recipientName: string
  confirmedLives: string
  pendingLives: string
  dashboardUrl: string
}) {
  return (
    <Html>
      <Head />
      <Preview>{`${firstName(recipientName)} just voted`}</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Text style={textStyle}>{firstName(recipientName)} voted for the 1% Treaty.</Text>
          <Text style={textStyle}>+{perVoteLives()} lives confirmed. +1 lifetime of suffering prevented.</Text>
          <Text style={textStyle}>
            Your Inverse Kills Score:
            <br />
            Confirmed: {confirmedLives}
            <br />
            Pending: {pendingLives}
          </Text>
          <CTAButton href={dashboardUrl}>See your dashboard</CTAButton>
          <Text style={textStyle}>— warondisease.org</Text>
          <EmailFooter reason="you asked us to notify you when your invitees vote" />
        </Container>
      </Body>
    </Html>
  )
}

export function SendOneMoreNudgeEmail({
  sentCount,
  votedCount,
  confirmedLives,
  pendingLives,
  sendUrl,
  step,
}: {
  sentCount: number
  votedCount: number
  confirmedLives: string
  pendingLives: string
  sendUrl: string
  step: 1 | 2
}) {
  const pendingCount = Math.max(0, sentCount - votedCount)

  return (
    <Html>
      <Head />
      <Preview>{step === 1 ? "One more?" : `Still ${pendingCount} pending`}</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          {step === 1 ? (
            <>
              <Text style={textStyle}>You messaged {sentCount} people. {votedCount} of them have voted so far.</Text>
              <Text style={textStyle}>The chain continues past round 2 only if someone keeps going.</Text>
              <CTAButton href={sendUrl}>Send to one more</CTAButton>
              <Text style={textStyle}>Your Inverse Kills Score: {confirmedLives} confirmed, {pendingLives} pending.</Text>
            </>
          ) : (
            <>
              <Text style={textStyle}>{pendingCount} of your {sentCount} referrals haven't voted yet.</Text>
              <Text style={textStyle}>You can't make them. But you can send to one more person and improve your odds.</Text>
              <CTAButton href={sendUrl}>Send to one more</CTAButton>
            </>
          )}
          <Text style={textStyle}>— warondisease.org</Text>
          <EmailFooter reason="you asked us to nudge you to send to one more person" />
        </Container>
      </Body>
    </Html>
  )
}

export function NoShareReengagementEmail({ sendUrl }: { sendUrl: string }) {
  return (
    <Html>
      <Head />
      <Preview>You voted but didn't tell anyone.</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Text style={textStyle}>
            You voted for the 1% Treaty yesterday. That's worth {perVoteLives()} lives and 1 lifetime of suffering
            prevented.
          </Text>
          <Text style={textStyle}>But only if the chain keeps going. Right now your vote is a fact with no momentum.</Text>
          <Text style={textStyle}>It takes 15 seconds to send to one person. The message is already written for you.</Text>
          <CTAButton href={sendUrl}>Tell one person</CTAButton>
          <Text style={textStyle}>— warondisease.org</Text>
          <EmailFooter reason="you verified your 1% Treaty vote" />
        </Container>
      </Body>
    </Html>
  )
}

export function MonthlyScorecardEmail({
  totalLives,
  confirmedLives,
  confirmedLifetimes,
  pendingLives,
  pendingNames,
  sentCount,
  votedCount,
  downstreamSharedCount,
  chainDepth,
  dashboardUrl,
}: {
  totalLives: string
  confirmedLives: string
  confirmedLifetimes: number
  pendingLives: string
  pendingNames: string[]
  sentCount: number
  votedCount: number
  downstreamSharedCount: number
  chainDepth: number
  dashboardUrl: string
}) {
  const waitingText = pendingNames.length > 0 ? pendingNames.join(", ") : "nobody"

  return (
    <Html>
      <Head />
      <Preview>{`Your Inverse Kills Score: ${totalLives} lives`}</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Text style={textStyle}>Monthly update:</Text>
          <Text style={textStyle}>
            Confirmed: {confirmedLives} lives saved, {confirmedLifetimes} lifetimes of suffering prevented
            <br />
            Pending: {pendingLives} lives, waiting on {waitingText}
            <br />
            Your referral chain: {sentCount} people you sent to → {votedCount} of them voted → {downstreamSharedCount} of
            those shared further
          </Text>
          <Text style={textStyle}>Total chain depth from you: {chainDepth} rounds</Text>
          <CTAButton href={dashboardUrl}>See full dashboard</CTAButton>
          <Text style={textStyle}>The chain only breaks if one human says "later."</Text>
          <Text style={textStyle}>— warondisease.org</Text>
          <EmailFooter reason="you asked us to keep you updated on your 1% Treaty referral chain" />
        </Container>
      </Body>
    </Html>
  )
}
