import type { PreferenceGap } from "@optomitron/wishocracy";
import type {
  AlignmentBenchmarkProfile,
  AlignmentBenchmarkSourceType,
} from "@/lib/alignment-benchmarks";
import {
  buildCitizenPreferenceSummary,
  buildPoliticianAlignmentResults,
  type PoliticianAlignmentResult,
  type StoredWishocraticComparison,
} from "@/lib/wishocracy-alignment";
import {
  isValidWishocraticComparison,
  normalizeWishocraticComparison,
} from "@/lib/wishocracy-community";
import { calculateTotalPairs } from "@/lib/wishocracy-utils";
import { BUDGET_CATEGORIES, type BudgetCategoryId } from "@/lib/wishocracy-data";
import { ROUTES } from "@/lib/routes";

const ALL_BUDGET_CATEGORY_IDS = Object.keys(BUDGET_CATEGORIES) as BudgetCategoryId[];
const ALIGNMENT_GAP_THRESHOLD_PCT = 0.5;

export const PERSONAL_ALIGNMENT_PRELIMINARY_COMPARISON_THRESHOLD = 10;
export const PERSONAL_ALIGNMENT_PRELIMINARY_COMPLETION_THRESHOLD = 0.5;

export interface AlignmentPriorityHighlight {
  categoryId: BudgetCategoryId;
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
  normalizedAllocations: Record<BudgetCategoryId, number>;
  unresolvedCategories: string[];
  wantsMore: AlignmentGapHighlight[];
  wantsLess: AlignmentGapHighlight[];
  closestMatches: AlignmentGapHighlight[];
}

export interface PersonalAlignmentReport {
  generatedAt: string;
  comparisonCount: number;
  selectedCategoryCount: number;
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
  | "no_comparisons"
  | "single_category"
  | "insufficient_data";

export interface PersonalAlignmentEmptyState {
  status: "empty";
  reason: PersonalAlignmentEmptyReason;
  comparisonCount: number;
  selectedCategoryCount: number;
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

export function dedupeLatestWishocraticComparisons(
  comparisons: StoredWishocraticComparison[],
): StoredWishocraticComparison[] {
  const latestByPair = new Map<
    string,
    StoredWishocraticComparison & { categoryA: BudgetCategoryId; categoryB: BudgetCategoryId }
  >();

  for (const comparison of comparisons) {
    const normalized = normalizeWishocraticComparison(comparison);
    if (!isValidWishocraticComparison(normalized)) {
      continue;
    }

    const key = `${normalized.categoryA}_${normalized.categoryB}`;
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
        categoryA: normalized.categoryA,
        categoryB: normalized.categoryB,
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
  selectedCategoryCount: number,
  hasComparisons: boolean,
): number {
  if (selectedCategoryCount > 0) {
    return selectedCategoryCount;
  }

  if (hasComparisons) {
    return ALL_BUDGET_CATEGORY_IDS.length;
  }

  return ALL_BUDGET_CATEGORY_IDS.length;
}

export function calculateAlignmentCompletionRatio(
  comparisonCount: number,
  totalPossiblePairs: number,
): number {
  if (totalPossiblePairs <= 0) {
    return 0;
  }

  return Number(Math.min(1, comparisonCount / totalPossiblePairs).toFixed(3));
}

export function buildTopPriorityHighlights(
  allocations: Record<BudgetCategoryId, number>,
  limit: number = 5,
): AlignmentPriorityHighlight[] {
  return Object.entries(allocations)
    .map(([categoryId, percentage]) => ({
      categoryId: categoryId as BudgetCategoryId,
      name: BUDGET_CATEGORIES[categoryId as BudgetCategoryId].name,
      icon: BUDGET_CATEGORIES[categoryId as BudgetCategoryId].icon,
      percentage: Number(percentage.toFixed(1)),
    }))
    .filter((category) => category.percentage > 0)
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
  comparisons: StoredWishocraticComparison[];
  selectedCategoryCount: number;
  benchmarkProfiles: AlignmentBenchmarkProfile[];
  generatedAt?: string;
  candidateSourceType?: AlignmentBenchmarkSourceType | "mixed";
  candidateSourceNote?: string;
  candidateLastSyncedAt?: string | null;
}): PersonalAlignmentReport {
  const comparisons = dedupeLatestWishocraticComparisons(input.comparisons);
  const selectedCategoryCount = resolveSelectedCategoryCount(
    input.selectedCategoryCount,
    comparisons.length > 0,
  );
  const totalPossiblePairs = calculateTotalPairs(selectedCategoryCount);
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
      unresolvedCategories: result.unresolvedCategories,
      wantsMore: gapHighlights.wantsMore,
      wantsLess: gapHighlights.wantsLess,
      closestMatches: gapHighlights.closestMatches,
    };
  });

  return {
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    comparisonCount: comparisons.length,
    selectedCategoryCount,
    totalPossiblePairs,
    completionRatio,
    isPreliminary:
      comparisons.length < PERSONAL_ALIGNMENT_PRELIMINARY_COMPARISON_THRESHOLD &&
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
  comparisonCount: number;
  selectedCategoryCount: number;
}): PersonalAlignmentEmptyState {
  const selectedCategoryCount = resolveSelectedCategoryCount(
    input.selectedCategoryCount,
    input.comparisonCount > 0,
  );
  const totalPossiblePairs = calculateTotalPairs(selectedCategoryCount);

  if (input.selectedCategoryCount === 1) {
    return {
      status: "empty",
      reason: "single_category",
      comparisonCount: input.comparisonCount,
      selectedCategoryCount,
      totalPossiblePairs,
      completionRatio: 0,
      headline: "Pick at least two categories",
      description:
        "A personal alignment report needs trade-offs. Add one more category or compare across the full budget set.",
      ctaHref: ROUTES.vote,
      ctaLabel: "Update Categories",
    };
  }

  if (input.comparisonCount > 0) {
    return {
      status: "empty",
      reason: "insufficient_data",
      comparisonCount: input.comparisonCount,
      selectedCategoryCount,
      totalPossiblePairs,
      completionRatio: calculateAlignmentCompletionRatio(
        input.comparisonCount,
        totalPossiblePairs,
      ),
      headline: "Add a few more trade-offs",
      description:
        "You have some saved data, but not enough to produce a stable report yet. Keep comparing budget pairs to sharpen the signal.",
      ctaHref: ROUTES.vote,
      ctaLabel: "Continue Comparing",
    };
  }

  return {
    status: "empty",
    reason: "no_comparisons",
    comparisonCount: 0,
    selectedCategoryCount,
    totalPossiblePairs,
    completionRatio: 0,
    headline: "Generate your first alignment report",
    description:
      "Save budget trade-offs in Wishocracy, then compare your priorities against benchmark politicians.",
    ctaHref: ROUTES.vote,
    ctaLabel: "Start Wishocracy",
  };
}
