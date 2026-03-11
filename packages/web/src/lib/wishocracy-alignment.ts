import {
  aggregateComparisons,
  bootstrapConfidenceIntervals,
  buildComparisonMatrix,
  calculateAlignmentScore,
  calculatePreferenceGaps,
  consistencyRatio,
  rankPoliticians,
  type AlignmentScore,
  type PairwiseComparison,
  type PreferenceGap,
  type PreferenceWeight,
} from "@optomitron/wishocracy";
import { BUDGET_CATEGORIES, type BudgetCategoryId, getActualGovernmentAllocations } from "@/lib/wishocracy-data";

export const DEFAULT_ALIGNMENT_BOOTSTRAP_ITERATIONS = 250;
export const DEFAULT_ALIGNMENT_CONFIDENCE_LEVEL = 0.95;
export const DEFAULT_ALIGNMENT_BOOTSTRAP_SEED = 42;

const ALL_BUDGET_CATEGORY_IDS = Object.keys(BUDGET_CATEGORIES) as BudgetCategoryId[];

export interface StoredWishocraticComparison {
  userId: string;
  categoryA: string;
  categoryB: string;
  allocationA: number;
  allocationB: number;
  timestamp?: string | Date;
}

export interface CitizenPreferenceSummary {
  preferenceWeights: PreferenceWeight[];
  citizenAllocations: Record<BudgetCategoryId, number>;
  preferenceGaps: PreferenceGap[];
  actualGovernmentAllocations: Record<BudgetCategoryId, number>;
  totalComparisons: number;
  totalParticipants: number;
  itemsCompared: number;
  consistencyRatio: number;
  bootstrapIterations: number;
  confidenceLevel: number;
}

export type RawPoliticianAllocations =
  | Record<string, number>
  | Array<{
      category: string;
      allocationPct: number;
    }>;

export interface PoliticianAlignmentInput {
  politicianId: string;
  name?: string;
  allocations: RawPoliticianAllocations;
}

export interface NormalizedPoliticianAllocations {
  allocations: Record<BudgetCategoryId, number>;
  unresolvedCategories: string[];
  totalInput: number;
}

export interface PoliticianAlignmentResult {
  politicianId: string;
  name?: string;
  normalizedAllocations: Record<BudgetCategoryId, number>;
  unresolvedCategories: string[];
  alignment: AlignmentScore;
  preferenceGaps: PreferenceGap[];
}

function emptyAllocationRecord(): Record<BudgetCategoryId, number> {
  return ALL_BUDGET_CATEGORY_IDS.reduce(
    (record, categoryId) => {
      record[categoryId] = 0;
      return record;
    },
    {} as Record<BudgetCategoryId, number>,
  );
}

function normalizeCategoryToken(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
}

const CATEGORY_LOOKUP = new Map<string, BudgetCategoryId>();
for (const [categoryId, category] of Object.entries(BUDGET_CATEGORIES)) {
  const typedCategoryId = categoryId as BudgetCategoryId;
  for (const alias of [typedCategoryId, category.id, category.name]) {
    CATEGORY_LOOKUP.set(normalizeCategoryToken(alias), typedCategoryId);
  }
}

function toRawAllocationEntries(raw: RawPoliticianAllocations): Array<[string, number]> {
  if (Array.isArray(raw)) {
    return raw.map((entry) => [entry.category, entry.allocationPct]);
  }
  return Object.entries(raw);
}

function buildBudgetItems(currentAllocationPct?: Record<BudgetCategoryId, number>) {
  return ALL_BUDGET_CATEGORY_IDS.map((categoryId) => ({
    id: categoryId,
    name: BUDGET_CATEGORIES[categoryId].name,
    currentAllocationPct: currentAllocationPct?.[categoryId] ?? 0,
  }));
}

function convertToPairwiseComparisons(
  comparisons: StoredWishocraticComparison[],
): PairwiseComparison[] {
  return comparisons
    .filter(
      (comparison) =>
        ALL_BUDGET_CATEGORY_IDS.includes(comparison.categoryA as BudgetCategoryId) &&
        ALL_BUDGET_CATEGORY_IDS.includes(comparison.categoryB as BudgetCategoryId),
    )
    .map((comparison, index) => ({
      id: `wishocracy-${index}`,
      participantId: comparison.userId,
      itemAId: comparison.categoryA,
      itemBId: comparison.categoryB,
      allocationA: comparison.allocationA,
      timestamp:
        comparison.timestamp instanceof Date
          ? comparison.timestamp.toISOString()
          : comparison.timestamp ?? new Date(0).toISOString(),
    }));
}

export function resolveBudgetCategoryId(category: string): BudgetCategoryId | null {
  return CATEGORY_LOOKUP.get(normalizeCategoryToken(category)) ?? null;
}

export function mapVoteAllocationsToBudgetCategories(
  raw: RawPoliticianAllocations,
): NormalizedPoliticianAllocations {
  const totals = emptyAllocationRecord();
  const unresolvedCategories: string[] = [];

  for (const [rawCategory, rawValue] of toRawAllocationEntries(raw)) {
    if (!Number.isFinite(rawValue) || rawValue < 0) {
      unresolvedCategories.push(rawCategory);
      continue;
    }

    const categoryId = resolveBudgetCategoryId(rawCategory);
    if (!categoryId) {
      unresolvedCategories.push(rawCategory);
      continue;
    }

    totals[categoryId] += rawValue;
  }

  const totalInput = Object.values(totals).reduce((sum, value) => sum + value, 0);
  if (totalInput === 0) {
    return {
      allocations: totals,
      unresolvedCategories,
      totalInput,
    };
  }

  const normalized = emptyAllocationRecord();
  for (const categoryId of ALL_BUDGET_CATEGORY_IDS) {
    normalized[categoryId] = Number(((totals[categoryId] / totalInput) * 100).toFixed(1));
  }

  return {
    allocations: normalized,
    unresolvedCategories,
    totalInput,
  };
}

export function buildCitizenPreferenceSummary(
  comparisons: StoredWishocraticComparison[],
  options: {
    bootstrapIterations?: number;
    confidenceLevel?: number;
    bootstrapSeed?: number;
  } = {},
): CitizenPreferenceSummary {
  const pairwiseComparisons = convertToPairwiseComparisons(comparisons);
  const actualGovernmentAllocations = getActualGovernmentAllocations();

  if (pairwiseComparisons.length === 0) {
    return {
      preferenceWeights: [],
      citizenAllocations: emptyAllocationRecord(),
      preferenceGaps: [],
      actualGovernmentAllocations,
      totalComparisons: 0,
      totalParticipants: 0,
      itemsCompared: 0,
      consistencyRatio: 0,
      bootstrapIterations:
        options.bootstrapIterations ?? DEFAULT_ALIGNMENT_BOOTSTRAP_ITERATIONS,
      confidenceLevel:
        options.confidenceLevel ?? DEFAULT_ALIGNMENT_CONFIDENCE_LEVEL,
    };
  }

  const bootstrapIterations =
    options.bootstrapIterations ?? DEFAULT_ALIGNMENT_BOOTSTRAP_ITERATIONS;
  const confidenceLevel =
    options.confidenceLevel ?? DEFAULT_ALIGNMENT_CONFIDENCE_LEVEL;
  const bootstrapSeed =
    options.bootstrapSeed ?? DEFAULT_ALIGNMENT_BOOTSTRAP_SEED;

  const itemIds = [
    ...new Set(
      pairwiseComparisons.flatMap((comparison) => [
        comparison.itemAId,
        comparison.itemBId,
      ]),
    ),
  ].sort();
  const entries = aggregateComparisons(pairwiseComparisons);
  const matrix = buildComparisonMatrix(itemIds, entries);
  const ciResult = bootstrapConfidenceIntervals(pairwiseComparisons, {
    iterations: bootstrapIterations,
    confidenceLevel,
    seed: bootstrapSeed,
  });
  const citizenAllocations = emptyAllocationRecord();

  for (const weight of ciResult.weights) {
    if (ALL_BUDGET_CATEGORY_IDS.includes(weight.itemId as BudgetCategoryId)) {
      citizenAllocations[weight.itemId as BudgetCategoryId] = Number(
        (weight.weight * 100).toFixed(1),
      );
    }
  }

  return {
    preferenceWeights: ciResult.weights,
    citizenAllocations,
    preferenceGaps: calculatePreferenceGaps(
      ciResult.weights,
      buildBudgetItems(actualGovernmentAllocations),
    ),
    actualGovernmentAllocations,
    totalComparisons: pairwiseComparisons.length,
    totalParticipants: new Set(
      pairwiseComparisons.map((comparison) => comparison.participantId),
    ).size,
    itemsCompared: itemIds.length,
    consistencyRatio: consistencyRatio(matrix),
    bootstrapIterations,
    confidenceLevel,
  };
}

export function buildPoliticianAlignmentResults(
  summary: CitizenPreferenceSummary,
  politicians: PoliticianAlignmentInput[],
): {
  politicians: PoliticianAlignmentResult[];
  ranking: AlignmentScore[];
} {
  const politiciansWithResults = politicians.map((politician) => {
    const normalized = mapVoteAllocationsToBudgetCategories(politician.allocations);
    const alignment = calculateAlignmentScore(
      summary.preferenceWeights,
      new Map(Object.entries(normalized.allocations)),
      politician.politicianId,
    );

    return {
      politicianId: politician.politicianId,
      name: politician.name,
      normalizedAllocations: normalized.allocations,
      unresolvedCategories: normalized.unresolvedCategories,
      alignment,
      preferenceGaps: calculatePreferenceGaps(
        summary.preferenceWeights,
        buildBudgetItems(normalized.allocations),
      ),
    };
  });

  return {
    politicians: politiciansWithResults,
    ranking: rankPoliticians(
      politiciansWithResults.map((politician) => politician.alignment),
    ),
  };
}
