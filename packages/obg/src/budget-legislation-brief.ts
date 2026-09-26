import type { EfficiencyAnalysis } from "./efficiency-analysis.js";
import type { BudgetReportCategory, BudgetReportJSON } from "./budget-report-json.js";

export type BudgetLegislationEvidence = EfficiencyAnalysis & { category: string };

export interface BudgetLegislationBrief {
  slug: string;
  title: string;
  categoryId: string;
  categoryName: string;
  recommendation: string;
  evidenceSource: string;
  sourceGeneratedAt: string;
  modelCountry: string;
  summary: string;
  evidence: BudgetLegislationEvidence;
}

export interface BudgetLegislationBriefOptions {
  minOverspendRatio?: number;
}

type BudgetCategoryWithEfficiency = BudgetReportCategory & {
  efficiency: NonNullable<BudgetReportCategory["efficiency"]>;
};

/** A descriptive peer comparison cannot authorize a budget reform draft. */
function hasActionableAllocation(category: BudgetReportCategory): category is BudgetCategoryWithEfficiency {
  return category.efficiency !== undefined
    && category.efficiency !== null
    && category.recommendation !== "comparison_only"
    && category.recommendation !== "no_comparison"
    && category.optimalSpendingNominal !== null
    && Number.isFinite(category.optimalSpendingNominal)
    && category.optimalSpendingNominal >= 0
    && category.optimalSpendingPerCapita !== null
    && Number.isFinite(category.optimalSpendingPerCapita)
    && category.optimalSpendingPerCapita >= 0;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function formatUsdCompact(value: number): string {
  const absoluteValue = Math.abs(value);

  if (absoluteValue >= 1_000_000_000_000) {
    return `$${(value / 1_000_000_000_000).toFixed(1)}T`;
  }

  if (absoluteValue >= 1_000_000_000) {
    return `$${Math.round(value / 1_000_000_000)}B`;
  }

  if (absoluteValue >= 1_000_000) {
    return `$${Math.round(value / 1_000_000)}M`;
  }

  return `$${Math.round(value)}`;
}

function toBrief(category: BudgetCategoryWithEfficiency, generatedAt: string): BudgetLegislationBrief {
  const { efficiency } = category;
  const slug = `${slugify(category.name)}-reform`;
  const savings = formatUsdCompact(efficiency.potentialSavingsTotal);
  const summary =
    `${category.name} reform draft modeled on ${efficiency.bestCountry.name}, ` +
    `targeting ${efficiency.overspendRatio.toFixed(1)}x overspend and about ${savings}/yr in savings.`;

  return {
    slug,
    title: `Model Legislation: ${category.name} Reform`,
    categoryId: category.id,
    categoryName: category.name,
    recommendation: category.recommendation,
    evidenceSource: category.evidenceSource,
    sourceGeneratedAt: generatedAt,
    modelCountry: efficiency.bestCountry.name,
    summary,
    evidence: {
      ...efficiency,
      category: category.name,
    },
  };
}

export function createBudgetLegislationBriefs(
  report: BudgetReportJSON,
  options?: BudgetLegislationBriefOptions,
): BudgetLegislationBrief[] {
  const minOverspendRatio = options?.minOverspendRatio ?? 1.25;

  return report.categories
    .filter(hasActionableAllocation)
    .filter((category) => category.efficiency.overspendRatio >= minOverspendRatio)
    .sort((left, right) => right.efficiency.overspendRatio - left.efficiency.overspendRatio)
    .map((category) => toBrief(category, report.generatedAt));
}
