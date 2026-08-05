import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { backfillMeasurementSummaries } from "@/lib/measurement-summaries-backfill.server";
import { refreshMeasurementSummaries } from "@/lib/measurement-summaries.server";
import { prisma } from "@/lib/prisma";
import { summarizeNumericValues } from "@/lib/profile";

/**
 * `refreshMeasurementSummaries` computes its statistics in Postgres, while
 * `summarizeNumericValues` computes them in JavaScript. These tests pin the two
 * together: `VAR_POP`/`STDDEV_POP` (not the sample variants), `PERCENTILE_CONT`
 * interpolating an even-count median, and `COUNT(DISTINCT …)` all have to land
 * on the same numbers the reference implementation produces.
 */

const PREFIX = "measurement_summary_kernel_";
const GLOBAL_VARIABLE_ID = `${PREFIX}gv`;
const OWN_NOF1_ID = `${PREFIX}n1_own`;
const OTHER_NOF1_ID = `${PREFIX}n1_other`;
const OWN_SUBJECT_ID = `${PREFIX}subject_own`;
const OTHER_SUBJECT_ID = `${PREFIX}subject_other`;

const BASE_TIME = new Date("2026-05-01T00:00:00.000Z");

function startTimeAt(offsetDays: number) {
  return new Date(BASE_TIME.getTime() + offsetDays * 86_400_000);
}

async function cleanup() {
  await prisma.measurement.deleteMany({
    where: { id: { startsWith: PREFIX } },
  });
  await prisma.nOf1Variable.deleteMany({
    where: { id: { startsWith: PREFIX } },
  });
  await prisma.globalVariable.deleteMany({
    where: { id: { startsWith: PREFIX } },
  });
  await prisma.subject.deleteMany({ where: { id: { startsWith: PREFIX } } });
  await prisma.variableCategory.deleteMany({
    where: { id: { startsWith: PREFIX } },
  });
  await prisma.unit.deleteMany({ where: { id: { startsWith: PREFIX } } });
}

async function seedCatalog() {
  await prisma.unit.create({
    data: {
      abbreviatedName: `${PREFIX}pt`,
      id: `${PREFIX}unit`,
      name: `${PREFIX}Points`,
      ucumCode: `${PREFIX}pt`,
      unitCategoryId: `${PREFIX}uc`,
    },
  });
  await prisma.variableCategory.create({
    data: {
      defaultUnitId: `${PREFIX}unit`,
      id: `${PREFIX}vc`,
      name: `${PREFIX}Wellbeing`,
    },
  });
  await prisma.globalVariable.create({
    data: {
      defaultUnitId: `${PREFIX}unit`,
      id: GLOBAL_VARIABLE_ID,
      name: `${PREFIX}Shared Variable`,
      variableCategoryId: `${PREFIX}vc`,
    },
  });
  for (const [subjectId, nOf1VariableId] of [
    [OWN_SUBJECT_ID, OWN_NOF1_ID],
    [OTHER_SUBJECT_ID, OTHER_NOF1_ID],
  ] as const) {
    await prisma.subject.create({ data: { id: subjectId } });
    await prisma.nOf1Variable.create({
      data: {
        defaultUnitId: `${PREFIX}unit`,
        globalVariableId: GLOBAL_VARIABLE_ID,
        id: nOf1VariableId,
        subjectId,
      },
    });
  }
}

async function addMeasurements(
  nOf1VariableId: string,
  subjectId: string,
  values: number[],
  options: { deleted?: boolean; startOffset?: number } = {},
) {
  const startOffset = options.startOffset ?? 0;
  await prisma.measurement.createMany({
    data: values.map((value, index) => ({
      deletedAt: options.deleted ? new Date() : null,
      globalVariableId: GLOBAL_VARIABLE_ID,
      id: `${PREFIX}${nOf1VariableId}_${options.deleted ? "del_" : ""}${index}`,
      nOf1VariableId,
      originalUnitId: `${PREFIX}unit`,
      originalValue: value,
      startTime: startTimeAt(startOffset + index),
      subjectId,
      unitId: `${PREFIX}unit`,
      value,
    })),
  });
}

function refresh() {
  return prisma.$transaction((tx) =>
    refreshMeasurementSummaries(tx, {
      globalVariableId: GLOBAL_VARIABLE_ID,
      nOf1VariableId: OWN_NOF1_ID,
    }),
  );
}

/** The subset of cached columns both variable tables share. */
function toSummaryShape(row: {
  maximumRecordedValue: number | null;
  mean: number | null;
  median: number | null;
  minimumRecordedValue: number | null;
  numberOfMeasurements: number;
  standardDeviation: number | null;
  variance: number | null;
}) {
  return {
    count: row.numberOfMeasurements,
    max: row.maximumRecordedValue,
    mean: row.mean,
    median: row.median,
    min: row.minimumRecordedValue,
    standardDeviation: row.standardDeviation,
    variance: row.variance,
  };
}

function expectedSummaryShape(values: number[]) {
  const { uniqueCount: _uniqueCount, ...rest } = summarizeNumericValues(values);
  return rest;
}

describe("refreshMeasurementSummaries", () => {
  beforeEach(async () => {
    await cleanup();
    await seedCatalog();
  });

  // No $disconnect here: `prisma` is cached on globalThis, so the client is
  // shared with every other test file in this worker.
  afterAll(cleanup);

  it("matches summarizeNumericValues on an even count with duplicates", async () => {
    // Even count exercises the interpolated median; the repeated 4 separates
    // numberOfUniqueValues from numberOfMeasurements.
    const values = [2, 4, 4, 9];
    await addMeasurements(OWN_NOF1_ID, OWN_SUBJECT_ID, values);

    await refresh();

    const nOf1Variable = await prisma.nOf1Variable.findUniqueOrThrow({
      where: { id: OWN_NOF1_ID },
    });
    const globalVariable = await prisma.globalVariable.findUniqueOrThrow({
      where: { id: GLOBAL_VARIABLE_ID },
    });

    expect(toSummaryShape(nOf1Variable)).toEqual(expectedSummaryShape(values));
    expect(toSummaryShape(globalVariable)).toEqual(
      expectedSummaryShape(values),
    );
    expect(globalVariable.numberOfUniqueValues).toBe(3);
    expect(nOf1Variable.median).toBe(4);
  });

  it("matches summarizeNumericValues on an odd count", async () => {
    const values = [10, 1, 7];
    await addMeasurements(OWN_NOF1_ID, OWN_SUBJECT_ID, values);

    await refresh();

    const nOf1Variable = await prisma.nOf1Variable.findUniqueOrThrow({
      where: { id: OWN_NOF1_ID },
    });
    expect(toSummaryShape(nOf1Variable)).toEqual(expectedSummaryShape(values));
    expect(nOf1Variable.median).toBe(7);
  });

  it("reports zero variance for a single measurement", async () => {
    // STDDEV_SAMP/VAR_SAMP would return NULL here; the reference
    // implementation divides by N and returns 0.
    const values = [6];
    await addMeasurements(OWN_NOF1_ID, OWN_SUBJECT_ID, values);

    await refresh();

    const nOf1Variable = await prisma.nOf1Variable.findUniqueOrThrow({
      where: { id: OWN_NOF1_ID },
    });
    expect(toSummaryShape(nOf1Variable)).toEqual(expectedSummaryShape(values));
    expect(nOf1Variable.variance).toBe(0);
    expect(nOf1Variable.standardDeviation).toBe(0);
  });

  it("clears the statistics when every measurement is soft-deleted", async () => {
    await addMeasurements(OWN_NOF1_ID, OWN_SUBJECT_ID, [3, 5], {
      deleted: true,
    });

    await refresh();

    const nOf1Variable = await prisma.nOf1Variable.findUniqueOrThrow({
      where: { id: OWN_NOF1_ID },
    });
    expect(toSummaryShape(nOf1Variable)).toEqual(expectedSummaryShape([]));
    expect(nOf1Variable.earliestMeasurementStartAt).toBeNull();
    expect(nOf1Variable.latestMeasurementStartAt).toBeNull();
  });

  it("aggregates the global variable across subjects and the NOf1 variable within one", async () => {
    // The shared GlobalVariable spans every subject; the NOf1Variable must not.
    const ownValues = [2, 4];
    const otherValues = [100, 200];
    await addMeasurements(OWN_NOF1_ID, OWN_SUBJECT_ID, ownValues);
    await addMeasurements(OTHER_NOF1_ID, OTHER_SUBJECT_ID, otherValues, {
      startOffset: 10,
    });

    await refresh();

    const nOf1Variable = await prisma.nOf1Variable.findUniqueOrThrow({
      where: { id: OWN_NOF1_ID },
    });
    const globalVariable = await prisma.globalVariable.findUniqueOrThrow({
      where: { id: GLOBAL_VARIABLE_ID },
    });

    expect(toSummaryShape(nOf1Variable)).toEqual(
      expectedSummaryShape(ownValues),
    );
    expect(toSummaryShape(globalVariable)).toEqual(
      expectedSummaryShape([...ownValues, ...otherValues]),
    );
    expect(globalVariable.numberOfNOf1Variables).toBe(2);
    expect(nOf1Variable.earliestMeasurementStartAt).toEqual(startTimeAt(0));
    expect(globalVariable.latestMeasurementStartAt).toEqual(startTimeAt(11));
  });
});

describe("backfillMeasurementSummaries", () => {
  const values = [2, 4, 4, 9];

  beforeEach(async () => {
    await cleanup();
    await seedCatalog();
    // Measurements with no summary refresh — exactly the state the MCP write
    // path left rows in before it called refreshMeasurementSummaries.
    await addMeasurements(OWN_NOF1_ID, OWN_SUBJECT_ID, values);
  });

  // No $disconnect here: `prisma` is cached on globalThis, so the client is
  // shared with every other test file in this worker.
  afterAll(cleanup);

  it("reports stale rows without writing on a dry run", async () => {
    const result = await backfillMeasurementSummaries({ dryRun: true });

    expect(result.globalVariables.changed).toBeGreaterThanOrEqual(1);
    expect(result.nOf1Variables.changed).toBeGreaterThanOrEqual(1);

    const nOf1Variable = await prisma.nOf1Variable.findUniqueOrThrow({
      where: { id: OWN_NOF1_ID },
    });
    expect(nOf1Variable.numberOfMeasurements).toBe(0);
    expect(nOf1Variable.mean).toBeNull();
  });

  it("reconciles stale rows and is idempotent", async () => {
    await backfillMeasurementSummaries();

    const nOf1Variable = await prisma.nOf1Variable.findUniqueOrThrow({
      where: { id: OWN_NOF1_ID },
    });
    const globalVariable = await prisma.globalVariable.findUniqueOrThrow({
      where: { id: GLOBAL_VARIABLE_ID },
    });
    expect(toSummaryShape(nOf1Variable)).toEqual(expectedSummaryShape(values));
    expect(toSummaryShape(globalVariable)).toEqual(
      expectedSummaryShape(values),
    );
    expect(globalVariable.numberOfUniqueValues).toBe(3);
    expect(globalVariable.numberOfNOf1Variables).toBe(2);

    // A second pass has nothing left to correct.
    const second = await backfillMeasurementSummaries({ dryRun: true });
    expect(second.globalVariables.changed).toBe(0);
    expect(second.nOf1Variables.changed).toBe(0);
  });

  it("agrees with the write path's refresh", async () => {
    await backfillMeasurementSummaries();
    const backfilled = await prisma.nOf1Variable.findUniqueOrThrow({
      where: { id: OWN_NOF1_ID },
    });

    await prisma.$transaction((tx) =>
      refreshMeasurementSummaries(tx, {
        globalVariableId: GLOBAL_VARIABLE_ID,
        nOf1VariableId: OWN_NOF1_ID,
      }),
    );
    const refreshed = await prisma.nOf1Variable.findUniqueOrThrow({
      where: { id: OWN_NOF1_ID },
    });

    expect(toSummaryShape(refreshed)).toEqual(toSummaryShape(backfilled));
  });
});
