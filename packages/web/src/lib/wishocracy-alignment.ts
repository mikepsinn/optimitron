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
} from "@optimitron/wishocracy";
import { createEmptyAverageAllocations } from "@/lib/wishocracy-community";
import { WISHOCRATIC_ITEMS, type WishocraticItemId, getActualGovernmentAllocations } from "@/lib/wishocracy-data";

export const DEFAULT_ALIGNMENT_BOOTSTRAP_ITERATIONS = 250;
export const DEFAULT_ALIGNMENT_CONFIDENCE_LEVEL = 0.95;
export const DEFAULT_ALIGNMENT_BOOTSTRAP_SEED = 42;

const ALL_WISHOCRATIC_ITEM_IDS = Object.keys(WISHOCRATIC_ITEMS) as WishocraticItemId[];

export interface StoredWishocraticAllocation {
  userId: string;
  itemAId: string;
  itemBId: string;
  allocationA: number;
  allocationB: number;
  timestamp?: string | Date;
}

export interface CitizenPreferenceSummary {
  preferenceWeights: PreferenceWeight[];
  citizenAllocations: Record<WishocraticItemId, number>;
  preferenceGaps: PreferenceGap[];
  actualGovernmentAllocations: Record<WishocraticItemId, number>;
  totalAllocations: number;
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
  allocations: Record<WishocraticItemId, number>;
  unresolvedItems: string[];
  totalInput: number;
}

export interface PoliticianAlignmentResult {
  politicianId: string;
  name?: string;
  normalizedAllocations: Record<WishocraticItemId, number>;
  unresolvedItems: string[];
  alignment: AlignmentScore;
  preferenceGaps: PreferenceGap[];
}

function normalizeItemToken(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
}

const WISHOCRATIC_ITEM_LOOKUP = new Map<string, WishocraticItemId>();
for (const [itemId, item] of Object.entries(WISHOCRATIC_ITEMS)) {
  const typedItemId = itemId as WishocraticItemId;
  for (const alias of [typedItemId, item.slug, item.name]) {
    WISHOCRATIC_ITEM_LOOKUP.set(normalizeItemToken(alias), typedItemId);
  }
}

function toRawAllocationEntries(raw: RawPoliticianAllocations): Array<[string, number]> {
  if (Array.isArray(raw)) {
    return raw.map((entry) => [entry.category, entry.allocationPct]);
  }
  return Object.entries(raw);
}

function buildBudgetItems(currentAllocationPct?: Record<WishocraticItemId, number>) {
  return ALL_WISHOCRATIC_ITEM_IDS.map((itemId) => ({
    id: itemId,
    name: WISHOCRATIC_ITEMS[itemId].name,
    currentAllocationPct: currentAllocationPct?.[itemId] ?? 0,
  }));
}

function convertToPairwiseAllocations(
  allocations: StoredWishocraticAllocation[],
): PairwiseComparison[] {
  return allocations
    .filter(
      (allocation) =>
        ALL_WISHOCRATIC_ITEM_IDS.includes(allocation.itemAId as WishocraticItemId) &&
        ALL_WISHOCRATIC_ITEM_IDS.includes(allocation.itemBId as WishocraticItemId),
    )
    .map((allocation, index) => ({
      id: `wishocracy-${index}`,
      participantId: allocation.userId,
      itemAId: allocation.itemAId,
      itemBId: allocation.itemBId,
      allocationA: allocation.allocationA,
      timestamp:
        allocation.timestamp instanceof Date
          ? allocation.timestamp.toISOString()
          : allocation.timestamp ?? new Date(0).toISOString(),
    }));
}

export function resolveWishocraticItemId(input: string): WishocraticItemId | null {
  return WISHOCRATIC_ITEM_LOOKUP.get(normalizeItemToken(input)) ?? null;
}

export function mapVoteAllocationsToWishocraticItems(
  raw: RawPoliticianAllocations,
): NormalizedPoliticianAllocations {
  const totals = createEmptyAverageAllocations();
  const unresolvedItems: string[] = [];

  for (const [rawItemName, rawValue] of toRawAllocationEntries(raw)) {
    if (!Number.isFinite(rawValue) || rawValue < 0) {
      unresolvedItems.push(rawItemName);
      continue;
    }

    const itemId = resolveWishocraticItemId(rawItemName);
    if (!itemId) {
      unresolvedItems.push(rawItemName);
      continue;
    }

    totals[itemId] += rawValue;
  }

  const totalInput = Object.values(totals).reduce((sum, value) => sum + value, 0);
  if (totalInput === 0) {
    return {
      allocations: totals,
      unresolvedItems,
      totalInput,
    };
  }

  const normalized = createEmptyAverageAllocations();
  for (const categoryId of ALL_WISHOCRATIC_ITEM_IDS) {
    normalized[categoryId] = Number(((totals[categoryId] / totalInput) * 100).toFixed(1));
  }

  return {
    allocations: normalized,
    unresolvedItems,
    totalInput,
  };
}

export function buildCitizenPreferenceSummary(
  comparisons: StoredWishocraticAllocation[],
  options: {
    bootstrapIterations?: number;
    confidenceLevel?: number;
    bootstrapSeed?: number;
  } = {},
): CitizenPreferenceSummary {
  const pairwiseAllocations = convertToPairwiseAllocations(comparisons);
  const actualGovernmentAllocations = getActualGovernmentAllocations();

  if (pairwiseAllocations.length === 0) {
    return {
      preferenceWeights: [],
      citizenAllocations: createEmptyAverageAllocations(),
      preferenceGaps: [],
      actualGovernmentAllocations,
      totalAllocations: 0,
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
      pairwiseAllocations.flatMap((comparison) => [
        comparison.itemAId,
        comparison.itemBId,
      ]),
    ),
  ].sort();
  const entries = aggregateComparisons(pairwiseAllocations);
  const matrix = buildComparisonMatrix(itemIds, entries);
  const ciResult = bootstrapConfidenceIntervals(pairwiseAllocations, {
    iterations: bootstrapIterations,
    confidenceLevel,
    seed: bootstrapSeed,
  });
  const citizenAllocations = createEmptyAverageAllocations();

  for (const weight of ciResult.weights) {
    if (ALL_WISHOCRATIC_ITEM_IDS.includes(weight.itemId as WishocraticItemId)) {
      citizenAllocations[weight.itemId as WishocraticItemId] = Number(
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
    totalAllocations: pairwiseAllocations.length,
    totalParticipants: new Set(
      pairwiseAllocations.map((allocation) => allocation.participantId),
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
    const normalized = mapVoteAllocationsToWishocraticItems(politician.allocations);
    const alignment = calculateAlignmentScore(
      summary.preferenceWeights,
      new Map(Object.entries(normalized.allocations)),
      politician.politicianId,
    );

    return {
      politicianId: politician.politicianId,
      name: politician.name,
      normalizedAllocations: normalized.allocations,
      unresolvedItems: normalized.unresolvedItems,
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
