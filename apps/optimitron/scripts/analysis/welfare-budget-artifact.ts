import { optimizeWelfareBudget } from '@optimitron/obg';
import type { WelfareBudgetInput } from '@optimitron/obg';

/** Input provenance accompanies the curves; it is not inferred from their numbers. */
export interface WelfareBudgetDocument {
  jurisdiction: string;
  fiscalYear: number;
  currency: string;
  effectHorizonYears: number;
  endpoints: {
    income: 'median_real_after_tax_income_growth_pp_per_year';
    health: 'median_healthy_life_years';
  };
  categorySources: Record<string, string[]>;
  model: WelfareBudgetInput;
}

export function generateWelfareBudgetArtifact(document: WelfareBudgetDocument) {
  if (
    !document.jurisdiction?.trim() || !document.currency?.trim() ||
    !Number.isInteger(document.fiscalYear) ||
    !Number.isFinite(document.effectHorizonYears) || document.effectHorizonYears <= 0 ||
    document.endpoints?.income !== 'median_real_after_tax_income_growth_pp_per_year' ||
    document.endpoints?.health !== 'median_healthy_life_years'
  ) {
    throw new Error('Specify jurisdiction, fiscal year, currency, horizon, and the two exact median endpoints; HALE and monetized health are different outcomes.');
  }
  for (const category of document.model.categories) {
    const unchanged = category.minSpendingUsd === category.currentSpendingUsd && category.maxSpendingUsd === category.currentSpendingUsd;
    if (!unchanged && !document.categorySources?.[category.id]?.some(source => source.trim())) {
      throw new Error(`Missing response-curve source for ${category.id}`);
    }
  }
  const result = optimizeWelfareBudget(document.model);
  return { ...document, result };
}

export type WelfareBudgetArtifact = ReturnType<typeof generateWelfareBudgetArtifact>;

const number = (value: number) => value.toLocaleString('en-US', { maximumFractionDigits: 6 });
const cell = (value: string) => value.replaceAll('|', '/').replaceAll('\n', ' ');

export function renderWelfareBudgetMarkdown(artifact: WelfareBudgetArtifact): string {
  const { result } = artifact;
  return [
    `# ${artifact.jurisdiction}: budget allocation for health and income`,
    '',
    `Budget: ${number(result.totalBudgetUsd)} ${artifact.currency}; fiscal year ${artifact.fiscalYear}. Effect horizon: ${artifact.effectHorizonYears} years.`,
    '',
    `Objective: ${result.welfareConfig.alpha} × median real after-tax income growth (percentage points/year) + ${1 - result.welfareConfig.alpha} × median healthy life years. These explicit weights define the tradeoff between the two units.`,
    'The allocation maximizes expected welfare under the supplied additive, concave response curves and category bounds. Source references document the inputs; the solver does not validate their causal identification or population coverage.',
    '',
    '| Category | Current | Allocation | Change | Income growth change (pp/year) | Median healthy years change |',
    '|---|---:|---:|---:|---:|---:|',
    ...result.allocations.map(row => `| ${cell(row.id)} | ${number(row.currentSpendingUsd)} | ${number(row.spendingUsd)} | ${number(row.changeUsd)} | ${number(row.incomeGrowthPpYearChange)} | ${number(row.medianHealthyLifeYearsChange)} |`),
    `| **Total** | **${number(result.totalBudgetUsd)}** | **${number(result.allocatedBudgetUsd)}** | **${number(result.allocatedBudgetUsd - result.totalBudgetUsd)}** | **${number(result.expectedEffect.incomeGrowthPpYearChange)}** | **${number(result.expectedEffect.medianHealthyLifeYearsChange)}** |`,
    '',
    '## Uncertainty',
    '',
    ...(result.uncertainty ? [
      `${result.uncertainty.draws} paired model draws select one budget by expected welfare. Each interval evaluates that same budget against the current allocation.`,
      `- Median income growth change: ${number(result.uncertainty.incomeGrowthPpYearChange.p05)} to ${number(result.uncertainty.incomeGrowthPpYearChange.p95)} pp/year (90% model interval).`,
      `- Median healthy years change: ${number(result.uncertainty.medianHealthyLifeYearsChange.p05)} to ${number(result.uncertainty.medianHealthyLifeYearsChange.p95)} years (90% model interval).`,
    ] : ['No uncertainty draws supplied. These are deterministic model results.']),
    '',
    '## Response-curve sources',
    '',
    ...Object.entries(artifact.categorySources).flatMap(([id, sources]) => [`### ${id}`, ...sources.map(source => `- ${source}`), '']),
  ].join('\n');
}
