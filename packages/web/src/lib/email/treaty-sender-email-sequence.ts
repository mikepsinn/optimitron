import {
  FLOW_TOTAL_LIVES_SAVED,
  FLOW_VOTER_LIVES_SAVED_ROUNDED,
  formatFlowWords,
} from "@/lib/treaty-share-flow-parameters";

interface TreatySenderEmailMessage {
  html: string;
  subject: string;
  text: string;
}

interface TreatySenderEmailBaseInput {
  dashboardUrl?: string;
  unsubscribeUrl?: string | null;
}

const voterLivesText = formatFlowWords(FLOW_VOTER_LIVES_SAVED_ROUNDED, 2);
const totalLivesText = formatFlowWords(FLOW_TOTAL_LIVES_SAVED, 3);
const majorityHumanityPhrase = "a majority of humans on Earth";
const treatyImpactManualUrl =
  FLOW_TOTAL_LIVES_SAVED.manualPageUrl ??
  FLOW_TOTAL_LIVES_SAVED.calculationsUrl ??
  "https://manual.warondisease.org";

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

function renderHtml(text: string, buttonUrl: string, buttonLabel: string, unsubscribeUrl?: string | null) {
  const escapedButton = escapeHtml(buttonText(buttonLabel, buttonUrl));
  const linkedPhrases = [
    `${totalLivesText} deaths prevented`,
    `${voterLivesText} lives`,
    majorityHumanityPhrase,
  ];
  const impactLinkHref = escapeHtml(treatyImpactManualUrl);
  const escaped = linkedPhrases
    .reduce((html, phrase) => {
      const escapedPhrase = escapeHtml(phrase);
      return html.replaceAll(
        escapedPhrase,
        `<a href="${impactLinkHref}" style="color:#111827;font-weight:800;">${escapedPhrase}</a>`,
      );
    }, escapeHtml(text))
    .replace(/\n/g, "<br />")
    .replace(escapedButton, "");

  return [
    `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;color:#111827;">`,
    `<p>${escaped}</p>`,
    `<p><a href="${escapeHtml(buttonUrl)}" style="display:inline-block;background:#111827;color:#ffffff;padding:12px 16px;text-decoration:none;font-weight:800;text-transform:uppercase;">${escapeHtml(buttonLabel)}</a></p>`,
    unsubscribeUrl
      ? `<p style="font-size:12px;color:#4b5563;">No guilt trip: <a href="${escapeHtml(unsubscribeUrl)}" style="color:#111827;">unsubscribe</a>.</p>`
      : "",
    `</div>`,
  ].join("");
}

function buildMessage(input: {
  buttonLabel: string;
  buttonUrl: string;
  subject: string;
  text: string;
  unsubscribeUrl?: string | null;
}): TreatySenderEmailMessage {
  return {
    html: renderHtml(input.text, input.buttonUrl, input.buttonLabel, input.unsubscribeUrl),
    subject: input.subject,
    text: input.unsubscribeUrl
      ? `${input.text}\n\nUnsubscribe: ${input.unsubscribeUrl}`
      : input.text,
  };
}

export function buildTreatyRecipientVotedEmail(input: TreatySenderEmailBaseInput & {
  confirmedLives: string;
  messageFormat?: "TASK_NOTIFICATION" | "SINCERE";
  pendingLives: string;
  recipientName: string;
}): TreatySenderEmailMessage {
  const dashboardUrl = input.dashboardUrl ?? "https://warondisease.org/dashboard";
  const subject =
    input.messageFormat === "TASK_NOTIFICATION"
      ? `${input.recipientName} completed their task.`
      : `${input.recipientName} just voted`;
  const body = [
    `${input.recipientName} voted for the 1% Treaty.`,
    "",
    `**+${voterLivesText} lives confirmed. +1 lifetime of suffering prevented.**`,
    "",
    "Your Inverse Kills Score:",
    `Confirmed: **${input.confirmedLives} lives**`,
    `Pending: **${input.pendingLives} lives**`,
    "",
    buttonText("See your dashboard", dashboardUrl),
    "",
    "— warondisease.org",
  ].join("\n");

  return buildMessage({
    buttonLabel: "See your dashboard",
    buttonUrl: dashboardUrl,
    subject,
    text: body,
    unsubscribeUrl: input.unsubscribeUrl,
  });
}
