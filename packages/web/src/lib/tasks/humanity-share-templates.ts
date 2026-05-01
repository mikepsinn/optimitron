import type { ShareTemplate } from "@/lib/tasks/share-templates";

export const HUMANITY_SHARE_TEMPLATES: ShareTemplate[] = [
  {
    id: "polite-reminder",
    label: "Polite Reminder",
    requiredTokens: [
      "target_name",
      "leader_name",
      "days_overdue",
      "deaths_per_day",
      "money_wasted_per_day",
      "deaths_from_delay",
      "trial_capacity_multiplier",
      "eradication_years_status_quo",
      "eradication_years_treaty",
      "treaty_url",
    ],
    body: [
      `Hi {target_name},`,
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
    id: "sleepy-sign-it",
    label: "Sleepy Sign-It",
    requiredTokens: [
      "target_name",
      "deaths_from_delay",
      "trial_capacity_multiplier",
      "treaty_url",
    ],
    body:
      "Sleepy {target_name} STILL hasn't signed the 1% Treaty. 120 apocalypses of mass murder capacity down to 118.8 — you can only HAVE one apocalypse, folks — in exchange for {trial_capacity_multiplier}× the clinical trials. Easiest deal ever written. 30 seconds! I could do it in 5. {deaths_from_delay} dead of curable disease waiting. Very weak. Very sad. {treaty_url} — sign it!",
  },
  {
    id: "deal-maker",
    label: "The Deal-Maker",
    requiredTokens: [
      "target_name",
      "mil_synonym",
      "trial_capacity_multiplier",
      "eradication_years_status_quo",
      "eradication_years_treaty",
      "treaty_url",
    ],
    body:
      "Look, {target_name}. I've made a LOT of deals. This one's a layup. 1% off {mil_synonym}, you get {trial_capacity_multiplier}× the clinical trials, disease clock drops from {eradication_years_status_quo} years to {eradication_years_treaty}. Easiest deal ever written. Sign it. {treaty_url}. 30 seconds. Not hard!",
  },
  {
    id: "many-people-are-saying",
    label: "Many People Are Saying",
    requiredTokens: [
      "target_name",
      "deaths_from_delay",
      "trial_capacity_multiplier",
      "treaty_url",
    ],
    body:
      "Many people are saying {target_name} can't sign the 1% Treaty — drops mass murder capacity from 120 apocalypses to 118.8, in exchange for {trial_capacity_multiplier}× more clinical trials — because it doesn't know how to read a PDF. I don't know! Maybe true, maybe not! But {deaths_from_delay} dead of curable disease since it hit the desk. Someone help it out. {treaty_url}",
  },
  {
    id: "tremendous-treaty",
    label: "The Tremendous Treaty",
    requiredTokens: [
      "target_name",
      "deaths_per_day",
      "eradication_years_status_quo",
      "eradication_years_treaty",
      "treaty_url",
    ],
    body:
      "I have a BEAUTIFUL treaty. Many people are saying it's the greatest treaty ever written. {eradication_years_status_quo}-year disease timeline? Down to {eradication_years_treaty}. TREMENDOUS. {target_name} won't sign. Very unfair to the {deaths_per_day} people who permanently stop every day. {treaty_url}",
  },
  {
    id: "slack-dm",
    label: "Slack DM",
    requiredTokens: [
      "target_name",
      "days_overdue",
      "deaths_from_delay",
      "trial_capacity_multiplier",
      "treaty_url",
    ],
    body: [
      `hey {target_name}`,
      ``,
      `quick one — did you sign the treaty yet? the 1% one, drops mass murder capacity from 120 apocalypses to 118.8 in exchange for {trial_capacity_multiplier}× the clinical trials. {treaty_url}`,
      ``,
      `no worries if not, just following up since it's day {days_overdue} and {deaths_from_delay} people have died waiting for cures since i last pinged`,
      ``,
      `lmk if blocked on anything 🙏`,
    ].join("\n"),
  },
  {
    id: "task-notification",
    label: "Task Notification",
    requiredTokens: [
      "target_name",
      "citizen_name",
      "eradication_years_status_quo",
      "treaty_url",
    ],
    body: [
      "Overdue task: End War and Disease",
      "",
      "Assigned to: {target_name}",
      "Assigned by: {citizen_name}",
      "Time required: 30 seconds",
      "Due: about {eradication_years_status_quo} years ago",
      "",
      "Please vote on the 1% Treaty:",
      "{treaty_url}",
    ].join("\n"),
  },
  {
    id: "sincere",
    label: "Sincere",
    requiredTokens: ["target_name", "treaty_url"],
    body:
      "Hi {target_name}. I love you very much and I don't want you to get a horrible disease and die. Could you please take 30 seconds to respond to this stupid survey in order to end war and disease? {treaty_url}",
  },
];

export const HUMANITY_DEFAULT_SHARE_TEMPLATE_ID = "polite-reminder";
export const ONE_HUMAN_DEFAULT_SHARE_TEMPLATE_ID = "task-notification";

export function pickDefaultHumanityShareTemplateId(
  templates: ShareTemplate[],
  preferredTemplateId = HUMANITY_DEFAULT_SHARE_TEMPLATE_ID,
): string | null {
  if (templates.some((template) => template.id === preferredTemplateId)) {
    return preferredTemplateId;
  }

  return templates[0]?.id ?? null;
}

export function getUsableHumanityShareTemplates(
  tokens: Record<string, string>,
): ShareTemplate[] {
  return HUMANITY_SHARE_TEMPLATES.filter((template) =>
    template.requiredTokens.every((key) => {
      const value = tokens[key];
      return value != null && value !== "";
    }),
  );
}
