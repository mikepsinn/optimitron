import {
  buildGlobalVariableSummaryQuery,
  buildNOf1VariableSummaryQuery,
  refreshGlobalVariableSummary,
  refreshNOf1VariableSummary,
} from "@/lib/measurement-summaries.server";
import { prisma } from "@/lib/prisma";

/**
 * Reconciles the cached measurement statistics on every GlobalVariable and
 * NOf1Variable with the `Measurement` rows they summarize.
 *
 * The MCP `recordMeasurement` write path upserted measurements without
 * refreshing these columns, so any variable ever written through MCP still
 * carries stale numbers. Both write paths refresh now; this closes the gap for
 * rows written before that fix.
 *
 * The aggregates come from `measurement-summaries.server.ts` — the same SQL the
 * write path uses — so a reconciled row and a freshly written one cannot
 * disagree. Recomputing from `Measurement` rather than adjusting what is
 * already stored makes it idempotent: a second run changes nothing.
 *
 * Safe to run against a live database. Drift is *detected* with a cheap
 * batched read, but each correction is *written* through the same locked
 * refresh the write path uses, inside its own transaction. Writing the
 * batch-read values directly would race: a measurement committed between the
 * read and the write would be clobbered by the older aggregate, leaving the
 * row stale again.
 */

export interface BackfillOptions {
  batchSize?: number;
  dryRun?: boolean;
  /**
   * Restrict the walk to specific rows instead of the whole table. Used to
   * reconcile a single variable under investigation, and to keep tests from
   * rewriting rows belonging to other suites sharing the database.
   */
  globalVariableIds?: string[];
  nOf1VariableIds?: string[];
}

export interface BackfillTableSummary {
  changed: number;
  examined: number;
}

export interface BackfillResult {
  globalVariables: BackfillTableSummary;
  nOf1Variables: BackfillTableSummary;
}

interface SummaryAggregateRow {
  count: number;
  earliestStartTime: Date | null;
  id: string;
  latestStartTime: Date | null;
  maximumRecordedValue: number | null;
  mean: number | null;
  median: number | null;
  minimumRecordedValue: number | null;
  nOf1VariableCount?: number;
  standardDeviation: number | null;
  uniqueCount: number;
  variance: number | null;
}

const DEFAULT_BATCH_SIZE = 500;

/** Falls back to the default for anything that isn't a finite positive integer. */
function sanitizeBatchSize(batchSize: number | undefined): number {
  if (batchSize === undefined || !Number.isFinite(batchSize)) {
    return DEFAULT_BATCH_SIZE;
  }
  return Math.max(1, Math.floor(batchSize));
}

/**
 * Floats round-trip through Postgres unchanged, so exact comparison is what
 * tells us a row actually drifted. Dates compare by epoch because Prisma hands
 * back distinct `Date` instances.
 */
function isSameValue(current: unknown, computed: unknown): boolean {
  if (current instanceof Date && computed instanceof Date) {
    return current.getTime() === computed.getTime();
  }
  return (current ?? null) === (computed ?? null);
}

/**
 * Walk a table's ids in id order, handing each batch to `handle`.
 *
 * Keyset pagination rather than `skip`: batches stay cheap on large tables, and
 * rows inserted while the backfill runs cannot shift the window.
 */
async function forEachIdBatch(
  loadIds: (cursor: string | null, take: number) => Promise<{ id: string }[]>,
  batchSize: number,
  explicitIds: string[] | undefined,
  handle: (ids: string[]) => Promise<void>,
) {
  if (explicitIds) {
    for (let index = 0; index < explicitIds.length; index += batchSize) {
      await handle(explicitIds.slice(index, index + batchSize));
    }
    return;
  }

  let cursor: string | null = null;
  for (;;) {
    const rows = await loadIds(cursor, batchSize);
    if (rows.length === 0) return;
    await handle(rows.map((row) => row.id));
    if (rows.length < batchSize) return;
    cursor = rows[rows.length - 1]!.id;
  }
}

async function backfillGlobalVariables(
  batchSize: number,
  dryRun: boolean,
  explicitIds: string[] | undefined,
): Promise<BackfillTableSummary> {
  const summary: BackfillTableSummary = { changed: 0, examined: 0 };

  await forEachIdBatch(
    (cursor, take) =>
      prisma.globalVariable.findMany({
        orderBy: { id: "asc" },
        select: { id: true },
        take,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      }),
    batchSize,
    explicitIds,
    async (ids) => {
      const computed = await prisma.$queryRaw<SummaryAggregateRow[]>(
        buildGlobalVariableSummaryQuery(ids),
      );
      const current = await prisma.globalVariable.findMany({
        where: { id: { in: ids } },
        select: {
          earliestMeasurementStartAt: true,
          id: true,
          latestMeasurementStartAt: true,
          maximumRecordedValue: true,
          mean: true,
          median: true,
          minimumRecordedValue: true,
          numberOfMeasurements: true,
          numberOfNOf1Variables: true,
          numberOfUniqueValues: true,
          standardDeviation: true,
          variance: true,
        },
      });
      const currentById = new Map(current.map((row) => [row.id, row]));

      for (const row of computed) {
        summary.examined += 1;
        const existing = currentById.get(row.id);
        const nOf1VariableCount = row.nOf1VariableCount ?? 0;
        const data = {
          earliestMeasurementStartAt: row.earliestStartTime,
          latestMeasurementStartAt: row.latestStartTime,
          maximumRecordedValue: row.maximumRecordedValue,
          mean: row.mean,
          median: row.median,
          minimumRecordedValue: row.minimumRecordedValue,
          numberOfMeasurements: row.count,
          numberOfNOf1Variables: nOf1VariableCount,
          numberOfUniqueValues: row.uniqueCount,
          standardDeviation: row.standardDeviation,
          variance: row.variance,
        };
        if (
          existing &&
          Object.entries(data).every(([key, value]) =>
            isSameValue(existing[key as keyof typeof existing], value),
          )
        ) {
          continue;
        }

        summary.changed += 1;
        if (dryRun) continue;
        // Recompute under the row lock rather than writing `data`, which was
        // read outside any transaction and may already be out of date.
        await prisma.$transaction((tx) =>
          refreshGlobalVariableSummary(tx, row.id),
        );
      }
    },
  );

  return summary;
}

async function backfillNOf1Variables(
  batchSize: number,
  dryRun: boolean,
  explicitIds: string[] | undefined,
): Promise<BackfillTableSummary> {
  const summary: BackfillTableSummary = { changed: 0, examined: 0 };

  await forEachIdBatch(
    (cursor, take) =>
      prisma.nOf1Variable.findMany({
        orderBy: { id: "asc" },
        select: { id: true },
        take,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      }),
    batchSize,
    explicitIds,
    async (ids) => {
      const computed = await prisma.$queryRaw<SummaryAggregateRow[]>(
        buildNOf1VariableSummaryQuery(ids),
      );
      const current = await prisma.nOf1Variable.findMany({
        where: { id: { in: ids } },
        select: {
          earliestMeasurementStartAt: true,
          id: true,
          latestMeasurementStartAt: true,
          maximumRecordedValue: true,
          mean: true,
          median: true,
          minimumRecordedValue: true,
          numberOfMeasurements: true,
          standardDeviation: true,
          variance: true,
        },
      });
      const currentById = new Map(current.map((row) => [row.id, row]));

      for (const row of computed) {
        summary.examined += 1;
        const existing = currentById.get(row.id);
        const data = {
          earliestMeasurementStartAt: row.earliestStartTime,
          latestMeasurementStartAt: row.latestStartTime,
          maximumRecordedValue: row.maximumRecordedValue,
          mean: row.mean,
          median: row.median,
          minimumRecordedValue: row.minimumRecordedValue,
          numberOfMeasurements: row.count,
          standardDeviation: row.standardDeviation,
          variance: row.variance,
        };
        if (
          existing &&
          Object.entries(data).every(([key, value]) =>
            isSameValue(existing[key as keyof typeof existing], value),
          )
        ) {
          continue;
        }

        summary.changed += 1;
        if (dryRun) continue;
        // Recompute under the row lock rather than writing `data`, which was
        // read outside any transaction and may already be out of date.
        await prisma.$transaction((tx) =>
          refreshNOf1VariableSummary(tx, row.id),
        );
      }
    },
  );

  return summary;
}

export async function backfillMeasurementSummaries(
  options: BackfillOptions = {},
): Promise<BackfillResult> {
  const batchSize = sanitizeBatchSize(options.batchSize);
  const dryRun = options.dryRun ?? false;
  return {
    globalVariables: await backfillGlobalVariables(
      batchSize,
      dryRun,
      options.globalVariableIds,
    ),
    nOf1Variables: await backfillNOf1Variables(
      batchSize,
      dryRun,
      options.nOf1VariableIds,
    ),
  };
}
