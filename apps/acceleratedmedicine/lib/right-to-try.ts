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

export const US_STATES = [
  ["Alabama", "AL"],
  ["Alaska", "AK"],
  ["Arizona", "AZ"],
  ["Arkansas", "AR"],
  ["California", "CA"],
  ["Colorado", "CO"],
  ["Connecticut", "CT"],
  ["Delaware", "DE"],
  ["Florida", "FL"],
  ["Georgia", "GA"],
  ["Hawaii", "HI"],
  ["Idaho", "ID"],
  ["Illinois", "IL"],
  ["Indiana", "IN"],
  ["Iowa", "IA"],
  ["Kansas", "KS"],
  ["Kentucky", "KY"],
  ["Louisiana", "LA"],
  ["Maine", "ME"],
  ["Maryland", "MD"],
  ["Massachusetts", "MA"],
  ["Michigan", "MI"],
  ["Minnesota", "MN"],
  ["Mississippi", "MS"],
  ["Missouri", "MO"],
  ["Montana", "MT"],
  ["Nebraska", "NE"],
  ["Nevada", "NV"],
  ["New Hampshire", "NH"],
  ["New Jersey", "NJ"],
  ["New Mexico", "NM"],
  ["New York", "NY"],
  ["North Carolina", "NC"],
  ["North Dakota", "ND"],
  ["Ohio", "OH"],
  ["Oklahoma", "OK"],
  ["Oregon", "OR"],
  ["Pennsylvania", "PA"],
  ["Rhode Island", "RI"],
  ["South Carolina", "SC"],
  ["South Dakota", "SD"],
  ["Tennessee", "TN"],
  ["Texas", "TX"],
  ["Utah", "UT"],
  ["Vermont", "VT"],
  ["Virginia", "VA"],
  ["Washington", "WA"],
  ["West Virginia", "WV"],
  ["Wisconsin", "WI"],
  ["Wyoming", "WY"],
] as const;

export type StateName = (typeof US_STATES)[number][0];

export type StateCampaignStage = "enacted-model" | "active" | "listening";

export interface StateCampaign {
  abbreviation: string;
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

    if (name === "Missouri") {
      return {
        abbreviation,
        name,
        slug,
        stage: "active",
        stageLabel: "Active education",
        headline: "Missouri can build the next state model.",
        summary:
          "The Institute is assembling patients, clinicians, researchers, and public educators around a responsible Missouri proposal.",
      };
    }

    return {
      abbreviation,
      name,
      slug,
      stage: "listening",
      stageLabel: "Listening for support",
      headline: `Should ${name} build a Universal Right to Try path?`,
      summary:
        "Tell the Institute which people and organizations want a state education page and a serious local conversation.",
    };
  },
);

export function getStateCampaign(slug: string): StateCampaign | undefined {
  return STATE_CAMPAIGNS.find((campaign) => campaign.slug === slug);
}

export function stateCampaignHref(campaign: StateCampaign): string {
  return campaign.name === "Montana"
    ? "/montana"
    : `/states/${campaign.slug}`;
}
