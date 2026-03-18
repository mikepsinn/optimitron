import {
  calculateAlignmentScore,
  rankPoliticians,
  type AlignmentScore as WishocracyAlignmentScore,
} from "@optimitron/wishocracy";
import { prisma } from "@/lib/prisma";
import { createLogger } from "@/lib/logger";
import {
  buildCitizenPreferenceSummary,
  type StoredWishocraticComparison,
} from "@/lib/wishocracy-alignment";
import { loadAlignmentBenchmarkProfiles } from "@/lib/alignment-politicians.server";
import { BUDGET_CATEGORIES, type BudgetCategoryId } from "@/lib/wishocracy-data";

const logger = createLogger("aggregate-alignment");

export interface CitizenPriorityEntry {
  itemId: string;
  itemName: string;
  weight: number;
  rank: number;
  ciLow?: number | null;
  ciHigh?: number | null;
}

export interface AggregateAlignmentResult {
  aggregationRunId: string;
  jurisdictionId: string;
  jurisdictionCode: string;
  comparisonCount: number;
  participantCount: number;
  consistencyRatio: number;
  politicianScores: Array<{
    politicianId: string;
    name: string;
    score: number;
    votesCompared: number;
    rank: number;
  }>;
}

export interface AggregateScoreData {
  jurisdiction: {
    id: string;
    name: string;
    code: string;
  };
  aggregationRun: {
    id: string;
    comparisonCount: number;
    participantCount: number;
    consistencyRatio: number | null;
    computedAt: string;
  };
  politicians: Array<{
    politicianId: string;
    externalId: string | null;
    name: string;
    party: string | null;
    title: string | null;
    chamber: string | null;
    district: string | null;
    score: number;
    votesCompared: number;
    categoryScores: Record<string, number>;
    rank: number;
    onChainRef: string | null;
  }>;
  citizenPriorities: CitizenPriorityEntry[];
}

/**
 * Resolve budget category display name from its ID.
 */
function getCategoryName(categoryId: string): string {
  const cat = BUDGET_CATEGORIES[categoryId as BudgetCategoryId];
  return cat?.name ?? categoryId;
}

/**
 * Compute aggregate Citizen Alignment Scores for all politicians in a jurisdiction.
 *
 * 1. Loads all WishocraticAllocation records (pairwise comparisons)
 * 2. Aggregates into citizen preference weights via eigenvector
 * 3. Loads politician vote records (benchmark profiles merged with Congress sync)
 * 4. Scores each politician against aggregate preferences
 * 5. Persists results to AggregationRun + PreferenceWeight + AlignmentScore tables
 */
export async function computeAggregateAlignmentScores(
  jurisdictionCode: string,
): Promise<AggregateAlignmentResult> {
  const jurisdiction = await prisma.jurisdiction.findUnique({
    where: { code: jurisdictionCode },
    select: { id: true, code: true },
  });

  if (!jurisdiction) {
    throw new Error(`Jurisdiction not found: ${jurisdictionCode}`);
  }

  // 1. Load all citizen comparisons from WishocraticAllocation
  const allocations = await prisma.wishocraticAllocation.findMany({
    orderBy: { updatedAt: "asc" },
    select: {
      userId: true,
      itemAId: true,
      itemBId: true,
      allocationA: true,
      allocationB: true,
      updatedAt: true,
    },
  });

  if (allocations.length === 0) {
    logger.warn("No pairwise comparisons found — cannot compute aggregate scores");
    throw new Error("No pairwise comparisons available for aggregation");
  }

  // 2. Convert to the format expected by wishocracy functions
  const comparisons: StoredWishocraticComparison[] = allocations.map((a) => ({
    userId: a.userId,
    itemAId: a.itemAId,
    itemBId: a.itemBId,
    allocationA: a.allocationA,
    allocationB: a.allocationB,
    timestamp: a.updatedAt,
  }));

  // 3. Build aggregate citizen preference summary
  const summary = buildCitizenPreferenceSummary(comparisons);

  if (summary.preferenceWeights.length === 0) {
    throw new Error("Preference aggregation produced no weights");
  }

  logger.info(
    `Aggregated ${summary.totalComparisons} comparisons from ${summary.totalParticipants} participants, CR=${summary.consistencyRatio.toFixed(3)}`,
  );

  // 4. Load politician profiles (benchmark + Congress sync)
  const benchmarkProfiles = await loadAlignmentBenchmarkProfiles();

  // 5. Score each politician
  const scores: WishocracyAlignmentScore[] = benchmarkProfiles.map((profile) => {
    const voteMap = new Map<string, number>(
      Object.entries(profile.allocations),
    );
    return calculateAlignmentScore(
      summary.preferenceWeights,
      voteMap,
      profile.politicianId,
    );
  });

  const ranked = rankPoliticians(scores);

  // 6. Persist: create AggregationRun
  const aggregationRun = await prisma.aggregationRun.create({
    data: {
      jurisdictionId: jurisdiction.id,
      comparisonCount: summary.totalComparisons,
      participantCount: summary.totalParticipants,
      consistencyRatio: summary.consistencyRatio,
    },
  });

  // 7. Persist: PreferenceWeight rows (structured, FK-linked to Item)
  if (summary.preferenceWeights.length > 0) {
    await prisma.preferenceWeight.createMany({
      data: summary.preferenceWeights.map((w) => ({
        aggregationRunId: aggregationRun.id,
        itemId: w.itemId,
        weight: w.weight,
        rank: w.rank,
        ciLow: w.ciLow ?? null,
        ciHigh: w.ciHigh ?? null,
      })),
    });
  }

  // 8. Persist: AlignmentScore records
  const dbPoliticians = await prisma.politician.findMany({
    where: {
      deletedAt: null,
      jurisdictionId: jurisdiction.id,
    },
    select: { id: true, externalId: true, name: true },
  });

  const dbPoliticianByExternalId = new Map(
    dbPoliticians
      .filter((p) => p.externalId)
      .map((p) => [p.externalId!, p]),
  );

  const scoreData = ranked
    .map((score, index) => {
      const profile = benchmarkProfiles.find(
        (p) => p.politicianId === score.politicianId,
      );
      if (!profile?.externalId) return null;

      const dbPolitician = dbPoliticianByExternalId.get(profile.externalId);
      if (!dbPolitician) return null;

      return {
        politicianId: dbPolitician.id,
        aggregationRunId: aggregationRun.id,
        score: score.score,
        votesCompared: score.votesCompared,
        categoryScores: score.categoryScores ?? {},
        rank: index + 1,
        name: dbPolitician.name,
      };
    })
    .filter((d): d is NonNullable<typeof d> => d != null);

  if (scoreData.length > 0) {
    // Create AlignmentScore records (without categoryScores — now a relation)
    await prisma.alignmentScore.createMany({
      data: scoreData.map(({ rank: _rank, name: _name, categoryScores: _cs, ...rest }) => rest),
    });

    // Create CategoryAlignmentScore child records for each score
    const createdScores = await prisma.alignmentScore.findMany({
      where: { aggregationRunId: aggregationRun.id },
      select: { id: true, politicianId: true },
    });

    const scoreByPoliticianId = new Map(
      createdScores.map((s) => [s.politicianId, s.id]),
    );

    const categoryRows = scoreData.flatMap((d) => {
      const alignmentScoreId = scoreByPoliticianId.get(d.politicianId);
      if (!alignmentScoreId) return [];
      return Object.entries(d.categoryScores).map(([itemId, scoreValue]) => ({
        alignmentScoreId,
        itemId,
        score: scoreValue,
      }));
    });

    if (categoryRows.length > 0) {
      await prisma.categoryAlignmentScore.createMany({ data: categoryRows });
    }
  }

  logger.info(
    `Persisted ${scoreData.length} alignment scores for aggregation run ${aggregationRun.id}`,
  );

  return {
    aggregationRunId: aggregationRun.id,
    jurisdictionId: jurisdiction.id,
    jurisdictionCode: jurisdictionCode,
    comparisonCount: summary.totalComparisons,
    participantCount: summary.totalParticipants,
    consistencyRatio: summary.consistencyRatio,
    politicianScores: scoreData.map((d) => ({
      politicianId: d.politicianId,
      name: d.name,
      score: Number(d.score.toFixed(1)),
      votesCompared: d.votesCompared,
      rank: d.rank,
    })),
  };
}

/**
 * Load the latest aggregate alignment scores for a jurisdiction.
 * Returns null if no aggregate run exists yet.
 */
export async function getLatestAggregateScores(
  jurisdictionCode: string,
): Promise<AggregateScoreData | null> {
  const jurisdiction = await prisma.jurisdiction.findUnique({
    where: { code: jurisdictionCode },
    select: { id: true, name: true, code: true },
  });

  if (!jurisdiction) return null;

  const latestRun = await prisma.aggregationRun.findFirst({
    where: {
      jurisdictionId: jurisdiction.id,
      deletedAt: null,
      alignmentScores: { some: { deletedAt: null } },
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      comparisonCount: true,
      participantCount: true,
      consistencyRatio: true,
      createdAt: true,
      weights: {
        select: {
          itemId: true,
          weight: true,
          rank: true,
          ciLow: true,
          ciHigh: true,
          item: { select: { name: true } },
        },
        orderBy: { rank: "asc" },
      },
    },
  });

  if (!latestRun) return null;

  const scores = await prisma.alignmentScore.findMany({
    where: {
      aggregationRunId: latestRun.id,
      deletedAt: null,
    },
    include: {
      politician: {
        select: {
          id: true,
          name: true,
          party: true,
          title: true,
          chamber: true,
          district: true,
          externalId: true,
        },
      },
      categoryScores: {
        select: { itemId: true, score: true },
      },
    },
    orderBy: { score: "desc" },
  });

  const citizenPriorities: CitizenPriorityEntry[] = latestRun.weights.map((w) => ({
    itemId: w.itemId,
    itemName: w.item.name,
    weight: w.weight,
    rank: w.rank,
    ciLow: w.ciLow,
    ciHigh: w.ciHigh,
  }));

  return {
    jurisdiction: {
      id: jurisdiction.id,
      name: jurisdiction.name,
      code: jurisdiction.code!,
    },
    aggregationRun: {
      id: latestRun.id,
      comparisonCount: latestRun.comparisonCount,
      participantCount: latestRun.participantCount,
      consistencyRatio: latestRun.consistencyRatio,
      computedAt: latestRun.createdAt.toISOString(),
    },
    politicians: scores.map((s, index) => ({
      politicianId: s.politician.id,
      externalId: s.politician.externalId,
      name: s.politician.name,
      party: s.politician.party,
      title: s.politician.title,
      chamber: s.politician.chamber,
      district: s.politician.district,
      score: Number(s.score.toFixed(1)),
      votesCompared: s.votesCompared,
      categoryScores: Object.fromEntries(
        s.categoryScores.map((cs) => [cs.itemId, cs.score]),
      ),
      rank: index + 1,
      onChainRef: s.onChainRef,
    })),
    citizenPriorities,
  };
}
