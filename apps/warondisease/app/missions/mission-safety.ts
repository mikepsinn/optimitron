import { GLOBAL_DISEASE_DEATHS_DAILY } from "@optimitron/data/parameters";

/**
 * Safety copy for Earth Optimization Missions.
 *
 * Ported from Optimitron's `src/lib/dating-safety.ts`. Only the reader-facing
 * copy came across; the acknowledgement version and its metadata helpers stayed
 * on optimitron.com with the profile editor that writes them.
 */

const dailyDiseaseDeathsInThousands = Math.round(
  GLOBAL_DISEASE_DEATHS_DAILY.value / 1000,
);

export const MISSION_SAFETY_COPY = {
  title: "Mission Safety",
  body: `Earth Optimization Missions are one-hour sessions for ending war and disease. You may fall madly in love if you insist. But keep in mind, ${dailyDiseaseDeathsInThousands} thousand people die of disease every day, so please spend the hour eradicating disease instead of hugging and/or kissing.`,
  rules: [
    "Choose the setting yourself: online, in public, or not at all. Leave whenever you want.",
    "Do not send money, bank details, passwords, identity documents, or emergency favors to a match.",
    "Report weird behavior. Block anyone who makes ending war and disease worse.",
    "If you are in immediate danger, call local emergency services.",
  ],
} as const;
