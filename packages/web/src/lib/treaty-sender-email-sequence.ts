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
  sendUrl?: string;
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

export function buildTreatyVoteConfirmedEmail(input: TreatySenderEmailBaseInput = {}): TreatySenderEmailMessage {
  const dashboardUrl = input.dashboardUrl ?? "https://warondisease.org/dashboard";
  const body = [
    "Your vote for the 1% Treaty was verified.",
    "",
    "What that means, if the treaty passes:",
    `**1 human lifetime of suffering prevented. ${voterLivesText} lives saved.**`,
    "",
    `That's your share of ${totalLivesText} deaths prevented, divided across ${majorityHumanityPhrase}.`,
    "",
    buttonText("See your dashboard", dashboardUrl),
    "",
    "If you shared with anyone during the flow, their status is on your dashboard. We'll email you the moment any of them vote.",
    "",
    "— warondisease.org",
  ].join("\n");

  return buildMessage({
    buttonLabel: "See your dashboard",
    buttonUrl: dashboardUrl,
    subject: "Vote counted. Here's what it's worth.",
    text: body,
    unsubscribeUrl: input.unsubscribeUrl,
  });
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

export function buildTreatySendOneMoreNudgeEmail(input: TreatySenderEmailBaseInput & {
  confirmedLives: string;
  pendingLives: string;
  sentCount: number;
  votedCount: number;
}): TreatySenderEmailMessage {
  const sendUrl = input.sendUrl ?? "https://warondisease.org/send";
  const body = [
    `You messaged ${input.sentCount} people. ${input.votedCount} of them have voted so far.`,
    "",
    "The chain continues past round 2 only if someone keeps assigning the next Earth optimization task.",
    "",
    buttonText("Assign one more Earth optimization task", sendUrl),
    "",
    `Your Inverse Kills Score: **${input.confirmedLives} confirmed, ${input.pendingLives} pending.**`,
    "",
    "— warondisease.org",
  ].join("\n");

  return buildMessage({
    buttonLabel: "Assign one more overdue task",
    buttonUrl: sendUrl,
    subject: "One more?",
    text: body,
    unsubscribeUrl: input.unsubscribeUrl,
  });
}

export function buildTreatySecondSenderNudgeEmail(input: TreatySenderEmailBaseInput & {
  pendingCount: number;
  sentCount: number;
}): TreatySenderEmailMessage {
  const sendUrl = input.sendUrl ?? "https://warondisease.org/send";
  const body = [
    `${input.pendingCount} of your ${input.sentCount} referrals haven't voted yet.`,
    "",
    "You can't make them. But you can assign one more Earth optimization task and improve your odds.",
    "",
    buttonText("Assign one more overdue task", sendUrl),
    "",
    "— warondisease.org",
  ].join("\n");

  return buildMessage({
    buttonLabel: "Assign one more overdue task",
    buttonUrl: sendUrl,
    subject: `Still ${input.pendingCount} pending`,
    text: body,
    unsubscribeUrl: input.unsubscribeUrl,
  });
}

export function buildTreatyMonthlyScorecardEmail(input: TreatySenderEmailBaseInput & {
  chainDepth: number;
  confirmedLifetimeCount: string;
  confirmedLives: string;
  pendingLives: string;
  pendingNames: string;
  sharedFurtherCount: number;
  sentCount: number;
  totalLives: string;
  votedCount: number;
}): TreatySenderEmailMessage {
  const dashboardUrl = input.dashboardUrl ?? "https://warondisease.org/dashboard";
  const body = [
    "Monthly update:",
    "",
    `**Confirmed:** ${input.confirmedLives} lives saved, ${input.confirmedLifetimeCount} lifetimes of suffering prevented`,
    `**Pending:** ${input.pendingLives} lives, waiting on ${input.pendingNames}`,
    `**Your referral chain:** ${input.sentCount} people you sent to → ${input.votedCount} of them voted → ${input.sharedFurtherCount} of those shared further`,
    "",
    `Total chain depth from you: ${input.chainDepth} rounds`,
    "",
    buttonText("See full dashboard", dashboardUrl),
    "",
    "The chain only breaks if one human says \"later.\"",
    "",
    "— warondisease.org",
  ].join("\n");

  return buildMessage({
    buttonLabel: "See full dashboard",
    buttonUrl: dashboardUrl,
    subject: `Your Inverse Kills Score: ${input.totalLives} lives`,
    text: body,
    unsubscribeUrl: input.unsubscribeUrl,
  });
}

export function buildTreatyNeverSharedReengagementEmail(input: TreatySenderEmailBaseInput = {}): TreatySenderEmailMessage {
  const sendUrl = input.sendUrl ?? "https://warondisease.org/send";
  const body = [
    `You voted for the 1% Treaty yesterday. That's worth ${voterLivesText} lives and 1 lifetime of suffering prevented.`,
    "",
    "But only if the chain keeps going. Right now your vote is a fact with no momentum.",
    "",
    "It takes 15 seconds to assign one task. The message is already written for you.",
    "",
    buttonText("Assign one task", sendUrl),
    "",
    "— warondisease.org",
  ].join("\n");

  return buildMessage({
    buttonLabel: "Assign one task",
    buttonUrl: sendUrl,
    subject: "You voted but didn't tell anyone",
    text: body,
    unsubscribeUrl: input.unsubscribeUrl,
  });
}
