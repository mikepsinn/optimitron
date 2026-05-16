import { ReferralInvitationStatus } from "@optimitron/db";
import { prisma } from "@/lib/prisma";

interface DownstreamCacheSqlRow {
  userId: string | null;
  downstreamConversionCount: bigint | number | string | null;
}

export interface DownstreamCacheSummary {
  userId: string;
  downstreamConversionCount: number;
}

export interface ReferralInvitationTreeEdge {
  referrerUserId: string;
  convertedUserId: string;
}

export interface DownstreamCacheTransaction {
  user: {
    update(input: {
      data: {
        downstreamConversionCount: number;
      };
      where: { id: string };
    }): Promise<unknown>;
    updateMany(input: {
      data: {
        downstreamConversionCount: number;
      };
      where: { deletedAt: null };
    }): Promise<{ count: number }>;
  };
}

export interface DownstreamCacheClient {
  $queryRaw<T = unknown>(
    strings: TemplateStringsArray,
    ...values: unknown[]
  ): Promise<T>;
  $transaction<T>(
    callback: (tx: DownstreamCacheTransaction) => Promise<T>,
  ): Promise<T>;
}

function normalizeCount(value: bigint | number | string | null): number {
  if (value == null) return 0;
  const numeric = typeof value === "bigint" ? Number(value) : Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return 0;
  return Math.floor(numeric);
}

export function normalizeDownstreamCacheRows(
  rows: DownstreamCacheSqlRow[],
): DownstreamCacheSummary[] {
  return rows
    .map((row) => ({
      downstreamConversionCount: normalizeCount(row.downstreamConversionCount),
      userId: row.userId?.trim() ?? "",
    }))
    .filter((row) => row.userId.length > 0);
}

export function computeDownstreamCacheFromReferralEdges(
  edges: ReferralInvitationTreeEdge[],
): Map<string, DownstreamCacheSummary> {
  const childrenByReferrer = new Map<string, Set<string>>();

  for (const edge of edges) {
    if (!edge.referrerUserId || !edge.convertedUserId) continue;
    if (!childrenByReferrer.has(edge.referrerUserId)) {
      childrenByReferrer.set(edge.referrerUserId, new Set());
    }
    childrenByReferrer.get(edge.referrerUserId)!.add(edge.convertedUserId);
  }

  const summaries = new Map<string, DownstreamCacheSummary>();

  for (const rootUserId of childrenByReferrer.keys()) {
    const seen = new Set<string>();
    const queue = [rootUserId];

    while (queue.length > 0) {
      const current = queue.shift()!;
      const children = childrenByReferrer.get(current);
      if (!children) continue;

      for (const childUserId of children) {
        if (childUserId === rootUserId || seen.has(childUserId)) {
          continue;
        }

        seen.add(childUserId);
        queue.push(childUserId);
      }
    }

    summaries.set(rootUserId, {
      downstreamConversionCount: seen.size,
      userId: rootUserId,
    });
  }

  return summaries;
}

export async function loadDownstreamCacheSummaries(input?: {
  prismaClient?: DownstreamCacheClient;
}): Promise<DownstreamCacheSummary[]> {
  const db: DownstreamCacheClient = input?.prismaClient ?? prisma;

  const rows = await db.$queryRaw<DownstreamCacheSqlRow[]>`
    WITH RECURSIVE converted_edges AS (
      SELECT DISTINCT
        ri."referrerUserId" AS "referrerUserId",
        rv."userId" AS "convertedUserId"
      FROM "ReferralInvitation" ri
      INNER JOIN "ReferendumVote" rv
        ON rv."id" = ri."convertedVoteId"
      INNER JOIN "User" referrer
        ON referrer."id" = ri."referrerUserId"
       AND referrer."deletedAt" IS NULL
      INNER JOIN "User" converted_user
        ON converted_user."id" = rv."userId"
       AND converted_user."deletedAt" IS NULL
      WHERE ri."deletedAt" IS NULL
        AND rv."deletedAt" IS NULL
        AND ri."status"::text = ${ReferralInvitationStatus.CONVERTED}
        AND ri."convertedVoteId" IS NOT NULL
        AND ri."referrerUserId" <> rv."userId"
    ),
    referral_tree AS (
      SELECT
        edge."referrerUserId" AS "rootUserId",
        edge."convertedUserId",
        ARRAY[edge."referrerUserId", edge."convertedUserId"]::text[] AS path
      FROM converted_edges edge

      UNION ALL

      SELECT
        tree."rootUserId",
        edge."convertedUserId",
        tree.path || edge."convertedUserId"
      FROM referral_tree tree
      INNER JOIN converted_edges edge
        ON edge."referrerUserId" = tree."convertedUserId"
      WHERE NOT edge."convertedUserId" = ANY(tree.path)
        AND edge."convertedUserId" <> tree."rootUserId"
    ),
    unique_downstream AS (
      SELECT DISTINCT
        "rootUserId",
        "convertedUserId"
      FROM referral_tree
    )
    SELECT
      "rootUserId" AS "userId",
      COUNT(*) AS "downstreamConversionCount"
    FROM unique_downstream
    GROUP BY "rootUserId"
  `;

  return normalizeDownstreamCacheRows(rows);
}

export async function refreshUserDownstreamCache(input?: {
  prismaClient?: DownstreamCacheClient;
}): Promise<{ refreshedUsers: number; resetUsers: number }> {
  const db: DownstreamCacheClient = input?.prismaClient ?? prisma;
  const summaries = await loadDownstreamCacheSummaries({
    prismaClient: db,
  });

  return db.$transaction(async (tx) => {
    const reset = await tx.user.updateMany({
      data: {
        downstreamConversionCount: 0,
      },
      where: { deletedAt: null },
    });

    for (const summary of summaries) {
      await tx.user.update({
        data: {
          downstreamConversionCount: summary.downstreamConversionCount,
        },
        where: { id: summary.userId },
      });
    }

    return {
      refreshedUsers: summaries.length,
      resetUsers: reset.count,
    };
  });
}
