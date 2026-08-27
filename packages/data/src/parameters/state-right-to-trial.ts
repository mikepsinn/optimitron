import type { Parameter } from "./parameters-calculations-citations";

/**
 * Right to Trial parameters sourced from the manual's maintained
 * `dih_models/parameters.py` model. Keep these exports separate until the
 * next complete parameter-catalog regeneration brings them into this repo.
 */
export const STATE_RTT_PHILANTHROPIC_COST_TOTAL: Parameter = {
  value: 65_000_000,
  parameterName: "STATE_RTT_PHILANTHROPIC_COST_TOTAL",
  calculationsUrl:
    "https://manual.WarOnDisease.org/calculations.html#sec-state_rtt_philanthropic_cost_total",
  unit: "USD",
  displayName: "Universal Right to Try with Evidence Philanthropic Cost",
  description:
    "Total philanthropic cost of adopting Universal Right to Try with Evidence in all 50 states: a central $15 million campaign estimate covering legislation or amendment in all 50 states plus $50 million for the shared registry's first ten years. The model bill requires participating centers to fund continued registry operation after year ten. This philanthropic numerator excludes patient or payer spending on treatment delivery, trial-site services, and permitted study costs. The wide interval represents campaign and infrastructure cost uncertainty without separate scenario parameters.",
  sourceType: "definition",
  confidence: "low",
  confidenceInterval: [25_000_000, 200_000_000],
  distribution: "lognormal",
  manualPageUrl:
    "https://manual.WarOnDisease.org/knowledge/appendix/state-right-to-trial-impact.html",
  manualPageTitle:
    "Universal Right to Try with Evidence: Potential Impact of Adoption in All 50 States",
};

export const STATE_RTT_TREATMENT_DISCOVERY_MULTIPLIER: Parameter = {
  value: 5.48,
  parameterName: "STATE_RTT_TREATMENT_DISCOVERY_MULTIPLIER",
  calculationsUrl:
    "https://manual.WarOnDisease.org/calculations.html#sec-state_rtt_treatment_discovery_multiplier",
  unit: "x",
  displayName:
    "Universal Right to Try with Evidence Treatment Discovery Multiplier",
  description:
    "Conditional multiplier on the worldwide first-treatment discovery rate after all 50 states adopt and a mature pooled pragmatic-trial system operates under applicable federal authorization. The 5.48x central calibration reproduces the prior model's 82.2 versus 15 first treatments per year; it is an assumption, not an observed effect estimate. This single input incorporates patient or payer funding of treatment delivery, trial-site services, and permitted study costs, newly viable post-Phase-1 treatment-condition pairs, evaluable protocol quality, candidate supply, and scientific success. Its range describes productivity of an operating system, not the separate probability that advocacy achieves full adoption and implementation.",
  sourceType: "definition",
  confidence: "low",
  confidenceInterval: [1.1, 15],
  distribution: "lognormal",
  manualPageUrl:
    "https://manual.WarOnDisease.org/knowledge/appendix/state-right-to-trial-impact.html",
  manualPageTitle:
    "Universal Right to Try with Evidence: Potential Impact of Adoption in All 50 States",
};
