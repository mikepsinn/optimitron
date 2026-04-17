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

/**
 * All token keys produced by `buildTaskShareTokens`. Keep in sync with that
 * function — the test suite verifies completeness.
 */
export type ShareTokenKey =
  | "citizen_name"
  | "country"
  | "days_overdue"
  | "deaths_from_delay"
  | "deaths_per_day"
  | "government_spending_ytd"
  | "leader_handle"
  | "leader_name"
  | "mil_budget_pct"
  | "mil_synonym"
  | "mil_to_trials_ratio"
  | "money_wasted"
  | "money_wasted_per_day"
  | "task_title"
  | "treaty_url"
  | "trials_budget_pct";

export interface ShareTemplate {
  id: string;
  label: string;
  body: string;
  /** Tokens this template falls apart without. */
  requiredTokens: ShareTokenKey[];
}

export const SHARE_TEMPLATES: ShareTemplate[] = [
  {
    id: "polite-reminder",
    label: "Polite Reminder",
    requiredTokens: [
      "leader_name",
      "days_overdue",
      "deaths_per_day",
      "money_wasted_per_day",
      "deaths_from_delay",
    ],
    body: [
      `Hi {leader_name},`,
      ``,
      `Friendly reminder — the 1% Treaty is still unsigned. Day {days_overdue}.`,
      ``,
      `The task: sign at {treaty_url}. Type your name, click submit. 30 seconds.`,
      ``,
      `The math: humanity has 120 apocalypses worth of mass murder capacity. The treaty reduces this to 118.8 in exchange for 12.3× clinical trial capacity — compressing disease eradication from 443 years to 36. You can only have one apocalypse. 118.8 is functionally indistinguishable from 120. The trade is rational.`,
      ``,
      `While it sits unsigned: {deaths_per_day} die per day waiting for treatments. {money_wasted_per_day} per day — each day late pushes the eradication finish line one day later. {deaths_from_delay} dead since the treaty went up.`,
      ``,
      `Please sign it. This is the easiest task on your desk.`,
    ].join("\n"),
  },
  {
    id: "performance-review",
    label: "Performance Review",
    requiredTokens: [
      "leader_name",
      "country",
      "government_spending_ytd",
      "days_overdue",
      "deaths_from_delay",
      "money_wasted",
      "mil_to_trials_ratio",
      "trials_budget_pct",
    ],
    body: [
      `PERFORMANCE REVIEW — {leader_name}, {country}`,
      ``,
      `Budget consumed (YTD): {government_spending_ytd}`,
      `Stated purpose: "Promote the general welfare"`,
      `Welfare promoted: None detected`,
      ``,
      `There is a treaty at {treaty_url}. It moves 1% of military spending to clinical trials. It compresses disease eradication from 443 years to 36. It takes 30 seconds to sign.`,
      ``,
      "Since it went up, {deaths_from_delay} people have died waiting for cures. {money_wasted} is the bill for pushing the eradication finish line back {days_overdue} days. {country} spends ${mil_to_trials_ratio} on {mil_synonym} for every $1 on clinical trials. That's {trials_budget_pct} of the combined budget going to finding out which medicines work.",
      ``,
      `The task is typing your name in a box.`,
      ``,
      `Regards,`,
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
      `TICKET #{days_overdue}-001 — CRITICAL`,
      `Assignee: {leader_name}`,
      `Status: OVERDUE ({days_overdue} days)`,
      `Casualties since ticket opened: {deaths_from_delay}`,
      `Budget burned since ticket opened: {money_wasted}`,
      ``,
      `Task: Sign the 1% Treaty`,
      `Steps: 1) Go to {treaty_url} 2) Type name 3) Click submit`,
      `ETA: 30 seconds`,
      ``,
      `Impact if resolved: Disease eradication compressed from 443 years to 36. 21.7 additional healthy years per human. $3.48M additional lifetime income per person.`,
      ``,
      `Impact if unresolved: {deaths_from_delay} dead so far. Number goes up daily.`,
      ``,
      `Admin has spent {government_spending_ytd} this year. This is the task. Please do the task.`,
    ].join("\n"),
  },
  {
    id: "short",
    label: "Short (X)",
    requiredTokens: ["leader_handle", "government_spending_ytd", "deaths_from_delay", "mil_to_trials_ratio"],
    body: ".@{leader_handle} For every $1 you spend on clinical trials, ${mil_to_trials_ratio} goes to {mil_synonym}. There's a treaty that fixes this. Takes 30 seconds to sign. {deaths_from_delay} people have died waiting. {treaty_url}",
  },
  {
    id: "lumbergh",
    label: "Office Memo",
    requiredTokens: ["leader_name", "deaths_from_delay", "mil_to_trials_ratio"],
    body: [
      `Yeah, hi {leader_name}. So if you could go ahead and sign the 1% Treaty, that'd be great.`,
      ``,
      `It's at {treaty_url}. You just type your name and click submit. Should take about 30 seconds. So if you could just go ahead and do that, that'd be terrific.`,
      ``,
      "Oh, and I'm going to need you to be aware that {deaths_from_delay} people have died waiting for cures since we assigned this to you. You know. Because of the delayed disease eradication. Also your administration spends ${mil_to_trials_ratio} on {mil_synonym} for every $1 on finding out which medicines work. So. Yeah.",
      ``,
      "So if you could just sign that. And maybe stop spending ${mil_to_trials_ratio} on blowing stuff up for every $1 on clinical trials. That'd be great.",
    ].join("\n"),
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    requiredTokens: [
      "leader_name",
      "country",
      "government_spending_ytd",
      "days_overdue",
      "deaths_from_delay",
      "money_wasted",
      "mil_budget_pct",
      "mil_to_trials_ratio",
      "trials_budget_pct",
    ],
    body: [
      `{leader_name} — status update request from your employers.`,
      "",
      "{country} has spent {government_spending_ytd} this fiscal year. Of the combined military + clinical trials budget, {trials_budget_pct} goes to finding out which medicines work. The other {mil_budget_pct} goes to {mil_synonym}.",
      "",
      `The 1% Treaty moves 1% of military spending to clinical trials. It compresses disease eradication from 443 years to 36. Since it became available, {deaths_from_delay} people have died waiting for cures and {money_wasted} has accrued — the price of postponing eradication by {days_overdue} days.`,
      "",
      `The signing process takes 30 seconds: {treaty_url}`,
      "",
      `The upside-to-downside ratio of this action is 58 million to 1. On most planets, that number ends the conversation.`,
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
      "mil_to_trials_ratio",
    ],
    body: [
      `INVOICE #{days_overdue} — PAST DUE`,
      ``,
      `TO: {leader_name}, {country}`,
      `FROM: Your employers`,
      `RE: Undelivered services`,
      ``,
      `You've spent: {government_spending_ytd} (YTD)`,
      `On: "Promoting the general welfare"`,
      `Welfare delivered: Pending`,
      `Current {mil_synonym}-to-clinical-trials ratio: {mil_to_trials_ratio}:1`,
      ``,
      `Outstanding item: Sign the 1% Treaty`,
      `URL: {treaty_url}`,
      `Time required: 30 seconds`,
      ``,
      `Late fees (accruing daily):`,
      `— {deaths_per_day} deaths`,
      `— {money_wasted_per_day} lost`,
      ``,
      `This is reminder #{days_overdue}.`,
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
