/**
 * Share-text templates for the task reminder dialog.
 *
 * Seventeen voice variants of the same overdue-task reminder. Each template
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
      "trial_capacity_multiplier",
      "eradication_years_status_quo",
      "eradication_years_treaty",
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
      "citizen_name",
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
      "eradication_years_status_quo",
      "eradication_years_treaty",
      "treaty_hale_gain",
      "lifetime_income_gain",
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
    requiredTokens: ["leader_handle", "mil_synonym", "deaths_from_delay", "mil_to_trials_ratio"],
    body: ".@{leader_handle} For every $1 you spend on clinical trials, ${mil_to_trials_ratio} goes to {mil_synonym}. The 1% Treaty moves 1% of military spending to clinical trials. 30 seconds to sign. {deaths_from_delay} dead of curable disease waiting. {treaty_url}",
  },
  {
    id: "sleepy-sign-it",
    label: "Sleepy Sign-It",
    requiredTokens: ["leader_name", "deaths_from_delay", "trial_capacity_multiplier"],
    body: "Sleepy {leader_name} STILL hasn't signed the 1% Treaty. 120 apocalypses of mass murder capacity down to 118.8 — you can only HAVE one apocalypse, folks — in exchange for {trial_capacity_multiplier}× the clinical trials. Easiest deal ever written. 30 seconds! I could do it in 5. {deaths_from_delay} dead of curable disease waiting. Very weak. Very sad. {treaty_url} — sign it!",
  },
  {
    id: "deal-maker",
    label: "The Deal-Maker",
    requiredTokens: [
      "leader_name",
      "mil_synonym",
      "trial_capacity_multiplier",
      "eradication_years_status_quo",
      "eradication_years_treaty",
    ],
    body: "Look, {leader_name}. I've made a LOT of deals. This one's a layup. 1% off {mil_synonym}, you get {trial_capacity_multiplier}× the clinical trials, disease clock drops from {eradication_years_status_quo} years to {eradication_years_treaty}. Easiest deal ever written. Sign it. {treaty_url}. 30 seconds. Not hard!",
  },
  {
    id: "many-people-are-saying",
    label: "Many People Are Saying",
    requiredTokens: ["leader_name", "deaths_from_delay", "trial_capacity_multiplier"],
    body: "Many people are saying {leader_name} can't sign the 1% Treaty — drops mass murder capacity from 120 apocalypses to 118.8, in exchange for {trial_capacity_multiplier}× more clinical trials — because he doesn't know how to read a PDF. I don't know! Maybe true, maybe not! But {deaths_from_delay} dead of curable disease since it hit his desk. Someone help him out. {treaty_url}",
  },
  {
    id: "the-ratio",
    label: "The Ratio",
    requiredTokens: ["country", "mil_to_trials_ratio", "mil_synonym"],
    body: "{country} spends ${mil_to_trials_ratio} on BOMBS for every $1 on finding out which medicines work. ONE DOLLAR. Who negotiated this? Total disaster. FIRE THEM. Sign the 1% Treaty — moves 1% from {mil_synonym} to clinical trials. {treaty_url}. Easy!",
  },
  {
    id: "3am-truth",
    label: "3 AM Truth",
    requiredTokens: ["leader_name", "government_spending_ytd", "daily_disease_deaths"],
    body: "Can't sleep. Thinking about how {leader_name} has spent {government_spending_ytd} this year and STILL can't find 30 seconds to sign a treaty that saves {daily_disease_deaths} lives a day. Very low energy leadership. Very sad! {treaty_url}",
  },
  {
    id: "tremendous-treaty",
    label: "The Tremendous Treaty",
    requiredTokens: [
      "leader_name",
      "deaths_per_day",
      "eradication_years_status_quo",
      "eradication_years_treaty",
    ],
    body: "I have a BEAUTIFUL treaty. Many people are saying it's the greatest treaty ever written. {eradication_years_status_quo}-year disease timeline? Down to {eradication_years_treaty}. TREMENDOUS. {leader_name} won't sign. Very unfair to the {deaths_per_day} people who permanently stop every day. {treaty_url}",
  },
  {
    id: "lumbergh",
    label: "Office Memo",
    requiredTokens: [
      "leader_name",
      "deaths_from_delay",
      "mil_to_trials_ratio",
      "mil_synonym",
    ],
    body: [
      `Yeahhh, hi {leader_name}, if you could go ahead and sign the 1% Treaty, that'd be great.`,
      ``,
      `It's at {treaty_url}. You just type your name and click submit. Should take about 30 seconds. So if you could just go ahead and do that, that'd be terrific.`,
      ``,
      "Oh, and I'm going to need you to be aware that {deaths_from_delay} people have died waiting for cures since we assigned this to you. You know. Because of the delayed disease eradication. So. Yeah.",
      ``,
      "So if you could just sign that. And maybe stop spending ${mil_to_trials_ratio} on {mil_synonym} for every $1 on clinical trials. That'd be great.",
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
      "mil_budget_pct",
      "mil_synonym",
      "mil_to_trials_ratio",
      "trials_budget_pct",
      "eradication_years_status_quo",
      "eradication_years_treaty",
    ],
    body: [
      `Excited to flag that {leader_name} has an amazing opportunity to sign the 1% Treaty 🙏`,
      ``,
      "{country} has spent {government_spending_ytd} this fiscal year. Of the combined military + clinical trials budget, {trials_budget_pct} goes to finding out which medicines work. The other {mil_budget_pct} goes to {mil_synonym} — that's ${mil_to_trials_ratio} on {mil_synonym} for every $1 on clinical trials.",
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
      "mil_synonym",
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
  {
    id: "onboarding",
    label: "Onboarding Reminder",
    requiredTokens: [
      "leader_name",
      "country",
      "days_overdue",
      "deaths_from_delay",
      "eradication_years_status_quo",
      "eradication_years_treaty",
      "trial_capacity_multiplier",
    ],
    body: [
      `Hi {leader_name}! 👋`,
      ``,
      `It looks like you still have 1 onboarding task remaining from when you started your role as leader of {country}. No pressure, but it's been {days_overdue} days and we'd love to get you fully set up!`,
      ``,
      `📋 Remaining task:`,
      `   Sign the 1% Treaty (~30 seconds)`,
      `   • Reduces mass murder capacity: 120 apocalypses → 118.8`,
      `   • Unlocks {trial_capacity_multiplier}× clinical trial throughput`,
      `   • Compresses disease eradication: {eradication_years_status_quo} years → {eradication_years_treaty}`,
      `   {treaty_url}`,
      ``,
      `Your colleagues who completed this step without you:`,
      `   — {deaths_from_delay} of them (posthumously, from diseases the treaty would have cured)`,
      ``,
      `Let us know if you run into any blockers! Our team is here to help 🙂`,
      ``,
      `Cheers,`,
      `The People`,
    ].join("\n"),
  },
  {
    id: "calendar-invite",
    label: "Calendar Invite",
    requiredTokens: [
      "leader_name",
      "citizen_name",
      "days_overdue",
      "deaths_from_delay",
      "eradication_years_status_quo",
      "eradication_years_treaty",
      "trial_capacity_multiplier",
    ],
    body: [
      `📅 CALENDAR INVITE`,
      ``,
      `Title: Sign the 1% Treaty`,
      `Organizer: {citizen_name}`,
      `Required: {leader_name}`,
      `When: {days_overdue} days ago`,
      `Duration: 30 seconds`,
      `Location: {treaty_url}`,
      ``,
      `Description: Reduces mass murder capacity from 120 apocalypses to 118.8. Unlocks {trial_capacity_multiplier}× clinical trial capacity. Disease eradication compressed from {eradication_years_status_quo} years to {eradication_years_treaty}.`,
      ``,
      `Agenda:`,
      `1. Type name`,
      `2. Click submit`,
      ``,
      `Your response: ⬜ Accept  ⬜ Decline  ✅ Ignore for {days_overdue} days`,
      ``,
      `Notes: {deaths_from_delay} have died of curable disease since this meeting was first scheduled. Recurring daily until acknowledged.`,
    ].join("\n"),
  },
  {
    id: "pip",
    label: "Improvement Plan",
    requiredTokens: [
      "leader_name",
      "country",
      "citizen_name",
      "days_overdue",
      "deaths_from_delay",
      "money_wasted",
      "mil_synonym",
      "mil_to_trials_ratio",
    ],
    body: [
      `PERFORMANCE IMPROVEMENT PLAN`,
      ``,
      `Employee: {leader_name}`,
      `Position: Leader of {country}`,
      `Review period: {days_overdue} days`,
      `Issued by: {citizen_name} and ~340M co-signers`,
      ``,
      `DEFICIENCIES:`,
      `— Core job function ("promote the general welfare") not observed`,
      "— Budget allocation inconsistent with stated role: ${mil_to_trials_ratio} on {mil_synonym} per $1 on clinical trials",
      `— {deaths_from_delay} casualties during review period`,
      `— {money_wasted} in foregone welfare during review period`,
      ``,
      `REQUIRED CORRECTIVE ACTION:`,
      `Sign the 1% Treaty at {treaty_url}`,
      `Estimated completion time: 30 seconds`,
      ``,
      `TIMELINE: Immediate`,
      `CONSEQUENCES IF UNMET: Next election cycle`,
      ``,
      `Employee signature: ______________________`,
    ].join("\n"),
  },
  {
    id: "slack-dm",
    label: "Slack DM",
    requiredTokens: ["leader_name", "days_overdue", "deaths_from_delay", "trial_capacity_multiplier"],
    body: [
      `hey {leader_name} 👋`,
      ``,
      `quick one — did you sign the treaty yet? the 1% one, drops mass murder capacity from 120 apocalypses to 118.8 in exchange for {trial_capacity_multiplier}× the clinical trials. {treaty_url}`,
      ``,
      `no worries if not, just following up since it's day {days_overdue} and {deaths_from_delay} people have died waiting for cures since i last pinged`,
      ``,
      `lmk if blocked on anything 🙏`,
    ].join("\n"),
  },
];

/**
 * Preferred default variant when the picker opens. Lumbergh's "yeahhh, if
 * you could go ahead and sign that" register is the one most readers
 * actually copy-paste — corporate passive-aggression translates across
 * political tribes in a way the Trump/LinkedIn voices don't.
 */
export const DEFAULT_SHARE_TEMPLATE_ID = "lumbergh";

export function getShareTemplate(id: string): ShareTemplate | undefined {
  return SHARE_TEMPLATES.find((template) => template.id === id);
}

/**
 * Choose which template to show first. Prefers DEFAULT_SHARE_TEMPLATE_ID,
 * falls back to the first usable template if the default got filtered out
 * (e.g. missing tokens on the current task).
 */
export function pickDefaultShareTemplateId(
  templates: ShareTemplate[],
): string | null {
  if (templates.some((t) => t.id === DEFAULT_SHARE_TEMPLATE_ID)) {
    return DEFAULT_SHARE_TEMPLATE_ID;
  }
  return templates[0]?.id ?? null;
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
