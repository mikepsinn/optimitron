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
  const fullCount = profiles.filter((profile) => profile.sourceType === "congress_sync").length;
  const partialCount = profiles.filter((profile) => profile.sourceType === "congress_partial").length;
  const curatedCount = profiles.filter((profile) => profile.sourceType === "curated_real").length;

  if (sourceTypes.size === 1 && sourceTypes.has("congress_sync")) {
    return {
      candidateLastSyncedAt: lastSyncedAt,
      candidateSourceNote:
        `All ${fullCount} benchmark politicians on this report are derived from recent classified Congress roll calls stored in Optimitron's database.`,
      candidateSourceType: "congress_sync" as const,
    };
  }

  if (sourceTypes.size === 1 && sourceTypes.has("congress_partial")) {
    return {
      candidateLastSyncedAt: lastSyncedAt,
      candidateSourceNote:
        `All ${partialCount} benchmark politicians on this report blend curated benchmark priors with limited recent classified Congress roll calls. Categories without enough recent legislative coverage remain anchored to the curated baseline.`,
      candidateSourceType: "congress_partial" as const,
    };
  }

  if (sourceTypes.size > 1) {
    return {
      candidateLastSyncedAt: lastSyncedAt,
      candidateSourceNote:
        `${fullCount} benchmark politicians are fully derived from recent classified Congress roll calls, ${partialCount} use partial live vote overlays, and ${curatedCount} still use the curated fallback benchmark set because recent legislative coverage is thin.`,
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
        itemAId: true,
        itemBId: true,
        allocationA: true,
        allocationB: true,
        updatedAt: true,
      },
    }),
    prisma.wishocraticItemInclusion.findMany({
      where: { userId, included: true },
      select: {
        itemId: true,
      },
    }),
  ]);
  const benchmarkProfiles = await loadAlignmentBenchmarkProfiles();

  if (allocations.length === 0) {
    return buildEmptyPersonalAlignmentState({
      allocationCount: 0,
      selectedItemCount: selections.length,
    });
  }

  const report = buildPersonalAlignmentReport({
    comparisons: allocations.map((allocation) => ({
      userId: allocation.userId,
      itemAId: allocation.itemAId,
      itemBId: allocation.itemBId,
      allocationA: allocation.allocationA,
      allocationB: allocation.allocationB,
      timestamp: allocation.updatedAt,
    })),
    selectedItemCount: selections.length,
    benchmarkProfiles,
    ...summarizeCandidateSource(benchmarkProfiles),
  });

  if (report.allocationCount === 0 || report.topPriorities.length === 0) {
    return buildEmptyPersonalAlignmentState({
      allocationCount: report.allocationCount,
      selectedItemCount: selections.length,
    });
  }

  return {
    status: "ready",
    report,
  };
}
