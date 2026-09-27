import { calculateWelfare, WelfareFunctionConfigSchema } from '@optimitron/opg';
import type { WelfareFunctionConfig } from '@optimitron/opg';
import { marginalReturn, predictOutcome } from './diminishing-returns.js';
import type { DiminishingReturnsModel } from './diminishing-returns.js';
import { summarizeSimulation } from './uncertain-allocation.js';
import type { SimulationSummary } from './uncertain-allocation.js';

/**
 * Category effects on the same jurisdiction's population medians. The spending
 * argument is total USD, not per-capita spending or a national/federal proxy.
 * Curves must describe additive category effects on a common time horizon;
 * fitting a correlation or relabeling population HALE does not establish this.
 */
export interface WelfareBudgetResponse {
  incomeGrowthPpYear: DiminishingReturnsModel;
  medianHealthyLifeYears: DiminishingReturnsModel;
}

export interface WelfareBudgetCategory {
  id: string;
  currentSpendingUsd: number;
  minSpendingUsd: number;
  maxSpendingUsd: number;
  /** Used when curveDraws is absent. Omit only for an unchanged fixed line. */
  response?: WelfareBudgetResponse;
}

export interface WelfareBudgetInput {
  totalBudgetUsd: number;
  categories: readonly WelfareBudgetCategory[];
  welfareConfig?: WelfareFunctionConfig;
  /**
   * Paired bootstrap/posterior draws across categories AND endpoints. Selection
   * maximizes their mean welfare; uncertainty evaluates that one budget in
   * every draw. The caller preserves dependence when constructing these draws.
   * When supplied, these replace category.response for selection and reporting.
   */
  curveDraws?: readonly Readonly<Record<string, WelfareBudgetResponse>>[];
}

export interface WelfareBudgetEffect {
  incomeGrowthPpYearChange: number;
  medianHealthyLifeYearsChange: number;
  welfareChange: number;
}

export interface WelfareBudgetResult {
  totalBudgetUsd: number;
  allocatedBudgetUsd: number;
  welfareConfig: WelfareFunctionConfig;
  objective: 'expected_two_metric_welfare';
  allocations: (WelfareBudgetEffect & {
    id: string;
    currentSpendingUsd: number;
    spendingUsd: number;
    changeUsd: number;
  })[];
  expectedEffect: WelfareBudgetEffect;
  /** Marginal weighted endpoint units per USD, not a monetary return. */
  shadowPrice: number;
  /** Model-draw intervals, not confidence in causal identification. */
  uncertainty: {
    draws: number;
    incomeGrowthPpYearChange: SimulationSummary;
    medianHealthyLifeYearsChange: SimulationSummary;
    welfareChange: SimulationSummary;
  } | null;
}

type PreparedCategory = {
  category: WelfareBudgetCategory;
  responses: (WelfareBudgetResponse | undefined)[];
  marginal: (spending: number) => number;
};

function validateModel(model: DiminishingReturnsModel, lowestSpending: number): void {
  if (
    !Number.isFinite(model.alpha) || !Number.isFinite(model.beta) || model.beta < 0 ||
    (model.type !== 'log' && model.type !== 'saturation') ||
    (model.type === 'log' && lowestSpending < 0.001) ||
    (model.type === 'saturation' && (!Number.isFinite(model.gamma) || model.gamma! <= 0))
  ) {
    throw new Error('Welfare curves need finite coefficients, nonnegative beta, positive saturation gamma, and log spending >= $0.001');
  }
}

function prepareCategory(
  category: WelfareBudgetCategory,
  draws: WelfareBudgetInput['curveDraws'],
  config: WelfareFunctionConfig,
): PreparedCategory {
  const responses = draws
    ? draws.map(draw => draw[category.id])
    : [category.response];
  const unchangedFixed = category.minSpendingUsd === category.maxSpendingUsd &&
    category.currentSpendingUsd === category.minSpendingUsd;
  // Marginal returns are linear in beta. Combining identical curve shapes
  // avoids repeatedly iterating thousands of fixed-gamma bootstrap fits.
  const terms = new Map<string, DiminishingReturnsModel>();
  for (const response of responses) {
    if (!response) {
      if (!unchangedFixed) throw new Error(`Missing both welfare response curves for ${category.id}`);
      continue;
    }
    for (const endpoint of ['incomeGrowthPpYear', 'medianHealthyLifeYears'] as const) {
      const model = response[endpoint];
      validateModel(model, Math.min(category.minSpendingUsd, category.currentSpendingUsd));
      const beta = calculateWelfare({
        incomeGrowth: endpoint === 'incomeGrowthPpYear' ? model.beta : 0,
        healthyLifeYears: endpoint === 'medianHealthyLifeYears' ? model.beta : 0,
      }, config) / responses.length;
      const key = `${model.type}:${model.type === 'saturation' ? model.gamma : ''}`;
      const previous = terms.get(key);
      terms.set(key, { ...model, alpha: 0, beta: beta + (previous?.beta ?? 0) });
    }
  }
  const models = [...terms.values()];
  return {
    category,
    responses,
    marginal: spending => models.reduce((sum, model) => sum + marginalReturn(spending, model), 0),
  };
}

function spendingAtPrice(prepared: PreparedCategory, price: number): number {
  const { category, marginal } = prepared;
  let low = category.minSpendingUsd;
  let high = category.maxSpendingUsd;
  if (marginal(low) <= price) return low;
  if (marginal(high) >= price) return high;
  for (let iteration = 0; iteration < 64; iteration++) {
    const middle = low + (high - low) / 2;
    if (marginal(middle) > price) low = middle;
    else high = middle;
  }
  return low + (high - low) / 2;
}

function effectAt(
  response: WelfareBudgetResponse | undefined,
  current: number,
  spending: number,
  config: WelfareFunctionConfig,
): WelfareBudgetEffect {
  const incomeGrowthPpYearChange = response
    ? predictOutcome(spending, response.incomeGrowthPpYear) - predictOutcome(current, response.incomeGrowthPpYear)
    : 0;
  const medianHealthyLifeYearsChange = response
    ? predictOutcome(spending, response.medianHealthyLifeYears) - predictOutcome(current, response.medianHealthyLifeYears)
    : 0;
  const welfareChange = calculateWelfare({ incomeGrowth: incomeGrowthPpYearChange, healthyLifeYears: medianHealthyLifeYearsChange }, config);
  if (![incomeGrowthPpYearChange, medianHealthyLifeYearsChange, welfareChange].every(Number.isFinite)) {
    throw new Error('Welfare response evaluation must be finite');
  }
  return { incomeGrowthPpYearChange, medianHealthyLifeYearsChange, welfareChange };
}

/**
 * Solve the OBG paper's separable concave planner problem, with rho=0:
 * maximize sum_i E[alpha * income_i(s_i) + (1-alpha) * health_i(s_i)],
 * subject to sum_i s_i = B and each category's supplied spending bounds.
 *
 * Bisection equalizes expected marginal welfare for interior allocations;
 * bounds implement the remaining KKT conditions. No independent OSL rescaling
 * or monetization is used. Nonconcave curves are rejected, not silently clipped.
 * This solves the supplied model; it does not establish its causal calibration.
 */
export function optimizeWelfareBudget(input: WelfareBudgetInput): WelfareBudgetResult {
  const config = WelfareFunctionConfigSchema.parse(input.welfareConfig ?? {});
  const budget = input.totalBudgetUsd;
  const ids = new Set<string>();
  if (!Number.isFinite(budget) || budget < 0 || input.categories.length === 0 ||
      (input.curveDraws?.length === 0)) {
    throw new Error('Supply a finite nonnegative budget, categories, and nonempty draws when used');
  }
  for (const category of input.categories) {
    if (!category.id || ids.has(category.id) ||
        ![category.currentSpendingUsd, category.minSpendingUsd, category.maxSpendingUsd].every(Number.isFinite) ||
        category.currentSpendingUsd < 0 || category.minSpendingUsd < 0 || category.maxSpendingUsd < category.minSpendingUsd) {
      throw new Error('Categories need unique IDs and finite nonnegative spending with min <= max');
    }
    ids.add(category.id);
  }
  const total = (key: 'currentSpendingUsd' | 'minSpendingUsd' | 'maxSpendingUsd') =>
    input.categories.reduce((sum, category) => sum + category[key], 0);
  const tolerance = Math.max(1e-8, budget * 1e-12);
  if (Math.abs(total('currentSpendingUsd') - budget) > tolerance) {
    throw new Error('Current category spending must account for the complete budget');
  }
  if (total('minSpendingUsd') > budget || total('maxSpendingUsd') < budget) {
    throw new Error('Spending bounds cannot allocate the complete budget');
  }
  const prepared = input.categories.map(category => prepareCategory(category, input.curveDraws, config));
  let lowPrice = 0;
  let highPrice = Math.max(0, ...prepared
    .filter(row => row.category.minSpendingUsd < row.category.maxSpendingUsd)
    .map(row => row.marginal(row.category.minSpendingUsd)));
  if (!Number.isFinite(highPrice)) throw new Error('Marginal welfare must be finite');
  let spending = prepared.map(row => row.category.minSpendingUsd);
  for (let iteration = 0; iteration < 128; iteration++) {
    const price = lowPrice + (highPrice - lowPrice) / 2;
    const candidate = prepared.map(row => spendingAtPrice(row, price));
    if (candidate.reduce((sum, value) => sum + value, 0) > budget) lowPrice = price;
    else {
      highPrice = price;
      spending = candidate;
    }
  }
  // The feasible side of bisection leaves only floating point residue, except
  // when flat curves can absorb surplus. Prefer unchanged spending on ties.
  let remaining = budget - spending.reduce((sum, value) => sum + value, 0);
  if (remaining > tolerance && prepared.some((row, index) =>
    row.category.maxSpendingUsd - spending[index]! > tolerance && row.marginal(spending[index]!) > 0)) {
    throw new Error('Marginal-price search did not converge at the supplied curve scales');
  }
  const fillOrder = prepared.map((row, index) => ({ row, index }))
    .sort((a, b) => b.row.marginal(spending[b.index]!) - a.row.marginal(spending[a.index]!));
  for (const preserveCurrent of [true, false]) {
    for (const { row, index } of fillOrder) {
      const ceiling = preserveCurrent
        ? Math.min(row.category.currentSpendingUsd, row.category.maxSpendingUsd)
        : row.category.maxSpendingUsd;
      const addition = Math.min(remaining, Math.max(0, ceiling - spending[index]!));
      spending[index]! += addition;
      remaining -= addition;
    }
  }
  const effectsByCategory = prepared.map((row, index) => row.responses.map(response =>
    effectAt(response, row.category.currentSpendingUsd, spending[index]!, config)));
  const meanEffect = (effects: WelfareBudgetEffect[]): WelfareBudgetEffect => ({
    incomeGrowthPpYearChange: effects.reduce((sum, effect) => sum + effect.incomeGrowthPpYearChange, 0) / effects.length,
    medianHealthyLifeYearsChange: effects.reduce((sum, effect) => sum + effect.medianHealthyLifeYearsChange, 0) / effects.length,
    welfareChange: effects.reduce((sum, effect) => sum + effect.welfareChange, 0) / effects.length,
  });
  const totals = prepared[0]!.responses.map((_, draw) => effectsByCategory.reduce((sum, effects) => ({
    incomeGrowthPpYearChange: sum.incomeGrowthPpYearChange + effects[draw]!.incomeGrowthPpYearChange,
    medianHealthyLifeYearsChange: sum.medianHealthyLifeYearsChange + effects[draw]!.medianHealthyLifeYearsChange,
    welfareChange: sum.welfareChange + effects[draw]!.welfareChange,
  }), { incomeGrowthPpYearChange: 0, medianHealthyLifeYearsChange: 0, welfareChange: 0 }));
  return {
    totalBudgetUsd: budget,
    allocatedBudgetUsd: spending.reduce((sum, value) => sum + value, 0),
    welfareConfig: config,
    objective: 'expected_two_metric_welfare',
    allocations: prepared.map((row, index) => ({
      id: row.category.id,
      currentSpendingUsd: row.category.currentSpendingUsd,
      spendingUsd: spending[index]!,
      changeUsd: spending[index]! - row.category.currentSpendingUsd,
      ...meanEffect(effectsByCategory[index]!),
    })),
    expectedEffect: meanEffect(totals),
    shadowPrice: highPrice,
    uncertainty: input.curveDraws ? {
      draws: totals.length,
      incomeGrowthPpYearChange: summarizeSimulation(totals.map(effect => effect.incomeGrowthPpYearChange)),
      medianHealthyLifeYearsChange: summarizeSimulation(totals.map(effect => effect.medianHealthyLifeYearsChange)),
      welfareChange: summarizeSimulation(totals.map(effect => effect.welfareChange)),
    } : null,
  };
}
