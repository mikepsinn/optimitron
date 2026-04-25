import {
  DFDA_QUEUE_CLEARANCE_YEARS,
  STATUS_QUO_QUEUE_CLEARANCE_YEARS,
  TREATY_REDUCTION_PCT,
} from "@optimitron/data/parameters";
import { getReferralInvitationFirstName, type ReferralInvitationMessageFormat } from "@/lib/referral-invitation-copy";
import {
  FLOW_DISEASES_WITHOUT_EFFECTIVE_TREATMENT_PCT,
  FLOW_NUCLEAR_WINTER_OVERKILL_FACTOR,
  formatFlowWords,
} from "@/lib/treaty-share-flow-parameters";

export const REFERRAL_INVITATION_RECIPIENT_MAX_STEP = 4;
export type ReferralInvitationRecipientEmailStep = 1 | 2 | 3 | 4;

const statusQuoQueueYearsText = formatFlowWords(STATUS_QUO_QUEUE_CLEARANCE_YEARS, 3);
const dfdaQueueYearsText = formatFlowWords(DFDA_QUEUE_CLEARANCE_YEARS, 2);
const diseaseWithoutTreatmentPctText = formatFlowWords(
  FLOW_DISEASES_WITHOUT_EFFECTIVE_TREATMENT_PCT,
  2,
);
const treatyReductionPctText = formatFlowWords(TREATY_REDUCTION_PCT, 1);
const nuclearOverkillText = formatFlowWords(FLOW_NUCLEAR_WINTER_OVERKILL_FACTOR, 3);
const treatyImpactManualUrl =
  DFDA_QUEUE_CLEARANCE_YEARS.manualPageUrl ??
  DFDA_QUEUE_CLEARANCE_YEARS.calculationsUrl ??
  "https://manual.warondisease.org";

interface ReferralInvitationRecipientEmailInput {
  inviteUrl: string;
  messageFormat: ReferralInvitationMessageFormat;
  recipientName: string;
  senderName: string;
  step: ReferralInvitationRecipientEmailStep;
  unsubscribeUrl?: string | null;
}

interface ReferralInvitationEmailMessage {
  html: string;
  subject: string;
  text: string;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buttonText(label: string, url: string) {
  return `[BUTTON: ${label} → ${url}]`;
}

function renderHtml(text: string, inviteUrl: string, label: string, unsubscribeUrl?: string | null) {
  const manualHost = "manual.warondisease.org";
  const manualLink = `<a href="${escapeHtml(treatyImpactManualUrl)}" style="color:#111827;font-weight:800;">${manualHost}</a>`;
  const escaped = escapeHtml(text)
    .replaceAll(manualHost, manualLink)
    .replace(/\n/g, "<br />")
    .replace(escapeHtml(buttonText(label, inviteUrl)), "");

  return [
    `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;color:#111827;">`,
    `<p>${escaped}</p>`,
    `<p><a href="${escapeHtml(inviteUrl)}" style="display:inline-block;background:#111827;color:#ffffff;padding:12px 16px;text-decoration:none;font-weight:800;text-transform:uppercase;">${escapeHtml(label)}</a></p>`,
    unsubscribeUrl
      ? `<p style="font-size:12px;color:#4b5563;">No guilt trip: <a href="${escapeHtml(unsubscribeUrl)}" style="color:#111827;">unsubscribe from this invite</a>.</p>`
      : "",
    `</div>`,
  ].join("");
}

function taskEmail(input: ReferralInvitationRecipientEmailInput): Omit<ReferralInvitationEmailMessage, "html"> & { buttonLabel: string } {
  const recipient = getReferralInvitationFirstName(input.recipientName) || input.recipientName;

  if (input.step === 1) {
    return {
      subject: "[OVERDUE] Task assigned to you: End War and Disease",
      buttonLabel: "COMPLETE TASK",
      text: [
        "⚠️ **[OVERDUE] End War and Disease**",
        "",
        "TASK: End War and Disease",
        `ASSIGNED BY: ${input.senderName}`,
        `STATUS: Overdue (by approximately ${statusQuoQueueYearsText} years)`,
        "PRIORITY: Critical",
        "ESTIMATED TIME: 30 seconds",
        "ACTION REQUIRED: Vote on the 1% Treaty",
        "",
        buttonText("COMPLETE TASK", input.inviteUrl),
        "",
        `NOTE: This task was originally due several centuries ago but kept getting deprioritized in favor of building ${nuclearOverkillText} apocalypses worth of nuclear weapons. Management apologizes for the delay.`,
        "",
        "— The Humanity Project Management System",
      ].join("\n"),
    };
  }

  if (input.step === 2) {
    return {
      subject: 'REMINDER: Task "End War and Disease" is still incomplete',
      buttonLabel: "COMPLETE TASK",
      text: [
        "⚠️ **TASK OVERDUE — 3 DAYS**",
        "",
        "TASK: End War and Disease",
        `ASSIGNED BY: ${input.senderName}`,
        "STATUS: Incomplete",
        "ESTIMATED TIME: 30 seconds",
        `DAYS OVERDUE: 3 (plus the original ${statusQuoQueueYearsText} years)`,
        "",
        buttonText("COMPLETE TASK", input.inviteUrl),
        "",
        `Your project manager (${input.senderName}) has been notified of this delay. They seem disappointed. Not angry, just disappointed.`,
        "",
        "— The Humanity Project Management System",
      ].join("\n"),
    };
  }

  if (input.step === 3) {
    return {
      subject: 'ESCALATION: Task "End War and Disease" flagged for review',
      buttonLabel: "COMPLETE TASK",
      text: [
        "⚠️ **TASK ESCALATED**",
        "",
        "TASK: End War and Disease",
        `ASSIGNED BY: ${input.senderName}`,
        "STATUS: Blocked (by you)",
        `DAYS OVERDUE: 7 (plus the original ${statusQuoQueueYearsText} years)`,
        `BLOCKER: ${recipient} has not clicked a button`,
        "",
        "This task has been escalated to your project manager (all of humanity). Continued inaction may result in you and everyone you love suffering and dying of curable diseases.",
        "",
        "This is technically a chain letter. The old ones threatened 7 years of bad luck. This one threatens the above, which is also bad luck.",
        "",
        buttonText("COMPLETE TASK", input.inviteUrl),
        "",
        "We'll stop sending task reminders after this if you don't respond.",
        "",
        "— The Humanity Project Management System",
      ].join("\n"),
    };
  }

  return {
    subject: 'Task "End War and Disease" will be reassigned',
    buttonLabel: "COMPLETE TASK",
    text: [
      `${recipient},`,
      "",
      "Final notice. Task will be reassigned to someone who prefers not dying of a curable disease.",
      "",
      buttonText("COMPLETE TASK", input.inviteUrl),
      "",
      "— The Humanity Project Management System",
    ].join("\n"),
  };
}

function sincereEmail(input: ReferralInvitationRecipientEmailInput): Omit<ReferralInvitationEmailMessage, "html"> & { buttonLabel: string } {
  const recipient = getReferralInvitationFirstName(input.recipientName) || input.recipientName;

  if (input.step === 1) {
    return {
      subject: `${input.senderName} wants you to not die of a horrible disease`,
      buttonLabel: "Take the 30-second survey",
      text: [
        `Hi ${recipient},`,
        "",
        `${input.senderName} asked us to send you this:`,
        "",
        '"I love you very much and I don\'t want you to get a horrible disease and die. Could you please take 30 seconds to respond to this stupid survey in order to end war and disease?"',
        "",
        buttonText("Take the 30-second survey", input.inviteUrl),
        "",
        "That's it. 30 seconds. One question. No account required.",
        "",
        `If you're wondering why this matters, the short version: ${diseaseWithoutTreatmentPctText} of diseases have zero treatments, and redirecting ${treatyReductionPctText} of military spending to clinical trials could fix that in ${dfdaQueueYearsText} years instead of ${statusQuoQueueYearsText}. The math is at manual.warondisease.org if you want to check it.`,
        "",
        "— warondisease.org",
      ].join("\n"),
    };
  }

  if (input.step === 2) {
    return {
      subject: `${input.senderName} is still hoping you don't die`,
      buttonLabel: "30 seconds",
      text: [
        `Hi ${recipient},`,
        "",
        `Three days ago, ${input.senderName} asked you to take a 30-second survey about redirecting 1% of military spending to clinical trials.`,
        "",
        "You haven't taken it yet, which is fine. But statistically, you or someone you love will get a disease with no available treatment. That part isn't fine.",
        "",
        buttonText("30 seconds", input.inviteUrl),
        "",
        "— warondisease.org",
      ].join("\n"),
    };
  }

  if (input.step === 3) {
    return {
      subject: "This is technically a chain letter",
      buttonLabel: "30 seconds",
      text: [
        `Hi ${recipient},`,
        "",
        "The old chain letters threatened 7 years of bad luck if you broke the chain. If this chain breaks, you and everyone you love will suffer and die of curable diseases. Which is also bad luck.",
        "",
        "The difference: this one is free, takes 30 seconds, and the threat is not a superstition. It is an epidemiological fact.",
        "",
        buttonText("30 seconds", input.inviteUrl),
        "",
        `${input.senderName} asked us to send this because they care about you. We'll stop emailing after this if you don't respond.`,
        "",
        "— warondisease.org",
      ].join("\n"),
    };
  }

  return {
    subject: "Last one",
    buttonLabel: "warondisease.org",
    text: [
      `${recipient},`,
      "",
      `${input.senderName} loves you and asked us to ask you one more time.`,
      "",
      "30 seconds. One question. Then we stop.",
      "",
      buttonText("warondisease.org", input.inviteUrl),
      "",
      "— warondisease.org",
    ].join("\n"),
  };
}

export function buildReferralInvitationRecipientEmail(
  input: ReferralInvitationRecipientEmailInput,
): ReferralInvitationEmailMessage {
  const built =
    input.messageFormat === "TASK_NOTIFICATION"
      ? taskEmail(input)
      : sincereEmail(input);

  return {
    subject: built.subject,
    text: input.unsubscribeUrl
      ? `${built.text}\n\nUnsubscribe from this invite: ${input.unsubscribeUrl}`
      : built.text,
    html: renderHtml(built.text, input.inviteUrl, built.buttonLabel, input.unsubscribeUrl),
  };
}

export function getReferralInvitationRecipientDelayDays(
  step: ReferralInvitationRecipientEmailStep,
): number {
  if (step === 1) return 0;
  if (step === 2) return 3;
  if (step === 3) return 7;
  return 14;
}
