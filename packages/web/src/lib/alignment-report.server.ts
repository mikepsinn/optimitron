import { prisma } from "@/lib/prisma";
import {
  ALIGNMENT_BENCHMARK_SOURCE_NOTE,
  type AlignmentBenchmarkProfile,
} from "@/lib/alignment-benchmarks";
import {
  buildEmptyPersonalAlignmentState,
  buildPersonalAlignmentReport,
  type PersonalAlignmentState,
} from "@/lib/alignment-report";
import { loadAlignmentBenchmarkProfiles } from "@/lib/alignment-politicians.server";
import { getUsernameOrReferralCode } from "@/lib/referral.client";
import { findUserByUsernameOrReferralCode } from "@/lib/referral.server";

export interface AlignmentReportOwner {
  id: string;
  name: string | null;
  username: string | null;
  referralCode: string;
  publicIdentifier: string;
  displayName: string;
}

function summarizeCandidateSource(profiles: AlignmentBenchmarkProfile[]) {
  const sourceTypes = new Set(profiles.map((profile) => profile.sourceType));
  const lastSyncedAt = profiles
    .map((profile) => profile.lastSyncedAt)
    .filter((value): value is string => typeof value === "string" && value.length > 0)
    .sort()
    .at(-1) ?? null;

  if (sourceTypes.size === 1 && sourceTypes.has("congress_sync")) {
    return {
      candidateLastSyncedAt: lastSyncedAt,
      candidateSourceNote:
        "All benchmark politicians on this report are derived from recent classified Congress roll calls stored in Optomitron's database.",
      candidateSourceType: "congress_sync" as const,
    };
  }

  if (sourceTypes.size > 1) {
    return {
      candidateLastSyncedAt: lastSyncedAt,
      candidateSourceNote:
        "Some politicians on this report are derived from recent classified Congress roll calls, while the remainder use the curated fallback benchmark set because recent legislative coverage is still thin.",
      candidateSourceType: "mixed" as const,
    };
  }

  return {
    candidateLastSyncedAt: lastSyncedAt,
    candidateSourceNote: ALIGNMENT_BENCHMARK_SOURCE_NOTE,
    candidateSourceType: profiles[0]?.sourceType ?? "curated_real",
  };
}

export async function findAlignmentReportOwnerByIdentifier(
  identifier: string,
): Promise<AlignmentReportOwner | null> {
  const user = await findUserByUsernameOrReferralCode(identifier);
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    username: user.username,
    referralCode: user.referralCode,
    publicIdentifier: getUsernameOrReferralCode(user) ?? user.referralCode,
    displayName: user.username ? `@${user.username}` : user.name ?? "Anonymous citizen",
  };
}

export async function getPersonalAlignmentState(
  userId: string,
): Promise<PersonalAlignmentState> {
  const [allocations, selections] = await Promise.all([
    prisma.wishocraticAllocation.findMany({
      where: { userId },
      orderBy: { updatedAt: "asc" },
      select: {
        userId: true,
        categoryA: true,
        categoryB: true,
        allocationA: true,
        allocationB: true,
        updatedAt: true,
      },
    }),
    prisma.wishocraticCategorySelection.findMany({
      where: { userId, selected: true },
      select: {
        categoryId: true,
      },
    }),
  ]);
  const benchmarkProfiles = await loadAlignmentBenchmarkProfiles();

  if (allocations.length === 0) {
    return buildEmptyPersonalAlignmentState({
      comparisonCount: 0,
      selectedCategoryCount: selections.length,
    });
  }

  const report = buildPersonalAlignmentReport({
    comparisons: allocations.map((allocation) => ({
      userId: allocation.userId,
      categoryA: allocation.categoryA,
      categoryB: allocation.categoryB,
      allocationA: allocation.allocationA,
      allocationB: allocation.allocationB,
      timestamp: allocation.updatedAt,
    })),
    selectedCategoryCount: selections.length,
    benchmarkProfiles,
    ...summarizeCandidateSource(benchmarkProfiles),
  });

  if (report.comparisonCount === 0 || report.topPriorities.length === 0) {
    return buildEmptyPersonalAlignmentState({
      comparisonCount: report.comparisonCount,
      selectedCategoryCount: selections.length,
    });
  }

  return {
    status: "ready",
    report,
  };
}
