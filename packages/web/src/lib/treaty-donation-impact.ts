import {
  DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_LIVES_SAVED,
  DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_SUFFERING_HOURS,
  POLITICAL_SUCCESS_PROBABILITY,
  TREATY_CAMPAIGN_TOTAL_COST,
} from "@optimitron/data/parameters";

const HOURS_PER_YEAR = 24 * 365;

export function getTreatyDonationImpactPerDollar() {
  const campaignCostUsd = TREATY_CAMPAIGN_TOTAL_COST.value;
  const conditionalSufferingHoursPreventedPerDollar =
    DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_SUFFERING_HOURS.value / campaignCostUsd;
  const conditionalSufferingYearsPreventedPerDollar =
    conditionalSufferingHoursPreventedPerDollar / HOURS_PER_YEAR;
  const conditionalLivesAvertedPerDollar =
    DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_LIVES_SAVED.value / campaignCostUsd;
  const successProbability = POLITICAL_SUCCESS_PROBABILITY.value;

  return {
    campaignCostUsd,
    conditionalLivesAvertedPerDollar,
    conditionalSufferingHoursPreventedPerDollar,
    conditionalSufferingYearsPreventedPerDollar,
    riskAdjustedLivesAvertedPerDollar: conditionalLivesAvertedPerDollar * successProbability,
    riskAdjustedSufferingYearsPreventedPerDollar:
      conditionalSufferingYearsPreventedPerDollar * successProbability,
    successProbability,
  };
}

export function formatDonationImpactNumber(value: number, maximumFractionDigits = 0) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits,
  }).format(value);
}
