/**
 * Minimum Effective Spending (Floor) Detection
 *
 * Given spending deciles and outcomes, find the lowest spending level
 * that performs within tolerance of the highest-spending decile.
 */

export interface SpendingDecile {
  decile: number;
  avgSpending: number;
  outcome: number;
}

export interface SpendingDecileCategory {
  categoryId: string;
  categoryName?: string;
  deciles: SpendingDecile[];
}

export interface MinimumEffectiveSpendingConfig {
  outcomeTolerance?: number;
  outcomeDirection?: 'higher' | 'lower';
}

export interface MinimumEffectiveSpendingResult {
  categoryId: string;
  categoryName?: string;
  floorDecile: number | null;
  floorSpending: number;
  floorOutcome: number;
  topDecile: number | null;
  topSpending: number;
  topOutcome: number;
  outcomeGap: number;
}

const DEFAULT_CONFIG: Required<MinimumEffectiveSpendingConfig> = {
  outcomeTolerance: 1,
  outcomeDirection: 'higher',
};

function normalizeDeciles(deciles: SpendingDecile[]): SpendingDecile[] {
  return deciles
    .filter(d => Number.isFinite(d.avgSpending) && Number.isFinite(d.outcome))
    .sort((a, b) => a.avgSpending - b.avgSpending);
}

function clampTolerance(value?: number): number {
  if (!Number.isFinite(value)) return DEFAULT_CONFIG.outcomeTolerance;
  return Math.max(0, value ?? DEFAULT_CONFIG.outcomeTolerance);
}

function isWithinTolerance(
  outcome: number,
  topOutcome: number,
  direction: 'higher' | 'lower',
  tolerance: number,
): boolean {
  return direction === 'higher'
    ? outcome >= topOutcome - tolerance
    : outcome <= topOutcome + tolerance;
}

function computeOutcomeGap(
  topOutcome: number,
  floorOutcome: number,
  direction: 'higher' | 'lower',
): number {
  return direction === 'higher'
    ? topOutcome - floorOutcome
    : floorOutcome - topOutcome;
}

function emptyResult(category: SpendingDecileCategory): MinimumEffectiveSpendingResult {
  return {
    categoryId: category.categoryId,
    categoryName: category.categoryName,
    floorDecile: null,
    floorSpending: 0,
    floorOutcome: 0,
    topDecile: null,
    topSpending: 0,
    topOutcome: 0,
    outcomeGap: 0,
  };
}

/**
 * Find the minimum effective spending level per category.
 */
export function findMinimumEffectiveSpending(
  categories: SpendingDecileCategory[],
  config: MinimumEffectiveSpendingConfig = {},
): MinimumEffectiveSpendingResult[] {
  const tolerance = clampTolerance(config.outcomeTolerance);
  const direction = config.outcomeDirection ?? DEFAULT_CONFIG.outcomeDirection;

  return categories.map((category) => {
    const deciles = normalizeDeciles(category.deciles);
    if (deciles.length === 0) return emptyResult(category);

    const top = deciles[deciles.length - 1]!;
    const floor = deciles.find(d =>
      isWithinTolerance(d.outcome, top.outcome, direction, tolerance),
    ) ?? top;

    return {
      categoryId: category.categoryId,
      categoryName: category.categoryName,
      floorDecile: floor.decile,
      floorSpending: floor.avgSpending,
      floorOutcome: floor.outcome,
      topDecile: top.decile,
      topSpending: top.avgSpending,
      topOutcome: top.outcome,
      outcomeGap: computeOutcomeGap(top.outcome, floor.outcome, direction),
    };
  });
}
