import {
  GLOBAL_GDP_2025,
  type Parameter,
} from "@optimitron/data/parameters";

export const GOVERNMENTS_PAID_TO_PROMOTE_WELFARE: Parameter = {
  ...GLOBAL_GDP_2025,
  value: 37_000_000_000_000,
  parameterName: "GOVERNMENTS_PAID_TO_PROMOTE_WELFARE",
  displayName: "Annual Government Spending to Promote the General Welfare",
  description:
    "Approximate annual amount humanity pays governments for the service of promoting the general welfare, expressed as roughly one-third of global GDP.",
  formula: "GLOBAL_GDP_2025 * ~0.32",
  latex: "\\$37T \\approx \\$115T \\times 0.32",
  sourceType: "calculated",
  confidence: "medium",
  manualPageUrl:
    "https://manual.WarOnDisease.org/knowledge/solution/1-percent-treaty.html",
  manualPageTitle: "The 1% Treaty",
};
