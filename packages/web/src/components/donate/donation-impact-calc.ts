import {
  BED_NETS_COST_PER_DALY,
  DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_DALYS,
  DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_ECONOMIC_VALUE,
  DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_LIVES_SAVED,
  DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_SUFFERING_HOURS,
  TREATY_REDUCTION_PCT,
} from "@optimitron/data/parameters";

export interface DonationImpactInputs {
  votesNeeded: number;
  costPerVote: number;
  successProbability: number;
  treatyReductionPct: number;
}

export interface DonationImpactDerived {
  campaignCostUsd: number;
  livesSaved: number;
  dalys: number;
  sufferingHours: number;
  economicValue: number;
  costPerLife: number;
  costPerDaly: number;
  vsBedNetsMultiplier: number;
  roi: number;
}

// Linear scaling around the 1% treaty baseline. At reductionPct=1% and
// successProbability=1, this returns the published parameter values exactly.
// Above ~5% diminishing returns kick in; the calculator caps the slider there.
export function deriveDonationImpact(
  inputs: DonationImpactInputs,
): DonationImpactDerived {
  const campaignCostUsd = inputs.votesNeeded * inputs.costPerVote;
  const reductionRatio = inputs.treatyReductionPct / TREATY_REDUCTION_PCT.value;
  const scale = reductionRatio * inputs.successProbability;

  const livesSaved =
    DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_LIVES_SAVED.value * scale;
  const dalys = DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_DALYS.value * scale;
  const sufferingHours =
    DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_SUFFERING_HOURS.value * scale;
  const economicValue =
    DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_ECONOMIC_VALUE.value * scale;

  const costPerLife = livesSaved > 0 ? campaignCostUsd / livesSaved : Infinity;
  const costPerDaly = dalys > 0 ? campaignCostUsd / dalys : Infinity;
  const vsBedNetsMultiplier =
    costPerDaly > 0 && Number.isFinite(costPerDaly)
      ? BED_NETS_COST_PER_DALY.value / costPerDaly
      : Infinity;
  const roi = campaignCostUsd > 0 ? economicValue / campaignCostUsd : 0;

  return {
    campaignCostUsd,
    livesSaved,
    dalys,
    sufferingHours,
    economicValue,
    costPerLife,
    costPerDaly,
    vsBedNetsMultiplier,
    roi,
  };
}
