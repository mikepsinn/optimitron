import type { ShareTemplate } from "@/lib/tasks/share-templates";

export const HUMANITY_SHARE_TEMPLATES: ShareTemplate[] = [
  {
    id: "plain",
    label: "Plain",
    requiredTokens: ["treaty_url"],
    body:
      "I signed the 1% Treaty. It redirects 1% of military spending to clinical trials so humanity can stop guessing which medicines work. Read it and sign it: {treaty_url}",
  },
  {
    id: "overdue-task",
    label: "Overdue Task",
    requiredTokens: ["leader_name", "days_overdue", "deaths_from_delay", "treaty_url"],
    body:
      "{leader_name} is {days_overdue} days overdue on one very small task: sign the 1% Treaty. {deaths_from_delay} people have died of curable disease while we waited. Sign it: {treaty_url}",
  },
  {
    id: "math",
    label: "The Math",
    requiredTokens: [
      "trial_capacity_multiplier",
      "eradication_years_status_quo",
      "eradication_years_treaty",
      "treaty_url",
    ],
    body:
      "The 1% Treaty turns 1% of military spending into {trial_capacity_multiplier}x the clinical trials and compresses disease eradication from {eradication_years_status_quo} years to {eradication_years_treaty}. Sign it: {treaty_url}",
  },
  {
    id: "moral",
    label: "Moral",
    requiredTokens: ["daily_disease_deaths", "treaty_url"],
    body:
      "{daily_disease_deaths} people die every day while humanity continues pretending war deserves more money than finding out which medicines work. Sign the 1% Treaty: {treaty_url}",
  },
  {
    id: "advanced-species",
    label: "Advanced Species",
    requiredTokens: ["money_wasted_per_day", "deaths_per_day", "treaty_url"],
    body:
      "Earth burns another {money_wasted_per_day} and loses another {deaths_per_day} people per day while humanity postpones a 30-second task. Very advanced species. Sign the 1% Treaty: {treaty_url}",
  },
  {
    id: "wishonia",
    label: "Wishonia",
    requiredTokens: ["treaty_url"],
    body:
      "On my planet we ended war first and disease shortly after because we noticed both were bad. Earth has now discovered step one. Sign the 1% Treaty: {treaty_url}",
  },
];

export const HUMANITY_DEFAULT_SHARE_TEMPLATE_ID = "plain";

export function pickDefaultHumanityShareTemplateId(
  templates: ShareTemplate[],
): string | null {
  if (templates.some((template) => template.id === HUMANITY_DEFAULT_SHARE_TEMPLATE_ID)) {
    return HUMANITY_DEFAULT_SHARE_TEMPLATE_ID;
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
