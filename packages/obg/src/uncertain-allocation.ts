/**
 * Finite, budget-constrained decisions under uncertainty.
 * Choose one allocation using expected net benefit, then evaluate that SAME
 * allocation across the draws. Optimizing separately in each draw would grant
 * the decision maker perfect information and overstate achievable benefits.
 */
export interface ModelRange {
  low: number;
  mode: number;
  high: number;
}

export interface SimulationSummary {
  mean: number;
  median: number;
  p05: number;
  p95: number;
  probabilityPositive: number;
}

export interface AllocationOption {
  id: string;
  group: string;
  annualCostUsd: number;
  /** Total monetized incremental benefit; do not add health a second time. */
  benefitDrawsUsd: readonly number[];
}

export interface UncertainAllocation {
  selectedOptionIds: string[];
  annualCostUsd: number;
  budgetCeilingUsd: number;
  unspentUsd: number;
  benefit: SimulationSummary;
  financingLoss: SimulationSummary;
  netBenefit: SimulationSummary;
  /** Count of common draws, not independent observations or trial subjects. */
  draws: number;
}

/** Reproducible browser-safe PRNG. Never use Math.random in report generation. */
export function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let n = Math.imul(state ^ (state >>> 15), 1 | state);
    n ^= n + Math.imul(n ^ (n >>> 7), 61 | n);
    return ((n ^ (n >>> 14)) >>> 0) / 4294967296;
  };
}

/** The caller documents whether bounds are scenario assumptions or evidence. */
export function sampleTriangular(
  range: ModelRange,
  random: () => number,
): number {
  const { low, mode, high } = range;
  if (![low, mode, high].every(Number.isFinite) || low > mode || mode > high) {
    throw new Error("A distribution needs finite low <= mode <= high");
  }
  if (low === high) return low;
  const u = random();
  const split = (mode - low) / (high - low);
  return u < split
    ? low + Math.sqrt(u * (high - low) * (mode - low))
    : high - Math.sqrt((1 - u) * (high - low) * (high - mode));
}

export function summarizeSimulation(
  values: readonly number[],
): SimulationSummary {
  if (!values.length || values.some((value) => !Number.isFinite(value))) {
    throw new Error("A simulation requires finite draws");
  }
  const sorted = [...values].sort((a, b) => a - b);
  const quantile = (p: number): number => {
    const position = (sorted.length - 1) * p;
    const lower = Math.floor(position);
    return (
      sorted[lower]! +
      (sorted[Math.ceil(position)]! - sorted[lower]!) * (position - lower)
    );
  };
  return {
    mean: values.reduce((sum, value) => sum + value, 0) / values.length,
    median: quantile(0.5),
    p05: quantile(0.05),
    p95: quantile(0.95),
    probabilityPositive:
      values.filter((value) => value > 0).length / values.length,
  };
}

/**
 * Multiple-choice knapsack. At most one option per group, including an
 * implicit do-nothing option. Overlapping interventions must share a group
 * with a jointly evaluated option; they must never be added independently.
 * Costs round UP to the decision grid, so feasibility is conservative.
 * Financing losses are sampled marginal welfare losses per reallocated USD,
 * on the same time/value basis as benefits. The reallocated dollar itself is
 * not deducted again: it was already spending in the baseline budget.
 */
export function optimizeWithUncertainty(
  options: readonly AllocationOption[],
  budgetCeilingUsd: number,
  financingLossPerDollar: readonly number[],
  gridUsd: number,
): UncertainAllocation {
  if (
    !Number.isFinite(budgetCeilingUsd) ||
    budgetCeilingUsd < 0 ||
    !Number.isFinite(gridUsd) ||
    gridUsd <= 0
  ) {
    throw new Error("Invalid budget or allocation grid");
  }
  const draws = financingLossPerDollar.length;
  if (
    !draws ||
    financingLossPerDollar.some((value) => !Number.isFinite(value) || value < 0)
  ) {
    throw new Error("Financing losses must be finite and nonnegative");
  }
  const ids = new Set<string>();
  const groups = new Map<string, AllocationOption[]>();
  const expectedLoss =
    financingLossPerDollar.reduce((sum, value) => sum + value, 0) / draws;
  const optionValues = new Map<string, number>();
  for (const option of options) {
    if (
      !option.id ||
      !option.group ||
      ids.has(option.id) ||
      !Number.isFinite(option.annualCostUsd) ||
      option.annualCostUsd <= 0
    ) {
      throw new Error(
        "Options need unique IDs, groups, and positive finite costs",
      );
    }
    if (
      option.benefitDrawsUsd.length !== draws ||
      option.benefitDrawsUsd.some((value) => !Number.isFinite(value))
    ) {
      throw new Error("Options must use the same finite simulation draws");
    }
    ids.add(option.id);
    groups.set(option.group, [...(groups.get(option.group) ?? []), option]);
    optionValues.set(
      option.id,
      option.benefitDrawsUsd.reduce((sum, value) => sum + value, 0) / draws -
        option.annualCostUsd * expectedLoss,
    );
  }
  const capacity = Math.floor(budgetCeilingUsd / gridUsd);
  if (capacity > 100_000) throw new Error("Allocation grid is too fine");
  type State = { value: number; selected: string[] };
  let states = new Array<State | undefined>(capacity + 1);
  states[0] = { value: 0, selected: [] };
  for (const group of groups.values()) {
    const next = [...states];
    for (let used = 0; used <= capacity; used++) {
      const state = states[used];
      if (!state) continue;
      for (const option of group) {
        const cost = Math.ceil(option.annualCostUsd / gridUsd);
        const target = used + cost;
        if (target > capacity) continue;
        const value = state.value + optionValues.get(option.id)!;
        const incumbent = next[target];
        if (!incumbent || value > incumbent.value) {
          next[target] = { value, selected: [...state.selected, option.id] };
        }
      }
    }
    states = next;
  }
  let best: State = states[0]!;
  for (const state of states)
    if (state && state.value > best.value) best = state;
  const selected = options.filter((option) =>
    best.selected.includes(option.id),
  );
  const annualCostUsd = selected.reduce(
    (sum, option) => sum + option.annualCostUsd,
    0,
  );
  const benefitDraws = Array.from({ length: draws }, (_, i) =>
    selected.reduce((sum, option) => sum + option.benefitDrawsUsd[i]!, 0),
  );
  const lossDraws = financingLossPerDollar.map(
    (value) => value * annualCostUsd,
  );
  return {
    selectedOptionIds: best.selected,
    annualCostUsd,
    budgetCeilingUsd,
    unspentUsd: budgetCeilingUsd - annualCostUsd,
    benefit: summarizeSimulation(benefitDraws),
    financingLoss: summarizeSimulation(lossDraws),
    netBenefit: summarizeSimulation(
      benefitDraws.map((value, i) => value - lossDraws[i]!),
    ),
    draws,
  };
}
