import { render } from "@react-email/render"
import { DonationThankYouEmail } from "@/emails/donation-thank-you"
import { WeeklyUpdateEmail } from "@/emails/weekly-update"
import { CampaignPledgeEmail } from "@/emails/campaign-pledge"
import { CampaignUpdateEmail } from "@/emails/campaign-update"
import { SignupConfirmationEmail } from "@/emails/signup-confirmation"
import { PartnerApprovalEmail } from "@/emails/partner-approval"
import { PartnerRejectionEmail } from "@/emails/partner-rejection"
import { WelcomeImpactEmail } from "@/emails/welcome-impact"
import { ReferralMotivationEmail } from "@/emails/referral-motivation"
import {
  MonthlyScorecardEmail,
  NoShareReengagementEmail,
  ReferralConfirmedEmail,
  ReferralInviteEmail,
  ReferralRecipientNudgeEmail,
  SendOneMoreNudgeEmail,
  VoteConfirmedImpactEmail,
} from "@/emails/referral-sequence"
import { getBrandedEmailFrom, getResendClient } from "@/lib/email-utils"
import { getSiteConfig, getEmail } from "@/lib/site-config"
import { env } from "@/lib/env"
import { createLogger } from "@/lib/logger"

const log = createLogger("email")

export async function sendDonationThankYouEmail({
  to,
  donorName,
  amount,
  donationType,
  donationDate,
}: {
  to: string
  donorName?: string
  amount: number
  donationType: "one-time" | "monthly"
  donationDate: string
}) {
  const resend = getResendClient()
  if (!resend) {
    console.warn("RESEND_API_KEY not configured, skipping email send")
    return { success: false, error: "Email service not configured" }
  }

  try {
    const emailHtml = await render(
      DonationThankYouEmail({
        donorName,
        amount,
        donationType,
        donationDate,
      })
    )

    const result = await resend.emails.send({
      from: getBrandedEmailFrom(),
      to,
      subject: "Thank you for joining the war on disease! 🎉",
      html: emailHtml,
    })

    return { success: true, data: result }
  } catch (error) {
    console.error("Failed to send donation thank you email:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

export async function sendWeeklyUpdate({
  to,
  userName,
  userEmail,
  stats,
  referralLink,
  globalProgress,
}: {
  to: string
  userName: string
  userEmail: string
  stats: {
    referrals: number
    newReferrals: number
    rank: number
    shares: number
    reach: number
  }
  referralLink: string
  globalProgress: {
    current: number
    target: number
  }
}) {
  const resend = getResendClient()
  if (!resend) {
    console.warn("RESEND_API_KEY not configured, skipping email send")
    return { success: false, error: "Email service not configured" }
  }

  try {
    const emailHtml = await render(
      WeeklyUpdateEmail({
        userName,
        userEmail,
        stats,
        referralLink,
        globalProgress,
      })
    )

    const newReferrals = stats.newReferrals
    const subject = newReferrals > 0
      ? `🎉 Your Weekly Update: +${newReferrals} New Referral${newReferrals > 1 ? 's' : ''}!`
      : "📊 Your Weekly War on Disease Update"

    const result = await resend.emails.send({
      from: getBrandedEmailFrom(),
      to,
      subject,
      html: emailHtml,
    })

    return { success: true, data: result }
  } catch (error) {
    console.error("Failed to send weekly update email:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

// Campaign pledge confirmation email (sent to backer)
export async function sendCampaignPledgeEmail({
  to,
  backerName,
  campaignTitle,
  pledgeAmount,
  currency,
  rewardTitle,
  campaignSlug,
}: {
  to: string
  backerName?: string
  campaignTitle: string
  pledgeAmount: number
  currency: string
  rewardTitle?: string
  campaignSlug: string
}) {
  const resend = getResendClient()
  if (!resend) {
    console.warn("RESEND_API_KEY not configured, skipping email send")
    return { success: false, error: "Email service not configured" }
  }

  try {
    const emailHtml = await render(
      CampaignPledgeEmail({
        backerName,
        campaignTitle,
        pledgeAmount,
        currency,
        rewardTitle,
        campaignSlug,
      })
    )

    const result = await resend.emails.send({
      from: getBrandedEmailFrom(),
      to,
      subject: `Thank you for backing ${campaignTitle}! 🚀`,
      html: emailHtml,
    })

    return { success: true, data: result }
  } catch (error) {
    console.error("Failed to send campaign pledge email:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

// Campaign update notification (sent to backers)
export async function sendCampaignUpdateEmail({
  to,
  backerName,
  campaignTitle,
  updateTitle,
  updatePreview,
  campaignSlug,
}: {
  to: string
  backerName?: string
  campaignTitle: string
  updateTitle: string
  updatePreview: string
  campaignSlug: string
}) {
  const resend = getResendClient()
  if (!resend) {
    console.warn("RESEND_API_KEY not configured, skipping email send")
    return { success: false, error: "Email service not configured" }
  }

  try {
    const emailHtml = await render(
      CampaignUpdateEmail({
        backerName,
        campaignTitle,
        updateTitle,
        updatePreview,
        campaignSlug,
      })
    )

    const result = await resend.emails.send({
      from: getBrandedEmailFrom(),
      to,
      subject: `Update from ${campaignTitle}: ${updateTitle}`,
      html: emailHtml,
    })

    return { success: true, data: result }
  } catch (error) {
    console.error("Failed to send campaign update email:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

// Signup confirmation email (magic link for email verification)
export async function sendSignupConfirmationEmail({
  to,
  url,
  userName,
  orgName,
}: {
  to: string
  url: string
  userName?: string
  orgName?: string
}) {
  const resend = getResendClient()
  if (!resend) {
    console.warn("RESEND_API_KEY not configured, skipping email send")
    return { success: false, error: "Email service not configured" }
  }

  const config = getSiteConfig()
  const { fromName } = config.emailBranding


  try {
    const emailHtml = await render(
      SignupConfirmationEmail({
        userName,
        url,
        orgName,
      })
    )

    // Build the dynamic "from" address
    // If env.EMAIL_FROM_ADDRESS is set, the result is "Branding Name <address>"
    const fromAddress = env.EMAIL_FROM_ADDRESS || getEmail()
    const from = `${fromName} <${fromAddress}>`

    const result = await resend.emails.send({
      from,
      to,
      subject: "Action needed: verify your vote",
      html: emailHtml,
    })


    return { success: true, data: result }
  } catch (error) {
    console.error("Failed to send signup confirmation email:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

// Partner welcome email (sent immediately when organization is created)
export async function sendPartnerWelcomeEmail({
  to,
  organizationName,
  slug,
  contactName,
}: {
  to: string
  organizationName: string
  slug: string
  contactName?: string
}) {
  const resend = getResendClient()
  if (!resend) {
    console.warn("RESEND_API_KEY not configured, skipping email send")
    return { success: false, error: "Email service not configured" }
  }

  try {
    const emailHtml = await render(
      PartnerApprovalEmail({
        organizationName,
        slug,
        contactName,
      })
    )

    const result = await resend.emails.send({
      from: getBrandedEmailFrom(),
      to,
      subject: `You're live! Start sharing your ${organizationName} survey`,
      html: emailHtml,
    })

    return { success: true, data: result }
  } catch (error) {
    console.error("Failed to send partner welcome email:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

// Partner rejection notification email
export async function sendPartnerRejectionEmail({
  to,
  organizationName,
  contactName,
  reason,
}: {
  to: string
  organizationName: string
  contactName?: string
  reason?: string
}) {
  const resend = getResendClient()
  if (!resend) {
    console.warn("RESEND_API_KEY not configured, skipping email send")
    return { success: false, error: "Email service not configured" }
  }

  try {
    const emailHtml = await render(
      PartnerRejectionEmail({
        organizationName,
        contactName,
        reason,
      })
    )

    const result = await resend.emails.send({
      from: getBrandedEmailFrom(),
      to,
      subject: `Update on your partner application for ${organizationName}`,
      html: emailHtml,
    })

    return { success: true, data: result }
  } catch (error) {
    console.error("Failed to send partner rejection email:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

// Welcome + Impact email (Email 1 - sent immediately after email verification)
export async function sendWelcomeImpactEmail({
  to,
  userName,
  referralLink,
}: {
  to: string
  userName: string
  referralLink: string
}) {
  const resend = getResendClient()
  if (!resend) {
    console.warn("RESEND_API_KEY not configured, skipping email send")
    return { success: false, error: "Email service not configured" }
  }

  const config = getSiteConfig()
  const { fromName, orgName, primaryColor } = config.emailBranding


  try {
    const emailHtml = await render(
      WelcomeImpactEmail({
        userName,
        referralLink,
        orgName: orgName === "The War on Disease" ? "WAR ON DISEASE" : orgName, // Special case for legacy DIH branding style
        primaryColor,
      })
    )

    // Build the dynamic "from" address
    const fromAddress = env.EMAIL_FROM_ADDRESS || getEmail()
    const from = `${fromName} <${fromAddress}>`

    const result = await resend.emails.send({
      from,
      to,
      subject: "Your vote is confirmed — here's your impact 🎯",
      html: emailHtml,
    })


    return { success: true, data: result }
  } catch (error) {
    console.error("Failed to send welcome impact email:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

// Referral Motivation email (Email 3 - sent 3-5 days after email verification)
export async function sendReferralMotivationEmail({
  to,
  userName,
  currentReferrals,
  referralLink,
  topReferrers,
}: {
  to: string
  userName: string
  currentReferrals: number
  referralLink: string
  topReferrers: Array<{
    rank: number
    name: string
    referrals: number
  }>
}) {
  const resend = getResendClient()
  if (!resend) {
    console.warn("RESEND_API_KEY not configured, skipping email send")
    return { success: false, error: "Email service not configured" }
  }

  try {
    const emailHtml = await render(
      ReferralMotivationEmail({
        userName,
        currentReferrals,
        referralLink,
        topReferrers,
      })
    )

    const subject = currentReferrals > 0
      ? `🎯 Your ${currentReferrals} referrals saved ~${Math.round(currentReferrals * 1.49)} lives`
      : "⚡ Your time is worth $17M/hour (really)"

    const result = await resend.emails.send({
      from: getBrandedEmailFrom(),
      to,
      subject,
      html: emailHtml,
    })

    return { success: true, data: result }
  } catch (error) {
    console.error("Failed to send referral motivation email:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

function getWarOnDiseaseFrom(senderName?: string): string {
  const fromAddress = env.EMAIL_FROM_ADDRESS || getEmail()
  return senderName ? `${senderName} via War on Disease <${fromAddress}>` : getBrandedEmailFrom()
}

export async function sendReferralInviteEmail({
  to,
  recipientName,
  senderName,
  messageText,
  surveyUrl,
}: {
  to: string
  recipientName: string
  senderName: string
  messageText: string
  surveyUrl: string
}) {
  const resend = getResendClient()
  if (!resend) {
    log.warn("RESEND_API_KEY not configured, skipping referral invite email")
    return { success: false, error: "Email service not configured" }
  }

  try {
    const emailHtml = await render(
      ReferralInviteEmail({
        recipientName,
        senderName,
        messageText,
        surveyUrl,
      })
    )

    const result = await resend.emails.send({
      from: getWarOnDiseaseFrom(senderName),
      to,
      subject: `${senderName} wants you to not die of a horrible disease`,
      html: emailHtml,
    })

    return { success: true, data: result }
  } catch (error) {
    log.error("Failed to send referral invite email", { error })
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

export async function sendReferralRecipientNudgeEmail({
  to,
  recipientName,
  senderName,
  surveyUrl,
  step,
}: {
  to: string
  recipientName: string
  senderName: string
  surveyUrl: string
  step: 2 | 3 | 4
}) {
  const resend = getResendClient()
  if (!resend) {
    log.warn("RESEND_API_KEY not configured, skipping referral recipient nudge email")
    return { success: false, error: "Email service not configured" }
  }

  const subjects = {
    2: `${senderName} is still hoping you don't die`,
    3: "This is technically a chain letter",
    4: "Last one",
  } as const

  try {
    const emailHtml = await render(
      ReferralRecipientNudgeEmail({
        recipientName,
        senderName,
        surveyUrl,
        step,
      })
    )

    const result = await resend.emails.send({
      from: getWarOnDiseaseFrom(),
      to,
      subject: subjects[step],
      html: emailHtml,
    })

    return { success: true, data: result }
  } catch (error) {
    log.error("Failed to send referral recipient nudge email", { error, step })
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

export async function sendVoteConfirmedImpactEmail({
  to,
  dashboardUrl,
}: {
  to: string
  dashboardUrl: string
}) {
  const resend = getResendClient()
  if (!resend) {
    log.warn("RESEND_API_KEY not configured, skipping vote confirmed impact email")
    return { success: false, error: "Email service not configured" }
  }

  try {
    const emailHtml = await render(VoteConfirmedImpactEmail({ dashboardUrl }))
    const result = await resend.emails.send({
      from: getWarOnDiseaseFrom(),
      to,
      subject: "Vote counted. Here's what it's worth.",
      html: emailHtml,
    })
    return { success: true, data: result }
  } catch (error) {
    log.error("Failed to send vote confirmed impact email", { error })
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

export async function sendReferralConfirmedEmail({
  to,
  recipientName,
  confirmedLives,
  pendingLives,
  dashboardUrl,
}: {
  to: string
  recipientName: string
  confirmedLives: string
  pendingLives: string
  dashboardUrl: string
}) {
  const resend = getResendClient()
  if (!resend) {
    log.warn("RESEND_API_KEY not configured, skipping referral confirmed email")
    return { success: false, error: "Email service not configured" }
  }

  try {
    const emailHtml = await render(
      ReferralConfirmedEmail({
        recipientName,
        confirmedLives,
        pendingLives,
        dashboardUrl,
      })
    )
    const result = await resend.emails.send({
      from: getWarOnDiseaseFrom(),
      to,
      subject: `${recipientName} just voted`,
      html: emailHtml,
    })
    return { success: true, data: result }
  } catch (error) {
    log.error("Failed to send referral confirmed email", { error })
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

export async function sendSendOneMoreNudgeEmail({
  to,
  sentCount,
  votedCount,
  confirmedLives,
  pendingLives,
  sendUrl,
  step,
}: {
  to: string
  sentCount: number
  votedCount: number
  confirmedLives: string
  pendingLives: string
  sendUrl: string
  step: 1 | 2
}) {
  const resend = getResendClient()
  if (!resend) {
    log.warn("RESEND_API_KEY not configured, skipping send-one-more nudge email")
    return { success: false, error: "Email service not configured" }
  }

  try {
    const emailHtml = await render(
      SendOneMoreNudgeEmail({
        sentCount,
        votedCount,
        confirmedLives,
        pendingLives,
        sendUrl,
        step,
      })
    )
    const result = await resend.emails.send({
      from: getWarOnDiseaseFrom(),
      to,
      subject: step === 1 ? "One more?" : `Still ${Math.max(0, sentCount - votedCount)} pending`,
      html: emailHtml,
    })
    return { success: true, data: result }
  } catch (error) {
    log.error("Failed to send send-one-more nudge email", { error, step })
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

export async function sendNoShareReengagementEmail({
  to,
  sendUrl,
}: {
  to: string
  sendUrl: string
}) {
  const resend = getResendClient()
  if (!resend) {
    log.warn("RESEND_API_KEY not configured, skipping no-share reengagement email")
    return { success: false, error: "Email service not configured" }
  }

  try {
    const emailHtml = await render(NoShareReengagementEmail({ sendUrl }))
    const result = await resend.emails.send({
      from: getWarOnDiseaseFrom(),
      to,
      subject: "You voted but didn't tell anyone",
      html: emailHtml,
    })
    return { success: true, data: result }
  } catch (error) {
    log.error("Failed to send no-share reengagement email", { error })
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

export async function sendMonthlyScorecardEmail({
  to,
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
  to: string
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
  const resend = getResendClient()
  if (!resend) {
    log.warn("RESEND_API_KEY not configured, skipping monthly scorecard email")
    return { success: false, error: "Email service not configured" }
  }

  try {
    const emailHtml = await render(
      MonthlyScorecardEmail({
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
      })
    )
    const result = await resend.emails.send({
      from: getWarOnDiseaseFrom(),
      to,
      subject: `Your Inverse Kills Score: ${totalLives} lives`,
      html: emailHtml,
    })
    return { success: true, data: result }
  } catch (error) {
    log.error("Failed to send monthly scorecard email", { error })
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}
