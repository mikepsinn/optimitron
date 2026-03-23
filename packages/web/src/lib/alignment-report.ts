import type { PreferenceGap } from "@optimitron/wishocracy";
import type {
  AlignmentBenchmarkProfile,
  AlignmentBenchmarkSourceType,
} from "@/lib/alignment-benchmarks";
import {
  buildCitizenPreferenceSummary,
  buildPoliticianAlignmentResults,
  type PoliticianAlignmentResult,
  type StoredWishocraticAllocation,
} from "@/lib/wishocracy-alignment";
import {
  isValidWishocraticAllocation,
  normalizeWishocraticAllocation,
} from "@/lib/wishocracy-community";
import { calculateTotalPairs } from "@/lib/wishocracy-utils";
import { WISHOCRATIC_ITEMS, type WishocraticItemId } from "@/lib/wishocracy-data";
import { ROUTES } from "@/lib/routes";

const ALL_WISHOCRATIC_ITEM_IDS = Object.keys(WISHOCRATIC_ITEMS) as WishocraticItemId[];
const ALIGNMENT_GAP_THRESHOLD_PCT = 0.5;

const PERSONAL_ALIGNMENT_PRELIMINARY_ALLOCATION_THRESHOLD = 10;
const PERSONAL_ALIGNMENT_PRELIMINARY_COMPLETION_THRESHOLD = 0.5;

export interface AlignmentPriorityHighlight {
  itemId: WishocraticItemId;
  name: string;
  icon: string;
  percentage: number;
}

export interface AlignmentGapHighlight {
  itemId: string;
  itemName: string;
  preferredPct: number;
  actualPct: number;
  gapPct: number;
}

export interface AlignmentGapHighlights {
  wantsMore: AlignmentGapHighlight[];
  wantsLess: AlignmentGapHighlight[];
  closestMatches: AlignmentGapHighlight[];
}

export interface PersonalAlignmentRankingEntry {
  rank: number;
  politicianId: string;
  name: string;
  party: string;
  title: string;
  score: number;
  votesCompared: number;
}

export interface PersonalAlignmentCandidateReport
  extends PersonalAlignmentRankingEntry {
  chamber?: string;
  district?: string;
  categoriesCovered?: number;
  rollCallCount?: number;
  summary: string;
  sourceLabel: string;
  sourceNote: string;
  sourceType: AlignmentBenchmarkProfile["sourceType"];
  normalizedAllocations: Record<WishocraticItemId, number>;
  unresolvedItems: string[];
  wantsMore: AlignmentGapHighlight[];
  wantsLess: AlignmentGapHighlight[];
  closestMatches: AlignmentGapHighlight[];
}

export interface PersonalAlignmentReport {
  generatedAt: string;
  allocationCount: number;
  selectedItemCount: number;
  totalPossiblePairs: number;
  completionRatio: number;
  isPreliminary: boolean;
  candidateSourceType: AlignmentBenchmarkSourceType | "mixed";
  candidateSourceNote: string;
  candidateLastSyncedAt: string | null;
  topPriorities: AlignmentPriorityHighlight[];
  ranking: PersonalAlignmentRankingEntry[];
  politicians: PersonalAlignmentCandidateReport[];
}

export type PersonalAlignmentEmptyReason =
  | "no_allocations"
  | "single_category"
  | "insufficient_data";

export interface PersonalAlignmentEmptyState {
  status: "empty";
  reason: PersonalAlignmentEmptyReason;
  allocationCount: number;
  selectedItemCount: number;
  totalPossiblePairs: number;
  completionRatio: number;
  headline: string;
  description: string;
  ctaHref: string;
  ctaLabel: string;
}

export interface PersonalAlignmentReadyState {
  status: "ready";
  report: PersonalAlignmentReport;
}

export type PersonalAlignmentState =
  | PersonalAlignmentEmptyState
  | PersonalAlignmentReadyState;

function toGapHighlight(gap: PreferenceGap): AlignmentGapHighlight {
  return {
    itemId: gap.itemId,
    itemName: gap.itemName,
    preferredPct: Number(gap.preferredPct.toFixed(1)),
    actualPct: Number(gap.actualPct.toFixed(1)),
    gapPct: Number(gap.gapPct.toFixed(1)),
  };
}

export function dedupeLatestWishocraticAllocations(
  comparisons: StoredWishocraticAllocation[],
): StoredWishocraticAllocation[] {
  const latestByPair = new Map<
    string,
    StoredWishocraticAllocation & { itemAId: WishocraticItemId; itemBId: WishocraticItemId }
  >();

  for (const comparison of comparisons) {
    const normalized = normalizeWishocraticAllocation(comparison);
    if (!isValidWishocraticAllocation(normalized)) {
      continue;
    }

    const key = `${normalized.itemAId}_${normalized.itemBId}`;
    const existing = latestByPair.get(key);
    const normalizedTimestamp =
      normalized.timestamp instanceof Date
        ? normalized.timestamp
        : normalized.timestamp
          ? new Date(normalized.timestamp)
          : new Date(0);
    const existingTimestamp =
      existing?.timestamp instanceof Date
        ? existing.timestamp
        : existing?.timestamp
          ? new Date(existing.timestamp)
          : new Date(0);

    if (!existing || normalizedTimestamp >= existingTimestamp) {
      latestByPair.set(key, {
        ...normalized,
        itemAId: normalized.itemAId,
        itemBId: normalized.itemBId,
      });
    }
  }

  return Array.from(latestByPair.values()).sort((a, b) => {
    const timestampA =
      a.timestamp instanceof Date ? a.timestamp.getTime() : new Date(a.timestamp ?? 0).getTime();
    const timestampB =
      b.timestamp instanceof Date ? b.timestamp.getTime() : new Date(b.timestamp ?? 0).getTime();
    return timestampA - timestampB;
  });
}

export function resolveSelectedCategoryCount(
  selectedItemCount: number,
  hasAllocations: boolean,
): number {
  if (selectedItemCount > 0) {
    return selectedItemCount;
  }

  if (hasAllocations) {
    return ALL_WISHOCRATIC_ITEM_IDS.length;
  }

  return ALL_WISHOCRATIC_ITEM_IDS.length;
}

export function calculateAlignmentCompletionRatio(
  allocationCount: number,
  totalPossiblePairs: number,
): number {
  if (totalPossiblePairs <= 0) {
    return 0;
  }

  return Number(Math.min(1, allocationCount / totalPossiblePairs).toFixed(3));
}

export function buildTopPriorityHighlights(
  allocations: Record<WishocraticItemId, number>,
  limit: number = 5,
): AlignmentPriorityHighlight[] {
  return Object.entries(allocations)
    .map(([itemId, percentage]) => ({
      itemId: itemId as WishocraticItemId,
      name: WISHOCRATIC_ITEMS[itemId as WishocraticItemId].name,
      icon: WISHOCRATIC_ITEMS[itemId as WishocraticItemId].icon,
      percentage: Number(percentage.toFixed(1)),
    }))
    .filter((highlight) => highlight.percentage > 0)
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, limit);
}

export function summarizePreferenceGaps(
  gaps: PreferenceGap[],
  limit: number = 3,
): AlignmentGapHighlights {
  const closestMatches = [...gaps]
    .sort((a, b) => Math.abs(a.gapPct) - Math.abs(b.gapPct))
    .slice(0, limit)
    .map(toGapHighlight);

  const wantsMore = gaps
    .filter((gap) => gap.gapPct > ALIGNMENT_GAP_THRESHOLD_PCT)
    .slice(0, limit)
    .map(toGapHighlight);

  const wantsLess = gaps
    .filter((gap) => gap.gapPct < -ALIGNMENT_GAP_THRESHOLD_PCT)
    .slice(0, limit)
    .map(toGapHighlight);

  return {
    wantsMore,
    wantsLess,
    closestMatches,
  };
}

function findPoliticianResult(
  politicianResults: PoliticianAlignmentResult[],
  politicianId: string,
): PoliticianAlignmentResult {
  const result = politicianResults.find(
    (politician) => politician.politicianId === politicianId,
  );

  if (!result) {
    throw new Error(`Missing alignment result for politician ${politicianId}.`);
  }

  return result;
}

export function buildPersonalAlignmentReport(input: {
  comparisons: StoredWishocraticAllocation[];
  selectedItemCount: number;
  benchmarkProfiles: AlignmentBenchmarkProfile[];
  generatedAt?: string;
  candidateSourceType?: AlignmentBenchmarkSourceType | "mixed";
  candidateSourceNote?: string;
  candidateLastSyncedAt?: string | null;
}): PersonalAlignmentReport {
  const comparisons = dedupeLatestWishocraticAllocations(input.comparisons);
  const selectedItemCount = resolveSelectedCategoryCount(
    input.selectedItemCount,
    comparisons.length > 0,
  );
  const totalPossiblePairs = calculateTotalPairs(selectedItemCount);
  const completionRatio = calculateAlignmentCompletionRatio(
    comparisons.length,
    totalPossiblePairs,
  );
  const summary = buildCitizenPreferenceSummary(comparisons);
  const results = buildPoliticianAlignmentResults(
    summary,
    input.benchmarkProfiles.map((politician) => ({
      politicianId: politician.politicianId,
      name: politician.name,
      allocations: politician.allocations,
    })),
  );

  const ranking: PersonalAlignmentRankingEntry[] = results.ranking.map((score, index) => {
    const politician = input.benchmarkProfiles.find(
      (profile) => profile.politicianId === score.politicianId,
    );
    if (!politician) {
      throw new Error(`Missing benchmark profile for politician ${score.politicianId}.`);
    }

    return {
      rank: index + 1,
      politicianId: politician.politicianId,
      name: politician.name,
      party: politician.party,
      title: politician.title,
      score: Number(score.score.toFixed(1)),
      votesCompared: score.votesCompared,
    };
  });
  const fallbackCandidateSourceNote = input.benchmarkProfiles[0]?.sourceNote ?? "";

  const politicians = ranking.map((entry) => {
    const politician = input.benchmarkProfiles.find(
      (profile) => profile.politicianId === entry.politicianId,
    );
    if (!politician) {
      throw new Error(`Missing benchmark profile for politician ${entry.politicianId}.`);
    }

    const result = findPoliticianResult(results.politicians, entry.politicianId);
    const gapHighlights = summarizePreferenceGaps(result.preferenceGaps);

    return {
      ...entry,
      chamber: politician.chamber,
      categoriesCovered: politician.categoriesCovered,
      district: politician.district,
      rollCallCount: politician.rollCallCount,
      summary: politician.summary,
      sourceLabel: politician.sourceLabel,
      sourceNote: politician.sourceNote,
      sourceType: politician.sourceType,
      normalizedAllocations: result.normalizedAllocations,
      unresolvedItems: result.unresolvedItems,
      wantsMore: gapHighlights.wantsMore,
      wantsLess: gapHighlights.wantsLess,
      closestMatches: gapHighlights.closestMatches,
    };
  });

  return {
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    allocationCount: comparisons.length,
    selectedItemCount,
    totalPossiblePairs,
    completionRatio,
    isPreliminary:
      comparisons.length < PERSONAL_ALIGNMENT_PRELIMINARY_ALLOCATION_THRESHOLD &&
      completionRatio < PERSONAL_ALIGNMENT_PRELIMINARY_COMPLETION_THRESHOLD,
    candidateSourceType: input.candidateSourceType ?? "curated_real",
    candidateSourceNote: input.candidateSourceNote ?? fallbackCandidateSourceNote,
    candidateLastSyncedAt: input.candidateLastSyncedAt ?? null,
    topPriorities: buildTopPriorityHighlights(summary.citizenAllocations),
    ranking,
    politicians,
  };
}

export function buildEmptyPersonalAlignmentState(input: {
  allocationCount: number;
  selectedItemCount: number;
}): PersonalAlignmentEmptyState {
  const selectedItemCount = resolveSelectedCategoryCount(
    input.selectedItemCount,
    input.allocationCount > 0,
  );
  const totalPossiblePairs = calculateTotalPairs(selectedItemCount);

  if (input.selectedItemCount === 1) {
    return {
      status: "empty",
      reason: "single_category",
      allocationCount: input.allocationCount,
      selectedItemCount,
      totalPossiblePairs,
      completionRatio: 0,
      headline: "Pick at least two categories",
      description:
        "A personal alignment report needs trade-offs. Add one more category or compare across the full budget set.",
      ctaHref: ROUTES.wishocracy,
      ctaLabel: "Update Categories",
    };
  }

  if (input.allocationCount > 0) {
    return {
      status: "empty",
      reason: "insufficient_data",
      allocationCount: input.allocationCount,
      selectedItemCount,
      totalPossiblePairs,
      completionRatio: calculateAlignmentCompletionRatio(
        input.allocationCount,
        totalPossiblePairs,
      ),
      headline: "Add a few more trade-offs",
      description:
        "You have some saved data, but not enough to produce a stable report yet. Keep comparing budget pairs to sharpen the signal.",
      ctaHref: ROUTES.wishocracy,
      ctaLabel: "Continue Comparing",
    };
  }

  return {
    status: "empty",
    reason: "no_allocations",
    allocationCount: 0,
    selectedItemCount,
    totalPossiblePairs,
    completionRatio: 0,
    headline: "Generate your first alignment report",
    description:
      "Save budget trade-offs in Wishocracy, then compare your priorities against benchmark politicians.",
    ctaHref: ROUTES.wishocracy,
    ctaLabel: "Start Wishocracy",
  };
}
