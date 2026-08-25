import { EMAIL_CONFIG } from "./constants";
import { getResendClient } from "./email-utils";
import { env } from "./env";
import { getSiteConfig, getSiteVariant } from "./site-config";

/** Shared email delivery for site apps. Non-auth campaign emails remain app-owned. */

type EmailResult =
  | { success: true; data: { id: string } }
  | { success: false; error: string };

const ok = (): EmailResult => ({
  success: true,
  data: { id: "site-kit-no-email" },
});

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getVerificationCopy(orgName: string) {
  const variant = getSiteVariant();

  if (variant === "warondisease.org") {
    return {
      subject: "Action needed: verify your vote",
      intro: "Thanks for completing the survey!",
      instruction:
        "Please confirm your submission by clicking the button below:",
      action: "Confirm My Submission",
      pending: "Your submission won't be counted until you confirm.",
    };
  }

  if (variant === "trialabundancesurvey.org") {
    return {
      subject: "Confirm your survey submission",
      intro: "Thanks for completing the survey!",
      instruction: "Confirm your submission by clicking the button below:",
      action: "Confirm My Submission",
      pending: "Your submission won't be counted until you confirm.",
    };
  }

  return {
    subject: `Sign in to ${orgName}`,
    intro: `Thanks for visiting ${orgName}.`,
    instruction: "Continue by clicking the button below:",
    action: "Continue",
    pending: "This link signs you in securely.",
  };
}

function renderVerificationEmail({
  url,
  userName,
  orgName,
  primaryColor,
}: {
  url: string;
  userName?: string;
  orgName: string;
  primaryColor: string;
}) {
  const copy = getVerificationCopy(orgName);
  const safeUrl = escapeHtml(url);
  const safeOrgName = escapeHtml(orgName);
  const safeUserName = userName ? escapeHtml(userName) : "";
  const greeting = safeUserName ? `Hi ${safeUserName},` : "Hi there,";

  const html = `<!doctype html>
<html lang="en">
  <body style="background:#fff;color:#000;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;margin:0;padding:40px 20px">
    <main style="margin:0 auto;max-width:600px">
      <p style="font-size:16px;line-height:1.6;margin:0 0 20px">${greeting}</p>
      <p style="font-size:16px;line-height:1.6;margin:0 0 20px">${escapeHtml(copy.intro)}</p>
      <p style="font-size:16px;line-height:1.6;margin:0 0 30px">${escapeHtml(copy.instruction)}</p>
      <p style="margin:0 0 20px;text-align:center">
        <a href="${safeUrl}" style="background:${escapeHtml(primaryColor)};border:2px solid #000;color:#fff;display:inline-block;font-size:16px;font-weight:700;padding:12px 24px;text-decoration:none">${escapeHtml(copy.action)}</a>
      </p>
      <p style="color:#666;font-size:12px;margin:0 0 30px;text-align:center">This link expires in 24 hours.</p>
      <p style="font-size:14px;line-height:1.6;margin:0 0 30px">${escapeHtml(copy.pending)}</p>
      <p style="border-top:1px solid #ddd;color:#666;font-size:12px;line-height:1.6;margin:0;padding-top:20px">If you didn't request this email, you can ignore it.<br>${safeOrgName}</p>
    </main>
  </body>
</html>`;

  const text = `${greeting}\n\n${copy.intro}\n\n${copy.instruction}\n${url}\n\nThis link expires in 24 hours.\n\n${copy.pending}\n\nIf you didn't request this email, you can ignore it.\n${orgName}`;

  return { ...copy, html, text };
}

export async function sendSignupConfirmationEmail({
  to,
  url,
  userName,
  orgName,
}: {
  to: string;
  url: string;
  userName?: string;
  orgName?: string;
}): Promise<EmailResult> {
  const resend = getResendClient();
  if (!resend) {
    throw new Error("Verification email service is not configured");
  }

  const config = getSiteConfig();
  const resolvedOrgName = orgName || config.emailBranding.orgName;
  const email = renderVerificationEmail({
    url,
    userName,
    orgName: resolvedOrgName,
    primaryColor: config.emailBranding.primaryColor,
  });
  const fromAddress =
    env.EMAIL_FROM_ADDRESS || EMAIL_CONFIG.DEFAULT_FROM_ADDRESS;

  const { data, error } = await resend.emails.send({
    from: `${config.emailBranding.fromName} <${fromAddress}>`,
    to,
    subject: email.subject,
    html: email.html,
    text: email.text,
  });

  if (error) {
    throw new Error("Verification email provider rejected the request", {
      cause: error,
    });
  }
  if (!data?.id) {
    throw new Error("Verification email provider returned no message ID");
  }

  return { success: true, data: { id: data.id } };
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
