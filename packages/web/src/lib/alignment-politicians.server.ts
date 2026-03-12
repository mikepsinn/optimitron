import { fetchers } from "@optomitron/data";
import { prisma } from "@/lib/prisma";
import { createLogger } from "@/lib/logger";
import {
  buildAllocationRecordFromStoredVotes,
  buildPartialAllocationRecordFromStoredVotes,
  deriveRecentLegislativeVoteRows,
} from "@/lib/alignment-legislative-sync.server";
import {
  ALIGNMENT_BENCHMARKS,
  type AlignmentBenchmarkProfile,
} from "@/lib/alignment-benchmarks";
import { BUDGET_CATEGORIES, type BudgetCategoryId } from "@/lib/wishocracy-data";

const logger = createLogger("alignment-politicians");
const ALIGNMENT_CATEGORY_IDS = Object.keys(BUDGET_CATEGORIES) as BudgetCategoryId[];

interface SyncablePoliticianRow {
  chamber: string | null;
  district: string | null;
  externalId: string | null;
  name: string;
  party: string | null;
  title: string | null;
  updatedAt: Date;
  votes: Array<{
    allocationPct: number;
    billId: string | null;
    itemCategory: string;
    updatedAt: Date;
    voteDate: Date | null;
  }>;
}

export interface AlignmentPoliticianSyncResult {
  skipped: boolean;
  reason?: string;
  syncedPoliticians: number;
  syncedVotes: number;
  updatedExternalIds: string[];
}

function normalizeMemberChamber(chamber: string | undefined): string | null {
  if (!chamber) {
    return null;
  }

  const value = chamber.toLowerCase();
  if (value.includes("senate")) {
    return "senate";
  }
  if (value.includes("house")) {
    return "house";
  }

  return value;
}

function defaultTitleForChamber(chamber: string | undefined): string {
  return normalizeMemberChamber(chamber) === "house" ? "Representative" : "Senator";
}

function normalizeMemberParty(
  party: string | undefined,
  fallbackParty: string,
): string {
  const normalized = party?.trim();
  if (!normalized || normalized.toLowerCase() === "unknown") {
    return fallbackParty;
  }

  return normalized;
}

function formatMemberDistrict(
  state: string | undefined,
  district: number | undefined,
  chamber: string | undefined,
): string | null {
  if (!state) {
    return null;
  }

  if (normalizeMemberChamber(chamber) === "house" && district != null) {
    return `${state}-${district}`;
  }

  return state;
}

function buildLegislativeSummary(
  allocations: Record<BudgetCategoryId, number>,
  coverageLevel: "full" | "partial",
): string {
  const topCategories = Object.entries(allocations)
    .sort((left, right) => right[1] - left[1])
    .slice(0, 3)
    .map(([categoryId]) => BUDGET_CATEGORIES[categoryId as BudgetCategoryId].name);

  if (topCategories.length === 0) {
    return "Recent classified congressional votes do not yet cover enough categories to summarize this profile.";
  }

  if (coverageLevel === "partial") {
    return `Recent classified congressional votes partially tilt this profile toward ${topCategories.join(", ")}.`;
  }

  return `Recent classified congressional votes lean most toward ${topCategories.join(", ")}.`;
}

function mergeSyncedPoliticianProfile(
  benchmark: AlignmentBenchmarkProfile,
  row: SyncablePoliticianRow,
): AlignmentBenchmarkProfile {
  const derived =
    buildAllocationRecordFromStoredVotes(row.votes) ??
    buildPartialAllocationRecordFromStoredVotes(row.votes, benchmark.allocations);
  if (!derived) {
    return benchmark;
  }

  const sourceType =
    derived.coverageLevel === "full" ? "congress_sync" : "congress_partial";
  const sourceLabel =
    derived.coverageLevel === "full"
      ? "Recent Congress vote profile"
      : "Partial Congress vote overlay";
  const sourceNote =
    derived.coverageLevel === "full"
      ? `Derived from ${derived.rollCallCount} recent classified Congress roll calls across ${derived.categoriesCovered} budget categories. This is a recent legislative support index built from bill subjects and recorded member positions, not a lifetime ideology score.`
      : `Blends Optomitron's curated benchmark with ${derived.rollCallCount} recent classified Congress roll calls across ${derived.categoriesCovered} budget categories. Covered categories tilt toward recent legislative behavior; uncovered categories stay anchored to the curated baseline.`;

  return {
    ...benchmark,
    name: row.name || benchmark.name,
    party: row.party ?? benchmark.party,
    title: row.title ?? benchmark.title,
    district: row.district ?? benchmark.district,
    chamber: row.chamber ?? benchmark.chamber,
    summary: buildLegislativeSummary(derived.allocations, derived.coverageLevel),
    sourceType,
    sourceLabel,
    sourceNote,
    categoriesCovered: derived.categoriesCovered,
    lastSyncedAt: (derived.latestVoteDate ?? row.updatedAt).toISOString(),
    rollCallCount: derived.rollCallCount,
    allocations: derived.allocations,
  };
}

export async function loadAlignmentBenchmarkProfiles(): Promise<AlignmentBenchmarkProfile[]> {
  const externalIds = ALIGNMENT_BENCHMARKS.map((profile) => profile.externalId).filter(
    (value): value is string => typeof value === "string" && value.length > 0,
  );

  if (externalIds.length === 0) {
    return ALIGNMENT_BENCHMARKS;
  }

  const politicians = await prisma.politician.findMany({
    where: {
      deletedAt: null,
      externalId: { in: externalIds },
      jurisdiction: {
        code: "US",
      },
      votes: {
        some: {
          deletedAt: null,
        },
      },
    },
    select: {
      chamber: true,
      district: true,
      externalId: true,
      name: true,
      party: true,
      title: true,
      updatedAt: true,
      votes: {
        where: {
          deletedAt: null,
        },
        orderBy: [{ voteDate: "desc" }, { updatedAt: "desc" }],
        select: {
          allocationPct: true,
          billId: true,
          itemCategory: true,
          updatedAt: true,
          voteDate: true,
        },
      },
    },
  });

  if (politicians.length === 0) {
    return ALIGNMENT_BENCHMARKS;
  }

  const byExternalId = new Map(
    politicians
      .filter((politician) => politician.externalId)
      .map((politician) => [politician.externalId as string, politician]),
  );

  return ALIGNMENT_BENCHMARKS.map((benchmark) => {
    if (!benchmark.externalId) {
      return benchmark;
    }

    const row = byExternalId.get(benchmark.externalId);
    return row ? mergeSyncedPoliticianProfile(benchmark, row) : benchmark;
  });
}

export async function syncAlignmentBenchmarkPoliticians(): Promise<AlignmentPoliticianSyncResult> {
  if (!fetchers.getCongressApiKey()) {
    return {
      skipped: true,
      reason: "CONGRESS_API_KEY is required to sync politician identities from Congress.gov.",
      syncedPoliticians: 0,
      syncedVotes: 0,
      updatedExternalIds: [],
    };
  }

  const usJurisdiction = await prisma.jurisdiction.findUnique({
    where: { code: "US" },
    select: { id: true },
  });

  if (!usJurisdiction) {
    throw new Error("US jurisdiction not found. Run the database seed before syncing politicians.");
  }

  let syncedPoliticians = 0;
  let syncedVotes = 0;
  const updatedExternalIds: string[] = [];
  const politicianIdByExternalId = new Map<string, string>();

  for (const benchmark of ALIGNMENT_BENCHMARKS) {
    if (!benchmark.externalId) {
      continue;
    }

    const member = await fetchers.fetchMemberDetails(benchmark.externalId);
    if (!member) {
      logger.warn("Skipping politician with missing Congress member data:", benchmark.externalId);
      continue;
    }

    const politician = await prisma.politician.upsert({
      where: {
        externalId: benchmark.externalId,
      },
      update: {
        chamber: normalizeMemberChamber(member.chamber),
        deletedAt: null,
        district: formatMemberDistrict(member.state, member.district, member.chamber),
        jurisdictionId: usJurisdiction.id,
        name: member.name,
        party: normalizeMemberParty(member.party, benchmark.party),
        title: defaultTitleForChamber(member.chamber),
      },
      create: {
        chamber: normalizeMemberChamber(member.chamber),
        district: formatMemberDistrict(member.state, member.district, member.chamber),
        externalId: benchmark.externalId,
        jurisdictionId: usJurisdiction.id,
        name: member.name,
        party: normalizeMemberParty(member.party, benchmark.party),
        title: defaultTitleForChamber(member.chamber),
      },
    });

    politicianIdByExternalId.set(benchmark.externalId, politician.id);
    syncedPoliticians += 1;
    updatedExternalIds.push(benchmark.externalId);
  }

  const rawVoteRows = await deriveRecentLegislativeVoteRows(updatedExternalIds);

  await prisma.politicianVote.deleteMany({
    where: {
      politicianId: {
        in: [...politicianIdByExternalId.values()],
      },
      itemCategory: {
        in: ALIGNMENT_CATEGORY_IDS,
      },
    },
  });

  if (rawVoteRows.length > 0) {
    const createdVotes = await prisma.politicianVote.createMany({
      data: rawVoteRows
        .map((row) => {
          const politicianId = politicianIdByExternalId.get(row.externalId);
          if (!politicianId) {
            return null;
          }

          return {
            politicianId,
            itemCategory: row.itemCategory,
            allocationPct: row.allocationPct,
            billId: row.billId,
            voteDate: row.voteDate,
          };
        })
        .filter((row): row is NonNullable<typeof row> => row != null),
    });
    syncedVotes = createdVotes.count;
  }

  return {
    skipped: false,
    syncedPoliticians,
    syncedVotes,
    updatedExternalIds,
  };
}
