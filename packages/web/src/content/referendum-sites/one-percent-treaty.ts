import {
  DFDA_QUEUE_CLEARANCE_YEARS,
  DFDA_TRIAL_CAPACITY_MULTIPLIER,
  NUCLEAR_WINTER_OVERKILL_FACTOR,
  STATUS_QUO_QUEUE_CLEARANCE_YEARS,
  TREATY_REDUCTION_PCT,
  fmtParamValueOnly,
  fmtRaw,
} from "@optimitron/data/parameters";
import { CAMPAIGN_NAME } from "@optimitron/data/campaign";
import messages from "@/messages/en-US/war-on-disease.json";
import type { ReferendumSiteContent } from "./types";

type OnePercentTreatyMessageCatalog = Omit<
  ReferendumSiteContent,
  "impactUrl" | "key"
>;

const apocalypseCount = fmtParamValueOnly(NUCLEAR_WINTER_OVERKILL_FACTOR);
const reducedApocalypseCount = fmtRaw(
  NUCLEAR_WINTER_OVERKILL_FACTOR.value * 0.99,
);
const diseaseAcceleration = fmtParamValueOnly(DFDA_TRIAL_CAPACITY_MULTIPLIER);
const statusQuoQueueYears = Math.round(
  STATUS_QUO_QUEUE_CLEARANCE_YEARS.value,
).toLocaleString("en-US");
const dfdaQueueYears = Math.round(
  DFDA_QUEUE_CLEARANCE_YEARS.value,
).toLocaleString("en-US");
const campaignName = CAMPAIGN_NAME;
const treatyReduction = fmtParamValueOnly(TREATY_REDUCTION_PCT, 1);
const treatyTradePosition = `humanity should redirect one percent of military spending from weapons capable of causing ${apocalypseCount} apocalypses to compress the disease-eradication timeline from ${statusQuoQueueYears} years to ${dfdaQueueYears} years`;

const onePercentTreatyMessageCatalog: OnePercentTreatyMessageCatalog =
  messages.onePercentTreaty;

function renderMessageTemplates<T>(
  value: T,
  replacements: Record<string, string>,
  pathParts: string[] = [],
): T {
  if (typeof value === "string") {
    return value.replace(/\{([A-Za-z0-9_]+)\}/g, (_, key: string) => {
      const replacement = replacements[key];
      if (replacement === undefined) {
        throw new Error(
          `Missing message replacement for {${key}} at ${pathParts.join(".")}`,
        );
      }
      return replacement;
    }) as T;
  }

  if (Array.isArray(value)) {
    return value.map((item, index) =>
      renderMessageTemplates(item, replacements, [
        ...pathParts,
        String(index),
      ]),
    ) as T;
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [
        key,
        renderMessageTemplates(nestedValue, replacements, [
          ...pathParts,
          key,
        ]),
      ]),
    ) as T;
  }

  return value;
}

const onePercentTreatyRenderedMessages = renderMessageTemplates(
  onePercentTreatyMessageCatalog,
  {
    apocalypseCount,
    campaignName,
    dfdaQueueYears,
    diseaseAcceleration,
    reducedApocalypseCount,
    statusQuoQueueYears,
    treatyReduction,
    treatyTradePosition,
  },
  ["onePercentTreaty"],
);

export const onePercentTreatyContent: ReferendumSiteContent = {
  key: "onePercentTreaty",
  ...onePercentTreatyRenderedMessages,
  impactUrl: "https://impact.warondisease.org",
};
