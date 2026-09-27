import { US_FEDERAL_BUDGET } from '@optimitron/data';

/**
 * A fixed FY2025 estimate ledger for incremental scenarios, not an audited
 * appropriation crosswalk. Never use its reconciliation residual as funding.
 * Values are nominal FY2025 USD; no PPP series enters this decision model.
 */
export interface BaselineBudgetLine {
  id: string;
  name: string;
  annualOutlaysUsd: number;
  sourceType: 'mandatory' | 'discretionary' | 'net_interest' | 'reconciliation';
  /** Protected against cuts; receiving an explicit program increment is allowed. */
  protected: boolean;
}

const BILLION = 1_000_000_000;
const residualUsd = 165 * BILLION;
const listedLines: BaselineBudgetLine[] = US_FEDERAL_BUDGET.categories.map(category => ({
  id: category.id,
  name: category.name,
  annualOutlaysUsd: category.spendingBillions * BILLION,
  sourceType: category.type,
  protected: category.id !== 'military',
}));
const listedOutlaysUsd = listedLines.reduce((sum, line) => sum + line.annualOutlaysUsd, 0);
const totalOutlaysUsd = US_FEDERAL_BUDGET.totalOutlays * BILLION;

// A source refresh must trigger an explicit accounting review, not silently
// turn a different discrepancy or a changed military amount into new funding.
if (
  US_FEDERAL_BUDGET.fiscalYear !== 2025 ||
  listedLines.length !== 23 ||
  new Set(listedLines.map(line => line.id)).size !== listedLines.length ||
  totalOutlaysUsd !== 6_872 * BILLION ||
  listedOutlaysUsd + residualUsd !== totalOutlaysUsd ||
  listedLines.find(line => line.id === 'military')?.annualOutlaysUsd !== 886 * BILLION
) {
  throw new Error('Federal budget baseline changed; reconcile the scenario ledger before generating results');
}

export const FEDERAL_BUDGET_BASELINE = Object.freeze({
  fiscalYear: 2025,
  currency: 'nominal FY2025 USD',
  dataStatus: 'estimates; displayed categories are not audited appropriation accounts',
  isEstimate: true,
  accountCrosswalkVerified: false,
  potentialAccountOverlap: true,
  sourceUpdatedAt: US_FEDERAL_BUDGET.metadata.lastUpdated,
  totalOutlaysUsd,
  listedOutlaysUsd,
  residualUsd,
  lines: Object.freeze([
    ...listedLines,
    {
      id: 'unreconciled_other_outlays',
      name: 'Unreconciled baseline / other outlays',
      annualOutlaysUsd: residualUsd,
      sourceType: 'reconciliation' as const,
      protected: true,
    },
  ].map(line => Object.freeze(line))),
  sources: Object.freeze([
    {
      title: 'Bundled FY2025 federal budget estimates; last updated February 2025',
      url: 'https://github.com/mikepsinn/optimitron/blob/main/packages/data/src/datasets/us-federal-budget.ts',
    },
    {
      title: 'CBO January 2025 outlook; underlying source named by the bundled dataset',
      url: 'https://www.cbo.gov/publication/61172',
    },
  ]),
  limitations: Object.freeze([
    'The $165B residual balances the displayed estimates; it does not identify a spendable account or prove that the category crosswalk is complete.',
    'Veterans Affairs includes mandatory and discretionary activities. International Affairs may overlap State; agriculture and cross-agency defense activities also need an account crosswalk.',
    'Existing lines remain fixed except for an explicit military reduction and the cost of selected incremental programs. No peer spending gap funds this model.',
    'A modeled one-year appropriation is treated as a same-year outlay equivalent. Actual obligation and outlay timing, contracts, and legislative authority require implementation planning.',
  ]),
});

export type PolicyBudgetAccount = 'education' | 'health_research' | 'public_health' | 'housing' | 'justice';

/** Destination mappings allocate NEW program costs, not the whole baseline. */
export const POLICY_BUDGET_ACCOUNT_MAP = Object.freeze({
  education: {
    accountId: 'education',
    rationale: 'Incremental education program costs; federal/state cost sharing must be specified by each program.',
  },
  health_research: {
    accountId: 'health_discretionary',
    rationale: 'Incremental NIH/research costs within the health display line; distinct from public-health program costs.',
  },
  public_health: {
    accountId: 'health_discretionary',
    rationale: 'Incremental public-health costs within the same health display line; do not count its $94B baseline again.',
  },
  housing: {
    accountId: 'housing',
    rationale: 'Incremental housing program costs; existing rental assistance is already in the baseline.',
  },
  justice: {
    accountId: 'justice',
    rationale: 'Incremental federal implementation costs; state/local fiscal effects must be accounted for separately.',
  },
});

export const MILITARY_OPPORTUNITY_COST_PRIOR = Object.freeze({
  low: 0.25,
  mode: 1,
  high: 10,
  distribution: 'triangular' as const,
  unit: 'discounted societal welfare loss in USD per military spending dollar reallocated',
  evidenceStatus: 'scenario assumption; not an empirical confidence interval',
  rationale: 'Military spending has an uncertain opportunity cost. This deliberately broad scenario prior prices lost services, transition costs, and security benefits; it is not calibrated from foreign spending levels.',
  limitations: 'The same value/time basis as program benefits is required. A bounded triangular prior cannot rule out catastrophic security losses or establish that a cut is safe. Test alternative bounds and larger losses separately.',
});

export const MILITARY_FUNDING_SCENARIOS = Object.freeze(
  ([0, 0.01, 0.05, 0.1] as const).map(militaryReductionFraction => Object.freeze({
    id: `military-${Math.round(militaryReductionFraction * 100)}-percent`,
    militaryReductionFraction,
    maximumReallocationUsd: 886 * BILLION * militaryReductionFraction,
    opportunityCostPerDollar: MILITARY_OPPORTUNITY_COST_PRIOR,
    rationale: militaryReductionFraction === 0
      ? 'Status quo: no military funding is made available.'
      : 'An optional reallocation ceiling, not a recommended cut. Only selected program costs are transferred; unused capacity remains in military spending.',
    uncertainty: 'The cut fraction is a policy choice, not a fitted optimum. Feasibility and lost defense benefits require separate review; all other existing spending is protected.',
  })),
);

export interface BudgetProgramIncrement {
  budgetAccount: PolicyBudgetAccount;
  annualCostUsd: number;
}

function cents(value: number): number {
  if (!Number.isFinite(value) || value < 0 || !Number.isSafeInteger(Math.round(value * 100))) {
    throw new Error('Budget amounts must be nonnegative finite USD within the supported range');
  }
  return Math.round(value * 100);
}

/**
 * Transfer only funded program costs, using integer cents for exact balance.
 * Two health programs add their increments to ONE existing health account.
 * Unused funding capacity is retained by the donor, never claimed as savings.
 */
export function applyBudgetReallocation(
  scenario: (typeof MILITARY_FUNDING_SCENARIOS)[number],
  increments: readonly BudgetProgramIncrement[],
) {
  const knownScenario = MILITARY_FUNDING_SCENARIOS.find(candidate => candidate.id === scenario.id);
  if (!knownScenario || knownScenario.maximumReallocationUsd !== scenario.maximumReallocationUsd) {
    throw new Error('Select a declared military funding scenario');
  }
  const additions = new Map<string, number>();
  let transferredCents = 0;
  for (const increment of increments) {
    if (!Object.hasOwn(POLICY_BUDGET_ACCOUNT_MAP, increment.budgetAccount)) {
      throw new Error('Program cost has no declared budget account');
    }
    const accountId = POLICY_BUDGET_ACCOUNT_MAP[increment.budgetAccount].accountId;
    const costCents = cents(increment.annualCostUsd);
    transferredCents += costCents;
    if (transferredCents > cents(knownScenario.maximumReallocationUsd)) {
      throw new Error('Program costs exceed the military reallocation ceiling');
    }
    additions.set(accountId, (additions.get(accountId) ?? 0) + costCents);
  }
  const lines = FEDERAL_BUDGET_BASELINE.lines.map(line => ({
    ...line,
    baselineOutlaysUsd: line.annualOutlaysUsd,
    annualOutlaysUsd: (
      cents(line.annualOutlaysUsd) + (additions.get(line.id) ?? 0) - (line.id === 'military' ? transferredCents : 0)
    ) / 100,
  }));
  if (lines.reduce((sum, line) => sum + cents(line.annualOutlaysUsd), 0) !== cents(totalOutlaysUsd)) {
    throw new Error('Budget reallocation did not preserve total federal outlays');
  }
  return {
    scenarioId: knownScenario.id,
    lines,
    totalOutlaysUsd,
    reallocatedUsd: transferredCents / 100,
    unusedReallocationCapacityUsd: (cents(knownScenario.maximumReallocationUsd) - transferredCents) / 100,
  };
}
