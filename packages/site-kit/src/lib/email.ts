/** Default no-op email for site apps. Warondisease overrides via local lib/email.ts */

type EmailResult = { success: true; data: { id: string } } | { success: false; error: string }

const ok = (): EmailResult => ({ success: true, data: { id: "site-kit-no-email" } })

export async function sendSignupConfirmationEmail(_args: {
  to: string
  url: string
  userName?: string
  orgName?: string
}): Promise<EmailResult> {
  return ok()
}

export async function sendVoteConfirmedImpactEmail(_args: Record<string, unknown>): Promise<EmailResult> {
  return ok()
}

export async function sendPartnerWelcomeEmail(_args: Record<string, unknown>): Promise<EmailResult> {
  return ok()
}

export async function sendPartnerRejectionEmail(_args: Record<string, unknown>): Promise<EmailResult> {
  return ok()
}

export async function sendDonationThankYouEmail(_args: Record<string, unknown>): Promise<EmailResult> {
  return ok()
}

export async function sendReferralConfirmedEmail(_args: Record<string, unknown>): Promise<EmailResult> {
  return ok()
}

export async function sendReferralInviteEmail(_args: Record<string, unknown>): Promise<EmailResult> {
  return ok()
}

export async function sendWeeklyUpdate(_args: Record<string, unknown>): Promise<EmailResult> {
  return ok()
}

export async function sendWelcomeImpactEmail(_args: Record<string, unknown>): Promise<EmailResult> {
  return ok()
}

export async function sendReferralMotivationEmail(_args: Record<string, unknown>): Promise<EmailResult> {
  return ok()
}

export async function sendReferralRecipientNudgeEmail(_args: Record<string, unknown>): Promise<EmailResult> {
  return ok()
}

export async function sendSendOneMoreNudgeEmail(_args: Record<string, unknown>): Promise<EmailResult> {
  return ok()
}

export async function sendNoShareReengagementEmail(_args: Record<string, unknown>): Promise<EmailResult> {
  return ok()
}

export async function sendMonthlyScorecardEmail(_args: Record<string, unknown>): Promise<EmailResult> {
  return ok()
}

export async function sendCampaignPledgeEmail(_args: Record<string, unknown>): Promise<EmailResult> {
  return ok()
}

export async function sendCampaignUpdateEmail(_args: Record<string, unknown>): Promise<EmailResult> {
  return ok()
}
