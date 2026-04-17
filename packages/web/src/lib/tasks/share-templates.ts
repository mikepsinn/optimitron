/**
 * Share-text templates for the task reminder dialog.
 *
 * Seven voice variants of the same overdue-task reminder. Each template
 * commits to a single container (memo, ticket, invoice, post, voicemail);
 * the dissonance between the form and the subject does the comedy. Don't
 * argue the full case inside any one variant — let the form carry it.
 *
 * All templates consume the same flat token set produced by
 * `buildTaskShareTokens`. Tokens that are unresolved render as empty
 * strings via `renderTemplate`.
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
  | "daily_disease_deaths"
  | "days_overdue"
  | "deaths_from_delay"
  | "deaths_per_day"
  | "eradication_years_status_quo"
  | "eradication_years_treaty"
  | "government_spending_ytd"
  | "leader_handle"
  | "leader_name"
  | "lifetime_income_gain"
  | "mil_budget_pct"
  | "mil_synonym"
  | "mil_to_trials_ratio"
  | "money_wasted"
  | "money_wasted_per_day"
  | "task_title"
  | "treaty_hale_gain"
  | "treaty_url"
  | "trial_capacity_multiplier"
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
      `The math: humanity has 120 apocalypses worth of mass murder capacity. The treaty reduces this to 118.8 in exchange for {trial_capacity_multiplier}× clinical trial capacity — compressing disease eradication from {eradication_years_status_quo} years to {eradication_years_treaty}. You can only have one apocalypse. 118.8 is functionally indistinguishable from 120.`,
      ``,
      `While it sits unsigned: {deaths_per_day} die per day waiting for treatments. {money_wasted_per_day} per day — each day late pushes the eradication finish line one day later. {deaths_from_delay} dead since this task was assigned.`,
      ``,
      `Thank you.`,
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
      `Job responsibilities: "Promote the general welfare"`,
      `Welfare promoted: None detected`,
      ``,
      `Outstanding action items: 1 (Sign the 1% Treaty — {treaty_url})`,
      `Estimated time to complete: 30 seconds`,
      `Days overdue: {days_overdue}`,
      `Previous reminders sent: {days_overdue}`,
      `Employee response: N/A`,
      ``,
      `Casualties accrued during review period: {deaths_from_delay}`,
      `Cost accrued during review period: {money_wasted}`,
      `Spending ratio (military : clinical trials): {mil_to_trials_ratio} : 1`,
      `Share of combined budget actually testing whether medicines work: {trials_budget_pct}`,
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
      `TICKET #{days_overdue}-001`,
      `Severity: SEV-1`,
      `Status: OVERDUE`,
      `Assignee: {leader_name}`,
      `Status: OVERDUE ({days_overdue} days)`,
      `Casualties since ticket opened: {deaths_from_delay}`,
      `Budget burned since ticket opened: {money_wasted}`,
      ``,
      `Task: Sign the 1% Treaty`,
      `Steps: 1) Go to {treaty_url} 2) Type name 3) Click submit`,
      `ETA: 30 seconds`,
      ``,
      `Impact if resolved: Disease eradication compressed from {eradication_years_status_quo} years to {eradication_years_treaty}. {treaty_hale_gain} additional healthy years per human. {lifetime_income_gain} additional lifetime income per person.`,
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
    id: "sleepy-sign-it",
    label: "Sleepy Sign-It",
    requiredTokens: ["leader_name", "deaths_from_delay"],
    body: "Sleepy {leader_name} STILL hasn't signed the 1% Treaty. 30 seconds! I could do it in 5. {deaths_from_delay} people have died waiting. Very weak leadership. Very sad. {treaty_url} — sign it!",
  },
  {
    id: "deal-maker",
    label: "The Deal-Maker",
    requiredTokens: ["leader_name"],
    body: "Look, {leader_name}. I've made a LOT of deals. This one's a layup. 1% off {mil_synonym}, you get {trial_capacity_multiplier}× the clinical trials, disease clock drops from {eradication_years_status_quo} years to {eradication_years_treaty}. Easiest deal ever written. Sign it. {treaty_url}. 30 seconds. Not hard!",
  },
  {
    id: "many-people-are-saying",
    label: "Many People Are Saying",
    requiredTokens: ["leader_name", "deaths_from_delay"],
    body: "Many people are saying {leader_name} can't sign the 1% Treaty because he doesn't know how to read a PDF. I don't know! Maybe true, maybe not! But {deaths_from_delay} dead since it hit his desk. Someone help him out. {treaty_url}",
  },
  {
    id: "the-ratio",
    label: "The Ratio",
    requiredTokens: ["country", "mil_to_trials_ratio"],
    body: "{country} spends ${mil_to_trials_ratio} on BOMBS for every $1 on finding out which medicines work. ONE DOLLAR. Who negotiated this? Total disaster. FIRE THEM. Sign the treaty. {treaty_url}. Easy!",
  },
  {
    id: "3am-truth",
    label: "3 AM Truth",
    requiredTokens: ["leader_name", "government_spending_ytd"],
    body: "Can't sleep. Thinking about how {leader_name} has spent {government_spending_ytd} this year and STILL can't find 30 seconds to sign a treaty that saves {daily_disease_deaths} lives a day. Very low energy leadership. Very sad! {treaty_url}",
  },
  {
    id: "tremendous-treaty",
    label: "The Tremendous Treaty",
    requiredTokens: ["leader_name", "deaths_per_day"],
    body: "I have a BEAUTIFUL treaty. Many people are saying it's the greatest treaty ever written. {eradication_years_status_quo}-year disease timeline? Down to {eradication_years_treaty}. TREMENDOUS. {leader_name} won't sign. Very unfair to the {deaths_per_day} people who permanently stop every day. {treaty_url}",
  },
  {
    id: "lumbergh",
    label: "Office Memo",
    requiredTokens: ["leader_name", "deaths_from_delay", "mil_to_trials_ratio"],
    body: [
      `Yeahhh, hi {leader_name}, if you could go ahead and sign the 1% Treaty, that'd be great.`,
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
      `Excited to flag that {leader_name} has an amazing opportunity to sign the 1% Treaty 🙏`,
      ``,
      "{country} has spent {government_spending_ytd} this fiscal year. Of the combined military + clinical trials budget, {trials_budget_pct} goes to finding out which medicines work. The other {mil_budget_pct} goes to {mil_synonym}.",
      "",
      `The 1% Treaty moves 1% of military spending to clinical trials. It compresses disease eradication from {eradication_years_status_quo} years to {eradication_years_treaty}. The task is literally typing your name in a box at {treaty_url}. It takes 30 seconds.`,
      ``,
      `Grateful for the {deaths_from_delay} people who died from curable diseases since this task was assigned to help move this conversation forward. Their stories continue to inspire.`,
      ``,
      `Proud of the work ahead. Link for anyone who wants to drive impact: {treaty_url}`,
      ``,
      `#ServantLeadership #Accountability #HumanWelfare #ImpactDriven #PeopleFirst`,
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
      `— {money_wasted_per_day} in medical bills and lost output`,
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
