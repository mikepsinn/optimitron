import {
  US_STATES,
  type StateAbbreviation,
  type StateName,
} from "@optimitron/site-kit/lib/us-states";

export const RIGHT_TO_TRY_SOURCES = {
  montanaSb535:
    "https://docs.legmt.gov/download-ticket?ticketId=404bf910-6276-4d4a-b3d3-56b7cac4b5f9",
  montanaSb422: "https://leg.mt.gov/bills/2023/SB0499/SB0422_X.pdf",
  montanaRules: "https://dphhs.mt.gov/assets/rules/2026-427-Adp-Arm.pdf",
  montanaLaw:
    "https://mca.legmt.gov/bills/mca/title_0500/chapter_0120/part_0010/sections_index.html",
  montanaLicensing:
    "https://dphhs.mt.gov/oig/licensure/healthcarefacilitylicensure/lbfacilityapplications/lbexperimentaltreatmentcenters",
} as const;

// The list lives in site-kit so the shared survey's state select and these
// campaign pages cannot drift apart.
export { US_STATES };
export type { StateAbbreviation, StateName };

export const SUPPORTER_ROLES = [
  "patient-or-caregiver",
  "clinician",
  "researcher",
  "public-educator",
  "state-legislator-or-staff",
  "other",
] as const;

export type SupporterRole = (typeof SUPPORTER_ROLES)[number];

export type StateCampaignStage = "enacted-model" | "listening";

export interface StateCampaign {
  abbreviation: StateAbbreviation;
  name: StateName;
  slug: string;
  stage: StateCampaignStage;
  stageLabel: string;
  headline: string;
  summary: string;
}

export function stateSlug(name: string): string {
  return name.toLowerCase().replaceAll(" ", "-");
}

export const STATE_CAMPAIGNS: StateCampaign[] = US_STATES.map(
  ([name, abbreviation]) => {
    const slug = stateSlug(name);

    if (name === "Montana") {
      return {
        abbreviation,
        name,
        slug,
        stage: "enacted-model",
        stageLabel: "Enacted precedent",
        headline: "Montana opened a broader, licensed path.",
        summary:
          "SB 535 created licensed experimental treatment centers and a supervised path for patients who have considered approved options.",
      };
    }

    return {
      abbreviation,
      name,
      slug,
      stage: "listening",
      stageLabel: "Listening for support",
      headline: `Should every patient in ${name} have the right to join a clinical trial for the most promising treatments?`,
      summary: `Help bring pragmatic trials, shared results, and more treatment options to patients in ${name}.`,
    };
  },
);

export function getStateCampaign(slug: string): StateCampaign | undefined {
  return STATE_CAMPAIGNS.find((campaign) => campaign.slug === slug);
}

export function stateCampaignHref(campaign: StateCampaign): string {
  return campaign.name === "Montana" ? "/montana" : `/states/${campaign.slug}`;
}
