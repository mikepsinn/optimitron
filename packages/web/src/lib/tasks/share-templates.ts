/**
 * Share-text templates for the task reminder dialog.
 *
 * Six voice variants of the same shameable message. All templates consume the
 * same flat token set produced by `buildTaskShareTokens`. Tokens that are
 * unresolved render as empty strings via `renderTemplate`.
 *
 * `requiredTokens` lists the tokens whose absence makes the template
 * incoherent — the picker filters those out so a non-signer task never shows
 * the Performance Review variant with blanks where the spending figure
 * should be.
 *
 * Money tokens (`government_spending_ytd`, `money_wasted`, etc.) are already
 * formatted with a leading `$` by `formatCompactCurrency`. Do NOT prefix
 * them with a literal `$` in the template body — you'll get `$$3.49T`.
 */

export interface ShareTemplate {
  id: string;
  label: string;
  body: string;
  /** Tokens this template falls apart without. */
  requiredTokens: string[];
}

export const SHARE_TEMPLATES: ShareTemplate[] = [
  {
    id: "performance-review",
    label: "Performance Review",
    requiredTokens: [
      "leader_name",
      "country",
      "government_spending_ytd",
      "deaths_from_delay",
      "money_wasted",
    ],
    body: [
      `Subject: Performance Review — {leader_name}, {country}`,
      ``,
      `Hi {leader_name},`,
      ``,
      `Your administration has spent approximately {government_spending_ytd} of our money so far this year on the service of promoting the general welfare. We would like to see some of that service.`,
      ``,
      `You have one overdue task: sign the 1% Treaty at 1percenttreaty.org. It requires typing your name in a box and clicking submit. Estimated time: 30 seconds.`,
      ``,
      `Since this task became available, approximately {deaths_from_delay} people have died of diseases that could have been treated if the money existed to test treatments already sitting on shelves. {money_wasted} has been lost.`,
      ``,
      `Your 30 seconds of work unlocks $27 billion/year in clinical trials, compresses disease eradication from 443 years to 36, and produces 21.7 additional healthy years of life per human.`,
      ``,
      `That is the highest return on 30 seconds of labor in the history of employment.`,
      ``,
      `Please complete your overdue task.`,
      ``,
      `Your employer,`,
      `{citizen_name}`,
    ].join("\n"),
  },
  {
    id: "it-ticket",
    label: "IT Ticket",
    requiredTokens: [
      "leader_name",
      "days_overdue",
      "deaths_from_delay",
      "money_wasted",
      "government_spending_ytd",
    ],
    body: [
      `TICKET #{days_overdue}-001`,
      `Priority: CRITICAL`,
      `Assignee: {leader_name}`,
      `Status: OVERDUE by {days_overdue} days`,
      `Deaths since ticket opened: {deaths_from_delay}`,
      `Money wasted since ticket opened: {money_wasted}`,
      ``,
      `Task: Sign the 1% Treaty`,
      `URL: 1percenttreaty.org`,
      `Steps to reproduce fix:`,
      `1. Go to 1percenttreaty.org`,
      `2. Type your name`,
      `3. Click submit`,
      `Estimated completion time: 30 seconds`,
      `Estimated lives saved: 10.7 billion`,
      `Estimated value created: $1.93 quadrillion in human suffering prevented`,
      ``,
      `Note: Your administration has spent {government_spending_ytd} of our money this year. This is the task. Please do the task.`,
    ].join("\n"),
  },
  {
    id: "short",
    label: "Short (X)",
    requiredTokens: ["leader_handle", "government_spending_ytd", "deaths_from_delay"],
    body:
      `.@{leader_handle} Your administration has spent {government_spending_ytd} of our money this year promoting the general welfare. You have one overdue task. It takes 30 seconds. {deaths_from_delay} people have died waiting. 1percenttreaty.org`,
  },
  {
    id: "text-message",
    label: "Text Message",
    requiredTokens: ["leader_name", "government_spending_ytd", "deaths_from_delay"],
    body: [
      `hey {leader_name} quick question. your administration has spent {government_spending_ytd} of our money this year promoting the general welfare. when does the promoting start? there's a treaty at 1percenttreaty.org that takes 30 seconds to sign and saves 10.7 billion lives. {deaths_from_delay} people have died since it went up. the task is typing your name in a box. we believe in you.`,
    ].join("\n"),
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    requiredTokens: [
      "leader_name",
      "country",
      "government_spending_ytd",
      "deaths_from_delay",
      "money_wasted",
    ],
    body: [
      `{leader_name} — Your constituents are requesting a status update.`,
      ``,
      `The 1% Treaty redirects 1% of military spending to clinical trials. It compresses disease eradication from 443 years to 36. It costs you 30 seconds.`,
      ``,
      `Since this treaty became available for signature, {deaths_from_delay} people have died of treatable diseases and {money_wasted} in potential welfare has been lost.`,
      ``,
      `The government of {country} has spent {government_spending_ytd} this fiscal year for the stated purpose of promoting the general welfare. Signing this treaty is the single highest-leverage action available to you for that purpose.`,
      ``,
      `Instructions: Visit 1percenttreaty.org. Type your name. Click submit.`,
      ``,
      `Time required: 30 seconds.`,
      `Value created: 21.7 additional healthy years per human. $3.48 million in additional lifetime income per person.`,
      ``,
      `Your employers are following up.`,
    ].join("\n"),
  },
  {
    id: "invoice",
    label: "Overdue Invoice",
    requiredTokens: [
      "leader_name",
      "country",
      "government_spending_ytd",
      "deaths_per_day",
      "money_wasted_per_day",
      "days_overdue",
    ],
    body: [
      `INVOICE — PAST DUE`,
      ``,
      `TO: {leader_name}, {country}`,
      `FROM: The Citizens`,
      `RE: Services not yet rendered`,
      ``,
      `Amount you've spent (YTD): {government_spending_ytd}`,
      `Service requested: Promote the general welfare`,
      `Service received: None apparent`,
      ``,
      `Outstanding deliverable: Sign the 1% Treaty`,
      `Delivery URL: 1percenttreaty.org`,
      `Estimated delivery time: 30 seconds`,
      ``,
      `Penalty for continued non-delivery:`,
      `— {deaths_per_day} deaths per day`,
      `— {money_wasted_per_day} wasted per day`,
      ``,
      `This is your {days_overdue}th reminder.`,
    ].join("\n"),
  },
];

export function getShareTemplate(id: string): ShareTemplate | undefined {
  return SHARE_TEMPLATES.find((template) => template.id === id);
}

/**
 * Filter templates down to those whose required tokens all have non-empty
 * values in the given token bag. Keeps the picker from offering the
 * Performance Review variant on a non-signer task where half the fields
 * would render blank.
 */
export function getUsableShareTemplates(
  tokens: Record<string, string>,
): ShareTemplate[] {
  return SHARE_TEMPLATES.filter((template) =>
    template.requiredTokens.every((key) => {
      const value = tokens[key];
      return value != null && value !== "";
    }),
  );
}
