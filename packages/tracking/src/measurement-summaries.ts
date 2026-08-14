import { Prisma } from "@optimitron/db";

/**
 * Aggregate statistics for one set of measurements.
 *
 * Mirrors the `NumericSummary` shape produced by `summarizeNumericValues` in
 * `@/lib/profile`, which remains the reference implementation for arrays that
 * are already in memory. Postgres returns NULL for every statistic when no
 * measurement matches; both counts are always numbers.
 */
export interface MeasurementSummaryRow {
  count: number;
  earliestStartTime: Date | null;
  latestStartTime: Date | null;
  maximumRecordedValue: number | null;
  mean: number | null;
  median: number | null;
  minimumRecordedValue: number | null;
  standardDeviation: number | null;
  uniqueCount: number;
  variance: number | null;
}

/**
 * The aggregate select list, shared by the per-variable refresh and the
 * `scripts/backfill-measurement-summaries.ts` reconciliation so the two can
 * never compute a variable's statistics differently.
 *
 * Requires the `Measurement` table to be aliased `m`.
 *
 * - `COUNT(m."id")` rather than `COUNT(*)` so the backfill's LEFT JOIN scores
 *   a variable with no measurements as 0 instead of 1.
 * - `VAR_POP`/`STDDEV_POP`, not the `_SAMP` variants: `summarizeNumericValues`
 *   divides by N, and the sample variants would also return NULL rather than 0
 *   for a single measurement.
 * - `PERCENTILE_CONT` interpolates the two middle values on an even count,
 *   matching the reference implementation's median.
 */
const MEASUREMENT_SUMMARY_AGGREGATES = Prisma.sql`
  COUNT(m."id")::int AS "count",
  COUNT(DISTINCT m."value")::int AS "uniqueCount",
  MIN(m."value") AS "minimumRecordedValue",
  MAX(m."value") AS "maximumRecordedValue",
  AVG(m."value") AS "mean",
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY m."value") AS "median",
  VAR_POP(m."value") AS "variance",
  STDDEV_POP(m."value") AS "standardDeviation",
  MIN(m."startTime") AS "earliestStartTime",
  MAX(m."startTime") AS "latestStartTime"
`;

/**
 * Summarize every non-deleted measurement matching `scope`.
 *
 * Postgres does the arithmetic and returns a single row, so the caller's
 * transaction is not held open while measurement rows stream into Node. Both
 * scopes are served by an existing index (`Measurement.globalVariableId`,
 * `Measurement.nOf1VariableId`).
 */
async function aggregateMeasurements(
  tx: Prisma.TransactionClient,
  scope: Prisma.Sql,
): Promise<MeasurementSummaryRow> {
  const [summary] = await tx.$queryRaw<MeasurementSummaryRow[]>(Prisma.sql`
    SELECT ${MEASUREMENT_SUMMARY_AGGREGATES}
    FROM "Measurement" m
    WHERE m."deletedAt" IS NULL AND ${scope}
  `);
  if (!summary) {
    // An aggregate with no GROUP BY always returns exactly one row.
    throw new Error("Measurement summary aggregate returned no rows.");
  }
  return summary;
}

/**
 * Take a row lock on the variable whose summary we are about to rewrite.
 *
 * Aggregate-then-update is a read-then-write race: without the lock, two
 * transactions refreshing the same variable can both read, then write in the
 * opposite order, and the loser's older numbers win — leaving the cache stale
 * until some later write happens to correct it. Locking *before* the aggregate
 * serializes refreshers of the same variable, and under READ COMMITTED the
 * aggregate that follows sees a snapshot taken after the previous holder
 * committed.
 *
 * Returns false when the row is gone, so the caller can skip rather than fail
 * on a missing-record update.
 */
async function lockVariableRow(
  tx: Prisma.TransactionClient,
  table: "GlobalVariable" | "NOf1Variable",
  id: string,
): Promise<boolean> {
  const rows = await tx.$queryRaw<Array<{ id: string }>>(Prisma.sql`
    SELECT "id"
    FROM ${Prisma.raw(`"${table}"`)}
    WHERE "id" = ${id}
    FOR UPDATE
  `);
  return rows.length > 0;
}

/** Recompute and persist one GlobalVariable's cached statistics. */
export async function refreshGlobalVariableSummary(
  tx: Prisma.TransactionClient,
  globalVariableId: string,
) {
  if (!(await lockVariableRow(tx, "GlobalVariable", globalVariableId))) return;

  const summary = await aggregateMeasurements(
    tx,
    Prisma.sql`m."globalVariableId" = ${globalVariableId}`,
  );
  const nOf1VariableCount = await tx.nOf1Variable.count({
    where: {
      deletedAt: null,
      globalVariableId,
    },
  });

  await tx.globalVariable.update({
    where: { id: globalVariableId },
    data: {
      earliestMeasurementStartAt: summary.earliestStartTime,
      latestMeasurementStartAt: summary.latestStartTime,
      maximumRecordedValue: summary.maximumRecordedValue,
      mean: summary.mean,
      median: summary.median,
      minimumRecordedValue: summary.minimumRecordedValue,
      numberOfMeasurements: summary.count,
      numberOfNOf1Variables: nOf1VariableCount,
      numberOfUniqueValues: summary.uniqueCount,
      standardDeviation: summary.standardDeviation,
      variance: summary.variance,
    },
  });
}

/** Recompute and persist one NOf1Variable's cached statistics. */
export async function refreshNOf1VariableSummary(
  tx: Prisma.TransactionClient,
  nOf1VariableId: string,
) {
  if (!(await lockVariableRow(tx, "NOf1Variable", nOf1VariableId))) return;

  const summary = await aggregateMeasurements(
    tx,
    Prisma.sql`m."nOf1VariableId" = ${nOf1VariableId}`,
  );

  await tx.nOf1Variable.update({
    where: { id: nOf1VariableId },
    data: {
      earliestMeasurementStartAt: summary.earliestStartTime,
      latestMeasurementStartAt: summary.latestStartTime,
      maximumRecordedValue: summary.maximumRecordedValue,
      mean: summary.mean,
      median: summary.median,
      minimumRecordedValue: summary.minimumRecordedValue,
      numberOfMeasurements: summary.count,
      standardDeviation: summary.standardDeviation,
      variance: summary.variance,
    },
  });
}

/**
 * Recompute the cached measurement statistics on a GlobalVariable and one of
 * its NOf1Variables, and persist them.
 *
 * **Every path that writes a Measurement must call this.** The cached columns
 * (`numberOfMeasurements`, `mean`, `median`, `standardDeviation`,
 * `earliestMeasurementStartAt`, and the rest) have no other writer, so a write
 * path that skips this leaves them silently stale.
 *
 * Recomputing rather than adjusting running counters is what makes this
 * correct for the update half of an upsert: re-recording a measurement
 * replaces its value, and the previous value is not available to subtract.
 * Median and unique-value count could not be maintained incrementally anyway
 * without storing extra state.
 *
 * The two refreshes run in a fixed order — GlobalVariable, then NOf1Variable —
 * so concurrent transactions always take the two row locks the same way and
 * cannot deadlock against each other.
 */
export async function refreshMeasurementSummaries(
  tx: Prisma.TransactionClient,
  input: { globalVariableId: string; nOf1VariableId: string },
) {
  await refreshGlobalVariableSummary(tx, input.globalVariableId);
  await refreshNOf1VariableSummary(tx, input.nOf1VariableId);
}

/**
 * Grouped form of the same aggregates, for reconciling every row at once.
 *
 * The LEFT JOIN keeps variables that have no measurements in the result so the
 * backfill resets them to zero/NULL instead of leaving stale numbers behind.
 * Soft-deleted variables are included: the MCP write path undeletes a
 * GlobalVariable on upsert, so its cached statistics have to be right when it
 * comes back.
 */
export function buildGlobalVariableSummaryQuery(ids: string[]) {
  return Prisma.sql`
    SELECT
      g."id" AS "id",
      ${MEASUREMENT_SUMMARY_AGGREGATES},
      (
        SELECT COUNT(*)::int
        FROM "NOf1Variable" n
        WHERE n."globalVariableId" = g."id" AND n."deletedAt" IS NULL
      ) AS "nOf1VariableCount"
    FROM "GlobalVariable" g
    LEFT JOIN "Measurement" m
      ON m."globalVariableId" = g."id" AND m."deletedAt" IS NULL
    WHERE g."id" IN (${Prisma.join(ids)})
    GROUP BY g."id"
  `;
}

/** NOf1Variable counterpart of {@link buildGlobalVariableSummaryQuery}. */
export function buildNOf1VariableSummaryQuery(ids: string[]) {
  return Prisma.sql`
    SELECT
      n."id" AS "id",
      ${MEASUREMENT_SUMMARY_AGGREGATES}
    FROM "NOf1Variable" n
    LEFT JOIN "Measurement" m
      ON m."nOf1VariableId" = n."id" AND m."deletedAt" IS NULL
    WHERE n."id" IN (${Prisma.join(ids)})
    GROUP BY n."id"
  `;
}
